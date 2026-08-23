const postgres = require('postgres');
const path = require('path');
const fs = require('fs');

// Load env manually
const envPath = path.join(__dirname, '..', '.env');
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx < 0) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = val;
    }
} catch (e) {}

async function seed() {
    const url = process.env.DATABASE_URL;
    if (!url) { console.error('No DATABASE_URL'); process.exit(1); }
    const sql = postgres(url);
    
    const warehouseRows = [
        ['KrishiSetu Delhi Hub', 'Plot 45, Azadpur Mandi Complex, Delhi', 'Delhi', 'Delhi', 28.7041, 77.1025, true, 5000],
        ['KrishiSetu Mumbai Hub', 'Near APMC Market, Vashi, Navi Mumbai', 'Mumbai', 'Maharashtra', 19.0760, 72.8777, true, 5000],
        ['KrishiSetu Bengaluru Hub', 'Yeshwanthpur APMC Yard, Bengaluru', 'Bengaluru', 'Karnataka', 12.9716, 77.5946, true, 4000],
        ['KrishiSetu Hyderabad Hub', 'Gudimalkapur Market, Mehdipatnam', 'Hyderabad', 'Telangana', 17.3850, 78.4867, true, 4000],
        ['KrishiSetu Chennai Hub', 'Koyambedu Wholesale Market, Chennai', 'Chennai', 'Tamil Nadu', 13.0827, 80.2707, true, 3500],
        ['KrishiSetu Pune Hub', 'Market Yard, Gultekdi, Pune', 'Pune', 'Maharashtra', 18.5204, 73.8567, true, 3000],
        ['KrishiSetu Kolkata Hub', 'Kolay Market, Burrabazar, Kolkata', 'Kolkata', 'West Bengal', 22.5726, 88.3639, true, 3500],
        ['KrishiSetu Jaipur Hub', 'Murlipura APMC, Jaipur', 'Jaipur', 'Rajasthan', 26.9124, 75.7873, true, 2500],
    ];

    for (const row of warehouseRows) {
        // Postgres does not have INSERT IGNORE. Check existence manually to be safe, or just insert if we know it's empty.
        const [existing] = await sql`SELECT id FROM warehouses WHERE name = ${row[0]}`;
        if (!existing) {
            await sql`INSERT INTO warehouses (name, address, city, state, lat, lng, "isActive", capacity) VALUES (${row[0]}, ${row[1]}, ${row[2]}, ${row[3]}, ${row[4]}, ${row[5]}, ${row[6]}, ${row[7]})`;
        }
    }
    console.log('Warehouses seeded successfully!');
    await sql.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
