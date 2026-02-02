
const isUpcoming = (dateStr, timeStr) => {
    if (!dateStr) return false;

    // Manually parse YYYY-MM-DD to avoid UTC conversion issues
    // format: "2024-05-20"
    const [year, month, day] = dateStr.split('-').map(Number);

    // Create date in LOCAL time (Month is 0-indexed in JS Date)
    const date = new Date(year, month - 1, day);

    // Use provided time or default to end of day if checking just date
    const time = timeStr || '23:59';
    const [hours, minutes] = time.split(':').map(Number);

    console.log(`Input: Date=${dateStr}, Time=${timeStr}`);
    console.log(`Parsed Components: Year=${year}, Month=${month - 1}, Day=${day}`);

    date.setHours(hours, minutes, 0, 0);
    console.log(`Date object after construction: ${date.toString()} (ISO: ${date.toISOString()})`);

    const now = new Date();
    console.log(`Now: ${now.toString()}`);

    const result = date >= now;
    console.log(`Result (date >= now): ${result}`);
    return result;
};

// Simulation
// Assume today is 2026-02-02

console.log('--- Test Case 1: Today, Future Time (e.g. 14:00) ---');
// Should be TRUE (Upcoming)
isUpcoming('2026-02-02', '14:00');

console.log('\n--- Test Case 2: Today, Past Time (e.g. 09:00) ---');
// Should be FALSE (Past)
isUpcoming('2026-02-02', '09:00');

console.log('\n--- Test Case 3: Tomorrow (09:00) ---');
// Should be TRUE (Upcoming)
isUpcoming('2026-02-03', '09:00');

console.log('\n--- Test Case 4: Yesterday (14:00) ---');
// Should be FALSE (Past)
isUpcoming('2026-02-01', '14:00');
