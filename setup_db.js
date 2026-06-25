const { pool } = require('./config/db');

const setup = async () => {
    try {
        console.log('Starting full database setup...');

        // 1. Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
                email VARCHAR(255) UNIQUE NOT NULL,
                phone_number VARCHAR(20) NOT NULL,
                password_hash TEXT NOT NULL,
                timezone VARCHAR(50) DEFAULT 'UTC',
                profile_url TEXT,
                fcm_token TEXT,
                role VARCHAR(20) DEFAULT 'devotee' CHECK (role IN ('devotee', 'admin')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                token_version INTEGER DEFAULT 0,
                year_of_birth INT
            );
        `);
        console.log('Users table created/verified.');

        // 2. Create master_tasks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS master_tasks (
                id SERIAL PRIMARY KEY,
                task_name VARCHAR(255) NOT NULL,
                options JSONB NOT NULL,
                scheduled_time TIME,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_by VARCHAR(50) REFERENCES users(id),
                is_active BOOLEAN DEFAULT TRUE
            );
        `);
        console.log('Master tasks table created/verified.');

        // 3. Create user_routines table (dependency for daily_tasks)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_routines (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) REFERENCES users(id),
                task_name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                scheduled_time TIME,
                options JSONB,
                start_date DATE,
                end_date DATE,
                is_active BOOLEAN DEFAULT TRUE,
                master_task_id INTEGER REFERENCES master_tasks(id),
                notifications_enabled BOOLEAN DEFAULT TRUE,
                assigned_by VARCHAR(50) REFERENCES users(id),
                UNIQUE (user_id, master_task_id)
            );
        `);
        console.log('User routines table created/verified.');

        // 4. Create daily_tasks table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS daily_tasks (
                id VARCHAR(50) PRIMARY KEY,
                user_id VARCHAR(50) REFERENCES users(id),
                routine_id INTEGER REFERENCES user_routines(id),
                date DATE NOT NULL,
                score INTEGER CHECK (score >= 0 AND score <= 10),
                completed_at TIMESTAMP,
                last_notified_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (routine_id, date)
            );
        `);
        console.log('Daily tasks table created/verified.');

        // 5. Create email_verifications table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS email_verifications (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                otp VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Email verifications table created/verified.');

        // 6. Create refresh_tokens table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
                token TEXT NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Refresh tokens table created/verified.');

        // 7. Create user_relationships table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_relationships (
                user_relation_id VARCHAR(100) PRIMARY KEY,
                parent_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
                child_id VARCHAR(50) REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (parent_id, child_id)
            );
        `);
        console.log('User relationships table created/verified.');

        console.log('Database setup completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Database setup failed:', err);
        process.exit(1);
    }
};

setup();
