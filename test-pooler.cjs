const postgres = require('postgres');
async function check() {
    const url = 'postgresql://postgres.lvybesdevgflafnoklcn:ujwalsupabase%402005@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
    const sql = postgres(url);
    try {
        const columns = await sql`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `;
        console.log("Columns in 'users':", columns.map(c => c.column_name));
    } catch (e) {
        console.error("Connection failed:", e);
    }
    await sql.end();
}
check();
