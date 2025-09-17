import { Router, Response } from 'express';
import database from '../database/database-prod';

const router = Router();

// Process automatic weekly payments (to be called by cron job on Sundays)
router.post('/process-weekly-payments', async (req: Response, res: Response) => {
  try {
    console.log('🔄 Processing automatic weekly payments...');
    
    // Get all active loans
    const activeLoans = await database.query(`
      SELECT 
        l.*,
        a.id as account_id,
        a.balance as account_balance
      FROM loans l
      JOIN accounts a ON l.borrower_id = a.user_id
      WHERE l.status = 'active'
    `);

    console.log(`📊 Found ${activeLoans.length} active loans to process`);

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const loan of activeLoans) {
      try {
        // Check if account has sufficient balance
        if (loan.account_balance < loan.weekly_payment) {
          results.failed++;
          results.errors.push(`Insufficient funds for loan #${loan.id} (${loan.borrower_username})`);
          continue;
        }

        // Start transaction
        await database.run('BEGIN TRANSACTION');

        try {
          // Deduct payment from account
          await database.run(
            'UPDATE accounts SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [loan.weekly_payment, loan.account_id]
          );

          // Record loan payment
          await database.run(
            'INSERT INTO loan_payments (loan_id, amount) VALUES ($1, $2)',
            [loan.id, loan.weekly_payment]
          );

          // Record transaction
          await database.run(
            'INSERT INTO transactions (from_account_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4)',
            [loan.account_id, loan.weekly_payment, 'loan_repayment', `Automatic weekly payment - ${loan.weekly_payment}`]
          );

          // Check if loan is fully paid
          const totalPaid = await database.get(
            'SELECT COALESCE(SUM(amount), 0) as total FROM loan_payments WHERE loan_id = $1',
            [loan.id]
          );

          if (totalPaid.total >= loan.outstanding_balance) {
            await database.run(
              'UPDATE loans SET status = $1 WHERE id = $2',
              ['paid_off', loan.id]
            );
            console.log(`✅ Loan #${loan.id} fully paid off`);
          }

          await database.run('COMMIT');
          results.successful++;
          console.log(`✅ Processed payment for loan #${loan.id}`);
        } catch (error) {
          await database.run('ROLLBACK');
          throw error;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing loan #${loan.id}: ${error}`);
        console.error(`❌ Error processing loan #${loan.id}:`, error);
      }

      results.processed++;
    }

    console.log(`✅ Weekly payments processed: ${results.successful} successful, ${results.failed} failed`);

    res.json({
      message: 'Weekly payments processed',
      results
    });
  } catch (error) {
    console.error('❌ Error processing weekly payments:', error);
    res.status(500).json({ 
      error: 'Failed to process weekly payments',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Manual trigger for testing
router.post('/test-weekly-payments', async (req: Response, res: Response) => {
  console.log('🧪 Testing weekly payment processing...');
  // Call the same logic as the automatic route
  return router.stack.find(layer => layer.route?.path === '/process-weekly-payments')?.route?.stack[0]?.handle(req, res);
});

export default router;
