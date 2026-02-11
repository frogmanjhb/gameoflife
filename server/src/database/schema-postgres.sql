-- Game of Life Classroom Database Schema for PostgreSQL

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher')),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    class VARCHAR(10),
    email VARCHAR(255) UNIQUE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'denied')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bank accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    from_account_id INTEGER REFERENCES accounts(id),
    to_account_id INTEGER REFERENCES accounts(id),
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer', 'loan_disbursement', 'loan_repayment', 'salary', 'fine')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loans table
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    term_months INTEGER NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'denied', 'active', 'paid_off')),
    outstanding_balance DECIMAL(10,2) NOT NULL,
    monthly_payment DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    due_date DATE
);

-- Loan payments table
CREATE TABLE IF NOT EXISTS loan_payments (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Math game sessions table
CREATE TABLE IF NOT EXISTS math_game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    score INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    total_problems INTEGER NOT NULL DEFAULT 0,
    earnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Math game high scores table
CREATE TABLE IF NOT EXISTS math_game_high_scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    high_score INTEGER NOT NULL DEFAULT 0,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, difficulty)
);

-- Plugins table (shared across all towns)
CREATE TABLE IF NOT EXISTS plugins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    enabled BOOLEAN NOT NULL DEFAULT true,
    route_path VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenders table (per town/class)
CREATE TABLE IF NOT EXISTS tenders (
    id SERIAL PRIMARY KEY,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'awarded', 'closed')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    awarded_to_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    awarded_application_id INTEGER,
    awarded_at TIMESTAMP,
    paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMP,
    paid_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tender applications table
CREATE TABLE IF NOT EXISTS tender_applications (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    applicant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tender_id, applicant_id)
);

-- Jobs table (available jobs in the town)
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    salary DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Town settings table (one per class: 6A, 6B, 6C)
CREATE TABLE IF NOT EXISTS town_settings (
    id SERIAL PRIMARY KEY,
    class VARCHAR(10) NOT NULL UNIQUE CHECK (class IN ('6A', '6B', '6C')),
    town_name VARCHAR(255) NOT NULL,
    mayor_name VARCHAR(255),
    tax_rate DECIMAL(5,2) DEFAULT 5.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table (per-town announcements)
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    town_class VARCHAR(10) NOT NULL CHECK (town_class IN ('6A', '6B', '6C')),
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Land parcels table (10,000 parcels for 100x100 grid)
CREATE TABLE IF NOT EXISTS land_parcels (
    id SERIAL PRIMARY KEY,
    grid_code VARCHAR(10) NOT NULL UNIQUE,
    row_index INTEGER NOT NULL,
    col_index INTEGER NOT NULL,
    biome_type VARCHAR(50) NOT NULL CHECK (biome_type IN (
        'Savanna', 'Grassland', 'Forest', 'Fynbos', 
        'Nama Karoo', 'Succulent Karoo', 'Desert', 
        'Thicket', 'Indian Ocean Coastal Belt'
    )),
    value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    risk_level VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    pros TEXT[] DEFAULT '{}',
    cons TEXT[] DEFAULT '{}',
    owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    purchased_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(row_index, col_index)
);

-- Land purchase requests table (teacher approval queue)
CREATE TABLE IF NOT EXISTS land_purchase_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parcel_id INTEGER NOT NULL REFERENCES land_parcels(id) ON DELETE CASCADE,
    offered_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    denial_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_math_game_sessions_user_id ON math_game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_math_game_sessions_played_at ON math_game_sessions(played_at);
CREATE INDEX IF NOT EXISTS idx_math_game_high_scores_user_id ON math_game_high_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_plugins_enabled ON plugins(enabled);
CREATE INDEX IF NOT EXISTS idx_tenders_town_class ON tenders(town_class);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_paid ON tenders(paid);
CREATE INDEX IF NOT EXISTS idx_tenders_created_at ON tenders(created_at);
CREATE INDEX IF NOT EXISTS idx_tender_applications_tender_id ON tender_applications(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_applications_applicant_id ON tender_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_tender_applications_status ON tender_applications(status);
CREATE INDEX IF NOT EXISTS idx_announcements_town_class ON announcements(town_class);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_town_settings_class ON town_settings(class);
CREATE INDEX IF NOT EXISTS idx_users_job_id ON users(job_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
CREATE INDEX IF NOT EXISTS idx_land_parcels_grid_code ON land_parcels(grid_code);
CREATE INDEX IF NOT EXISTS idx_land_parcels_owner_id ON land_parcels(owner_id);
CREATE INDEX IF NOT EXISTS idx_land_parcels_biome_type ON land_parcels(biome_type);
CREATE INDEX IF NOT EXISTS idx_land_parcels_row_col ON land_parcels(row_index, col_index);
CREATE INDEX IF NOT EXISTS idx_land_purchase_requests_user_id ON land_purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_land_purchase_requests_parcel_id ON land_purchase_requests(parcel_id);
CREATE INDEX IF NOT EXISTS idx_land_purchase_requests_status ON land_purchase_requests(status);

-- Pending transfers table (teacher approval for student-to-student transfers)
CREATE TABLE IF NOT EXISTS pending_transfers (
    id SERIAL PRIMARY KEY,
    from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    denial_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_from_user ON pending_transfers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_to_user ON pending_transfers(to_user_id);
CREATE INDEX IF NOT EXISTS idx_pending_transfers_status ON pending_transfers(status);
