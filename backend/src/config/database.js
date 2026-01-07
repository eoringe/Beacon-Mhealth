const { Pool } = require('pg');
require('dotenv').config();

/**
 * Database Connection Pool (Local App Database)
 * Optimized for 100k+ concurrent users
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

    // Connection Pool Settings
    max: 20,                        // Max connections (tune based on DB server capacity)
    min: 2,                         // Min idle connections
    idleTimeoutMillis: 30000,       // Close idle connections after 30s
    connectionTimeoutMillis: 5000,  // Fail fast if can't connect in 5s

    // Query Settings
    statement_timeout: 30000,       // Kill queries running longer than 30s
    query_timeout: 30000,           // Client-side timeout
});

// Track connection pool metrics
let activeConnections = 0;
let totalQueries = 0;

pool.on('connect', () => {
    activeConnections++;
    if (activeConnections === 1) {
        console.log('✅ Connected to PostgreSQL database');
    }
});

pool.on('remove', () => {
    activeConnections--;
});

pool.on('error', (err) => {
    console.error('❌ Database pool error:', err.message);
    // Don't exit in production - let the pool recover
    if (process.env.NODE_ENV !== 'production') {
        process.exit(-1);
    }
});

/**
 * Query helper function with metrics
 */
const query = async (text, params) => {
    const start = Date.now();
    totalQueries++;

    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        // Only log slow queries in production (>500ms)
        if (process.env.NODE_ENV === 'production') {
            if (duration > 500) {
                console.warn('⚠️ Slow query', {
                    query: text.substring(0, 100),
                    duration: `${duration}ms`,
                    rows: res.rowCount
                });
            }
        } else {
            console.log('Executed query', {
                text: text.substring(0, 80),
                duration,
                rows: res.rowCount
            });
        }

        return res;
    } catch (error) {
        console.error('Database query error:', error.message);
        throw error;
    }
};

/**
 * Get pool statistics (useful for health checks)
 */
const getPoolStats = () => ({
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount,
    totalQueries
});

module.exports = {
    query,
    pool,
    getPoolStats
};
