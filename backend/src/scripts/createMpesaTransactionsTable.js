
const { pool } = require('../config/database');

async function createMpesaTransactionsTable() {
    const client = await pool.connect();
    try {
        console.log('Creating mpesa_transactions table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS mpesa_transactions (
                id SERIAL PRIMARY KEY,
                checkout_request_id VARCHAR(255) UNIQUE NOT NULL,
                merchant_request_id VARCHAR(255),
                payment_type VARCHAR(50) NOT NULL DEFAULT 'appointment',
                reference_id VARCHAR(255) NOT NULL DEFAULT '0',
                amount DECIMAL(10, 2) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed, cancelled
                mpesa_receipt_number VARCHAR(50),
                result_desc TEXT,
                appointment_data JSONB, -- Store temp appointment data to create it later
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Add index for fast lookups
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_mpesa_checkout_id ON mpesa_transactions(checkout_request_id);
        `);

        console.log('mpesa_transactions table created successfully');
    } catch (error) {
        console.error('Error creating mpesa_transactions table:', error);
    } finally {
        client.release();
        pool.end();
    }
}

createMpesaTransactionsTable();
