const { externalQuery } = require('../config/externalDatabase');

async function cleanupStatuses() {
    console.log('--- Appointment Status Cleanup Script ---');
    console.log('Target: Normalizing statuses to "canceled" (one L)');

    try {
        // 1. Check current counts
        console.log('\nCurrent Status Counts:');
        const counts = await externalQuery(`
            SELECT status, COUNT(*) as count 
            FROM appointments 
            WHERE status IN ('cancelled', 'rejected', 'canceled')
            GROUP BY status
        `);

        if (counts.rows.length === 0) {
            console.log('No cancelled/rejected appointments found.');
        } else {
            console.table(counts.rows);
        }

        // 2. Update 'cancelled' -> 'canceled'
        console.log('\nNormalization 1: "cancelled" (2Ls) -> "canceled"');
        const update1 = await externalQuery(`
            UPDATE appointments
            SET status = 'canceled', updated_at = NOW()
            WHERE status = 'cancelled'
        `);
        console.log(`Updated ${update1.rowCount} rows.`);

        // 3. Update 'rejected' -> 'canceled' (if desired per report recommendations)
        // Report said: "Run a SQL migration to normalize existing data: UPDATE ... WHERE status IN ('cancelled', 'rejected')"
        console.log('\nNormalization 2: "rejected" -> "canceled"');
        const update2 = await externalQuery(`
            UPDATE appointments
            SET status = 'canceled', updated_at = NOW()
            WHERE status = 'rejected'
        `);
        console.log(`Updated ${update2.rowCount} rows.`);

        // 4. Verify Final State
        console.log('\nFinal Status Counts:');
        const finalCounts = await externalQuery(`
            SELECT status, COUNT(*) as count 
            FROM appointments 
            WHERE status IN ('cancelled', 'rejected', 'canceled')
            GROUP BY status
        `);
        console.table(finalCounts.rows);

    } catch (error) {
        console.error('Cleanup Error:', error);
    } finally {
        process.exit();
    }
}

cleanupStatuses();
