# Super Admin Setup Guide

## Creating a Super Admin Account

The super admin account allows you to manage multiple schools from a central dashboard.

### Method 1: Using the Script (Recommended)

Run the create-super-admin script:

```bash
# From the server directory
cd server
node create-super-admin.js
```

Or with username and password as arguments:

```bash
node create-super-admin.js admin mypassword123
```

Or using npm script:

```bash
npm run create-super-admin
```

The script will:
- Prompt for username and password (if not provided as arguments)
- Check if the user already exists
- Create or update the user to super_admin role
- Set `school_id = NULL` (required for super_admin)

### Method 2: Direct SQL

You can also create the super admin directly via SQL:

```sql
-- Hash your password first (use bcrypt with 10 rounds)
-- Or use: node -e "const bcrypt=require('bcryptjs');bcrypt.hash('yourpassword',10).then(h=>console.log(h))"

INSERT INTO users (username, password_hash, role, school_id, status)
VALUES (
  'admin',
  '$2a$10$YourHashedPasswordHere',  -- Replace with actual bcrypt hash
  'super_admin',
  NULL,  -- Super admin must have NULL school_id
  'approved'
);
```

### Method 3: Using Railway CLI

If deployed on Railway:

```bash
railway run --service backend node create-super-admin.js admin mypassword123
```

## Default Credentials

**No default credentials are set** - you must create the super admin account manually for security.

## After Creating Super Admin

1. **Login**: Go to `/login` and select any school (super admin can login from any school)
2. **Access Dashboard**: Navigate to `/admin` to access the super admin dashboard
3. **Change Password**: Consider changing the password after first login

## Super Admin Capabilities

- View all schools with aggregated statistics
- Create new schools
- Create teachers for any school (including first teacher for new schools)
- View detailed school information (financial, users, activity)
- Archive/reactivate schools
- View system-wide analytics
- **Cannot** see individual student data (only aggregated statistics)

## Creating Teachers for Schools

### First Teacher for a New School

When creating a new school, you have two options:

**Option 1: Create teacher during school creation**
- Check "Create first teacher for this school" in the Create School form
- Fill in teacher details (username, password, name, email)
- Teacher will be created automatically after school is created

**Option 2: Create teacher after school creation**
- Create the school first
- Open the school detail view
- Go to "Users" tab
- Click "Add Teacher" button
- Fill in teacher details and create

### Additional Teachers

After the first teacher is created:
- **Super Admin** can create additional teachers via the school detail view
- **Existing Teachers** can create additional teachers via `/api/auth/register-teacher` endpoint (requires teacher authentication)

### API Endpoint

Super admin can also create teachers via API:
```
POST /api/admin/schools/:id/teachers
Body: {
  username: string,
  password: string,
  first_name?: string,
  last_name?: string,
  email?: string
}
```

## Security Notes

- Super admin accounts have `school_id = NULL`
- Super admin can login from any school selection (school_id is ignored)
- Super admin can only see aggregated data, not individual student records
- Change default passwords immediately after setup

## Troubleshooting

**"User already exists" error:**
- The script will ask if you want to update the existing user to super_admin
- Or manually update: `UPDATE users SET role = 'super_admin', school_id = NULL WHERE username = 'yourusername'`

**"Cannot login" error:**
- Ensure the migration has been run: `022_multi_tenant_schools.sql`
- Verify the user has `role = 'super_admin'` and `school_id = NULL`
- Check that the JWT_SECRET matches between server restarts
