/**
 * Full DB restore seed script
 * Recreates: admin, farmers, consumers, farms, crops
 * 
 * Login credentials:
 *   Admin:    phone=9999999999  password=Admin@123
 *   Farmer 1: phone=7000000001  role=farmer
 *   Farmer 2: phone=7000000002  role=farmer
 *   Consumer: phone=8000000001  role=consumer
 */
const postgres = require('postgres');
const crypto = require('crypto');

function hashPassword(password) {
    const salt = 'smartfarm_salt_2024';
    return crypto.createHash('sha256').update(password + salt).digest('hex');
}

const ADMIN_PASS = hashPassword('Admin@123');

async function seed() {
    const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/smartfarm';
    const sql = postgres(url);
    console.log('Connected to DB');

    // ── 1. Clear orphaned farms ─────────────────────────────
    // Keep farms but we'll re-create the users that match
    
    // ── 2. Insert Users ─────────────────────────────────────
    // Use INSERT IGNORE so if user exists (like ids 1,2) we skip
    // Use specific IDs to match existing farms (farmerId 10,13,15,16,18)
    
    const usersToInsert = [
        // Admin
        {
            id: 100,
            unionId: 'admin_9999999999_seed',
            name: 'KrishiSetu Admin',
            phone: '9999999999',
            role: 'admin',
            avatar: null,
            password: ADMIN_PASS,
            isVerified: true,
            isProfileComplete: true,
        },
        // Farmers (IDs must match orphaned farms: farmerId 10,13,15,16,18)
        {
            id: 10,
            unionId: 'farmer_7000000001_seed',
            name: 'Rajesh Kumar',
            phone: '7000000001',
            role: 'farmer',
            avatar: null,
            password: null,
            isVerified: true,
            isProfileComplete: true,
            location: 'Pune, Maharashtra',
            lat: 18.5204,
            lng: 73.8567,
        },
        {
            id: 13,
            unionId: 'farmer_7000000002_seed',
            name: 'Sita Devi',
            phone: '7000000002',
            role: 'farmer',
            avatar: null,
            password: null,
            isVerified: true,
            isProfileComplete: true,
            location: 'Hyderabad, Telangana',
            lat: 17.3850,
            lng: 78.4867,
        },
        {
            id: 15,
            unionId: 'farmer_7000000003_seed',
            name: 'Ravi Shankar',
            phone: '7000000003',
            role: 'farmer',
            avatar: null,
            password: null,
            isVerified: true,
            isProfileComplete: true,
            location: 'Jaipur, Rajasthan',
            lat: 26.9124,
            lng: 75.7873,
        },
        {
            id: 16,
            unionId: 'farmer_7000000004_seed',
            name: 'Ram Prasad',
            phone: '7000000004',
            role: 'farmer',
            avatar: null,
            password: null,
            isVerified: true,
            isProfileComplete: true,
            location: 'Delhi',
            lat: 28.7041,
            lng: 77.1025,
        },
        {
            id: 18,
            unionId: 'farmer_7000000005_seed',
            name: 'Mohammad Irfan',
            phone: '7000000005',
            role: 'farmer',
            avatar: null,
            password: null,
            isVerified: true,
            isProfileComplete: true,
            location: 'Mumbai, Maharashtra',
            lat: 19.0760,
            lng: 72.8777,
        },
        // Consumers
        {
            id: 200,
            unionId: 'consumer_8000000001_seed',
            name: 'Priya Sharma',
            phone: '8000000001',
            role: 'consumer',
            avatar: null,
            password: null,
            isVerified: true,
            isProfileComplete: true,
        },
        {
            id: 201,
            unionId: 'consumer_8000000002_seed',
            name: 'Arjun Mehta',
            phone: '8000000002',
            role: 'consumer',
            avatar: null,
            password: null,
            isVerified: true,
            isProfileComplete: true,
        },
    ];

    for (const u of usersToInsert) {
        await sql`INSERT INTO users 
             (id, "unionId", name, phone, role, avatar, password, "isVerified", "isProfileComplete", location, lat, lng, "createdAt", "updatedAt", "lastSignInAt")
             VALUES (${u.id}, ${u.unionId}, ${u.name}, ${u.phone}, ${u.role}, ${u.avatar || null}, ${u.password || null}, ${u.isVerified}, ${u.isProfileComplete}, ${u.location || null}, ${u.lat || null}, ${u.lng || null}, NOW(), NOW(), NOW())
             ON CONFLICT ("unionId") DO NOTHING`;
        console.log('Inserted user:', u.name, '(' + u.role + ')');
    }

    // ── 3. Insert Crops for farmers ─────────────────────────
    const crops = [
        // Farm 4 (Rajesh - Green Acres Farm, farmerId=10)
        { farmId: 4, farmerId: 10, name: 'Tomatoes',       category: 'vegetables', price: 35,  unit: 'kg',    stock: 500,  description: 'Fresh organic tomatoes from Green Acres Farm',       image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400', isAvailable: true, isOrganic: true },
        { farmId: 4, farmerId: 10, name: 'Onions',         category: 'vegetables', price: 28,  unit: 'kg',    stock: 800,  description: 'Premium red onions, freshly harvested',              image: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31?w=400', isAvailable: true, isOrganic: false },
        { farmId: 4, farmerId: 10, name: 'Potatoes',       category: 'vegetables', price: 22,  unit: 'kg',    stock: 1000, description: 'Farm-fresh potatoes, great for all cooking',         image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400', isAvailable: true, isOrganic: false },

        // Farm 5 (Sita - sodo farms, farmerId=13)
        { farmId: 5, farmerId: 13, name: 'Spinach',        category: 'vegetables', price: 45,  unit: 'kg',    stock: 200,  description: 'Tender fresh spinach, naturally grown',             image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', isAvailable: true, isOrganic: true },
        { farmId: 5, farmerId: 13, name: 'Chillies',       category: 'vegetables', price: 120, unit: 'kg',    stock: 150,  description: 'Hot green chillies from Telangana farms',           image: 'https://images.unsplash.com/photo-1599199009804-b0ad0f41c55e?w=400', isAvailable: true, isOrganic: false },
        { farmId: 5, farmerId: 13, name: 'Wheat',          category: 'grains',     price: 28,  unit: 'kg',    stock: 2000, description: 'Premium quality wheat grains',                      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', isAvailable: true, isOrganic: false },

        // Farm 7 (Ravi - ro farms, farmerId=15)
        { farmId: 7, farmerId: 15, name: 'Mango',          category: 'fruits',     price: 95,  unit: 'kg',    stock: 300,  description: 'Sweet Alphonso mangoes from Rajasthan',             image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', isAvailable: true, isOrganic: true },
        { farmId: 7, farmerId: 15, name: 'Garlic',         category: 'vegetables', price: 180, unit: 'kg',    stock: 100,  description: 'Freshly dried garlic bulbs',                        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400', isAvailable: true, isOrganic: false },

        // Farm 8 (Ram - Ram fields, farmerId=16)
        { farmId: 8, farmerId: 16, name: 'Rice (Basmati)', category: 'grains',     price: 85,  unit: 'kg',    stock: 1500, description: 'Long grain Basmati rice, Premium quality',         image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', isAvailable: true, isOrganic: false },
        { farmId: 8, farmerId: 16, name: 'Mustard Seeds',  category: 'others',     price: 75,  unit: 'kg',    stock: 400,  description: 'Pure yellow mustard seeds',                         image: 'https://images.unsplash.com/photo-1612198790700-571bc7b23c1c?w=400', isAvailable: true, isOrganic: false },

        // Farm 9 (Mohammad - mo farms, farmerId=18)
        { farmId: 9, farmerId: 18, name: 'Sugarcane',      category: 'others',     price: 18,  unit: 'kg',    stock: 5000, description: 'Fresh sugarcane stalks from Maharashtra',          image: 'https://images.unsplash.com/photo-1547329578-8efbb0c07b90?w=400', isAvailable: true, isOrganic: false },
        { farmId: 9, farmerId: 18, name: 'Bananas',        category: 'fruits',     price: 55,  unit: 'kg',    stock: 600,  description: 'Ripe yellow bananas, fresh from the bunch',        image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', isAvailable: true, isOrganic: true },
        { farmId: 9, farmerId: 18, name: 'Coconut',        category: 'fruits',     price: 40,  unit: 'piece', stock: 500,  description: 'Fresh mature coconuts from coastal farms',         image: 'https://images.unsplash.com/photo-1582655431-c31df7d1d39f?w=400', isAvailable: true, isOrganic: true },
    ];

    for (const c of crops) {
        await sql`INSERT INTO crops ("farmId", "farmerId", name, category, price, unit, stock, description, image, "isAvailable", "isOrganic", "createdAt", "updatedAt")
             VALUES (${c.farmId}, ${c.farmerId}, ${c.name}, ${c.category}, ${c.price}, ${c.unit}, ${c.stock}, ${c.description}, ${c.image}, ${c.isAvailable}, ${c.isOrganic}, NOW(), NOW())`;
        console.log('Inserted crop:', c.name, '(farmer:', c.farmerId + ')');
    }


    // ── 4. Verify ───────────────────────────────────────────
    const allUsers = await sql`SELECT id, name, phone, role FROM users ORDER BY id`;
    console.log('\n✅ Final users:');
    allUsers.forEach(u => console.log('  ', u.id, u.role, u.phone, u.name));

    const allCrops = await sql`SELECT id, name, "farmerId", "isAvailable" FROM crops ORDER BY "farmerId"`;
    console.log('\n✅ Final crops:', allCrops.length);
    allCrops.forEach(c => console.log('  ', c.id, c.name, '(farmer:', c.farmerId + ')'));

    await sql.end();
    console.log('\n🎉 Seed complete!');
}

seed().catch(e => { console.error('SEED ERROR:', e.message); process.exit(1); });
