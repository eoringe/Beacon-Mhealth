/**
 * Seed Script: Populate doctors table with sample data
 * Run this script to add initial doctors with different specialties
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const doctors = [
    {
        name: 'Dr. Sarah Johnson',
        specialty: 'Pediatrician',
        email: 'sarah.johnson@beaconhealth.com',
        phone: '+254 712 345 678',
        photo_url: 'https://i.pravatar.cc/150?img=48',
        bio: 'Board-certified pediatrician with 12 years of experience specializing in child development and preventive care.'
    },
    {
        name: 'Dr. Michael Chen',
        specialty: 'Child Psychologist',
        email: 'michael.chen@beaconhealth.com',
        phone: '+254 723 456 789',
        photo_url: 'https://i.pravatar.cc/150?img=12',
        bio: 'Licensed clinical psychologist focusing on behavioral therapy and developmental disorders in children.'
    },
    {
        name: 'Dr. Emily Patel',
        specialty: 'Nutritionist',
        email: 'emily.patel@beaconhealth.com',
        phone: '+254 734 567 890',
        photo_url: 'https://i.pravatar.cc/150?img=47',
        bio: 'Pediatric nutritionist specializing in childhood nutrition, feeding challenges, and dietary planning.'
    },
    {
        name: 'Dr. James Wilson',
        specialty: 'Developmental Therapist',
        email: 'james.wilson@beaconhealth.com',
        phone: '+254 745 678 901',
        photo_url: 'https://i.pravatar.cc/150?img=13',
        bio: 'Experienced occupational therapist working with children on motor skills and sensory integration.'
    },
    {
        name: 'Dr. Maria Rodriguez',
        specialty: 'Speech Therapist',
        email: 'maria.rodriguez@beaconhealth.com',
        phone: '+254 756 789 012',
        photo_url: 'https://i.pravatar.cc/150?img=49',
        bio: 'Speech-language pathologist helping children with communication and language development.'
    },
    {
        name: 'Dr. David Kim',
        specialty: 'Pediatrician',
        email: 'david.kim@beaconhealth.com',
        phone: '+254 767 890 123',
        photo_url: 'https://i.pravatar.cc/150?img=14',
        bio: 'General pediatrician with expertise in immunizations and wellness checkups for children.'
    }
];

const seedDoctors = async () => {
    const client = await pool.connect();
    try {
        console.log('Seeding doctors table...');

        for (const doctor of doctors) {
            const query = `
                INSERT INTO doctors (name, specialty, email, phone, photo_url, bio, is_available)
                VALUES ($1, $2, $3, $4, $5, $6, true)
                ON CONFLICT (email) DO UPDATE SET
                    name = EXCLUDED.name,
                    specialty = EXCLUDED.specialty,
                    phone = EXCLUDED.phone,
                    photo_url = EXCLUDED.photo_url,
                    bio = EXCLUDED.bio,
                    updated_at = NOW()
                RETURNING id, name, specialty;
            `;

            const result = await client.query(query, [
                doctor.name,
                doctor.specialty,
                doctor.email,
                doctor.phone,
                doctor.photo_url,
                doctor.bio
            ]);

            console.log(`✅ Added/Updated: ${result.rows[0].name} - ${result.rows[0].specialty}`);
        }

        console.log(`\n✅ Successfully seeded ${doctors.length} doctors!`);
    } catch (error) {
        console.error('❌ Error seeding doctors:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Run seed
if (require.main === module) {
    seedDoctors()
        .then(() => {
            console.log('Seed completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Seed failed:', error);
            process.exit(1);
        });
}

module.exports = { seedDoctors };
