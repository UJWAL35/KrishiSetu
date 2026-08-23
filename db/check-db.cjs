const postgres = require('postgres');

async function check() {
    const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartfarm';
    const sql = postgres(url);
    
    console.log('\n=== USERS ===');
    const users = await sql`SELECT id, name, phone, role, "isVerified" FROM users`;
    console.log(JSON.stringify(users, null, 2));
    
    console.log('\n=== CROPS ===');
    const crops = await sql`SELECT id, name, "farmerId", "isAvailable" FROM crops`;
    console.log(JSON.stringify(crops, null, 2));

    console.log('\n=== FARMS ===');
    const farms = await sql`SELECT id, "farmerId", name FROM farms`;
    console.log(JSON.stringify(farms, null, 2));

    console.log('\n=== WAREHOUSES ===');
    const wh = await sql`SELECT id, name, city FROM warehouses`;
    console.log(JSON.stringify(wh, null, 2));

    console.log('\n=== TABLES IN DB ===');
    const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
    console.log(JSON.stringify(tables, null, 2));

    await sql.end();
}

check().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
