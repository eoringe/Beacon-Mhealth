require('dotenv').config();
const { Pool } = require('pg');

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...\n');

    // Show configuration (hide password)
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ DATABASE_URL not found in environment variables');
        console.log('\n📝 Make sure you have a .env file with DATABASE_URL set');
        process.exit(1);
    }

    console.log('📋 Database Configuration:');
    console.log('DATABASE_URL:', dbUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
    console.log('');

    const pool = new Pool({
        connectionString: dbUrl,
    });

    try {
        console.log('🔌 Attempting to connect...');
        const client = await pool.connect();

        console.log('✅ Successfully connected to database!');

        // Get PostgreSQL version
        const result = await client.query('SELECT version()');
        console.log('\n📊 PostgreSQL Version:');
        console.log(result.rows[0].version);

        // Check if children table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'children'
            )
        `);

        console.log('\n📁 Tables Status:');
        console.log('children table exists:', tableCheck.rows[0].exists);

        // Check if milestone_responses table exists
        const milestoneTableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'milestone_responses'
            )
        `);
        console.log('milestone_responses table exists:', milestoneTableCheck.rows[0].exists);

        client.release();
        await pool.end();

        console.log('\n✅ Database connection test passed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database connection failed!');
        console.error('\nError details:');
        console.error('Code:', error.code);
        console.error('Message:', error.message);

        console.log('\n🔧 Troubleshooting:');

        if (error.code === 'ECONNREFUSED') {
            console.log('1. PostgreSQL is not running. Start PostgreSQL service:');
            console.log('   - Windows: Check services.msc or pg_ctl start');
            console.log('   - Mac: brew services start postgresql');
            console.log('   - Linux: sudo systemctl start postgresql');
            console.log('\n2. Check if PostgreSQL is installed:');
            console.log('   Run: psql --version');
            console.log('\n3. Verify DATABASE_URL points to correct host and port');
        } else if (error.code === 'ENOTFOUND') {
            console.log('Database host not found. Check your DATABASE_URL');
        } else if (error.code === '28P01') {
            console.log('Authentication failed. Check username/password in DATABASE_URL');
        } else if (error.code === '3D000') {
            console.log('Database does not exist. Create it first:');
            console.log('   createdb your_database_name');
        }

        await pool.end();
        process.exit(1);
    }
}

testDatabaseConnection();
