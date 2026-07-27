const mysql = require('mysql2/promise');

async function check() {
    const url = 'mysql://root:ujwalsql%402005@localhost:3306/smartfarm';
    const conn = await mysql.createConnection(url);
    
    console.log('\n=== USERS ===');
    const [users] = await conn.query('SELECT id, name, phone, role, isVerified FROM users');
    console.log(JSON.stringify(users, null, 2));
    
    console.log('\n=== CROPS ===');
    const [crops] = await conn.query('SELECT id, name, farmerId, isAvailable FROM crops');
    console.log(JSON.stringify(crops, null, 2));

    console.log('\n=== FARMS ===');
    const [farms] = await conn.query('SELECT id, farmerId, name FROM farms');
    console.log(JSON.stringify(farms, null, 2));

    console.log('\n=== WAREHOUSES ===');
    const [wh] = await conn.query('SELECT id, name, city FROM warehouses');
    console.log(JSON.stringify(wh, null, 2));

    console.log('\n=== TABLES IN DB ===');
    const [tables] = await conn.query('SHOW TABLES');
    console.log(JSON.stringify(tables, null, 2));

    await conn.end();
}

check().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
