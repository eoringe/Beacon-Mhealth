/**
 * External Database Configuration
 * Connection pool for the Laravel/PostgreSQL database
 * Optimized for 100k+ concurrent users
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create a separate pool for the external Laravel database
const externalPool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

    // Connection Pool Settings (production-ready)
    max: 20,                        // Max connections
    min: 2,                         // Min idle connections  
    idleTimeoutMillis: 30000,       // Close idle connections after 30s
    connectionTimeoutMillis: 5000,  // Fail fast if can't connect in 5s

    // Query Settings
    statement_timeout: 30000,       // Kill queries running longer than 30s
    query_timeout: 30000,           // Client-side timeout
});

// Track connection status
let isConnected = false;

// Test connection
externalPool.on('connect', () => {
    if (!isConnected) {
        console.log('✅ Connected to external Laravel database');
        isConnected = true;
    }
});

externalPool.on('error', (err) => {
    console.error('❌ External database error on idle client', err);
    isConnected = false;
});

// Query helper function for external database
const externalQuery = async (text, params) => {
    const start = Date.now();
    try {
        const res = await externalPool.query(text, params);
        const duration = Date.now() - start;
        console.log('External DB query', { text: text.substring(0, 100) + '...', duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('External database query error:', error);
        throw error;
    }
};

// Test connection function
const testExternalConnection = async () => {
    try {
        const result = await externalPool.query('SELECT NOW()');
        console.log('✅ External database connection test successful:', result.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ External database connection test failed:', error.message);
        return false;
    }
};

module.exports = {
    externalQuery,
    externalPool,
    testExternalConnection
};
