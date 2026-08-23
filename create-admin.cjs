const postgres = require('postgres');
const { createHash } = require('crypto');
require('dotenv').config();

function hashPassword(password) {
    const salt = "smartfarm_salt_2024";
    return createHash("sha256").update(password + salt).digest("hex");
}

async function createAdmin() {
    const url = process.env.DATABASE_URL;
    const sql = postgres(url, { max: 1 });

    try {
        await sql`
            INSERT INTO users ("unionId", "name", "email", "phone", "role", "isVerified", "password")
            VALUES ('admin_123', 'Admin User', 'admin@smartfarm.com', '9999999999', 'admin', true, ${hashPassword('admin123')})
            ON CONFLICT ("unionId") DO UPDATE SET
                password = EXCLUDED.password,
                phone = EXCLUDED.phone;
        `;
        console.log("Admin account created successfully!");
    } catch (e) {
        console.error("Failed to create admin:", e.message);
    } finally {
        await sql.end();
    }
}
createAdmin();
