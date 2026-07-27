import { getDb } from "../api/queries/connection";
import { users, farms, crops, schemes, reviews, orders, notifications, sensorIssues, sensorReadings } from "./schema";
import { createHash } from "crypto";

function hashPassword(password: string): string {
    const salt = "smartfarm_salt_2024";
    return createHash("sha256").update(password + salt).digest("hex");
}

async function seed() {
    const db = getDb();
    console.log("Seeding database...");

    // Clean up existing data to prevent duplicate entry errors
    await db.delete(sensorIssues);
    await db.delete(sensorReadings);
    await db.delete(notifications);
    await db.delete(reviews);
    await db.delete(orders);
    await db.delete(schemes);
    await db.delete(crops);
    await db.delete(farms);
    await db.delete(users);

    // 1. Create Users
    const [adminRes] = await db.insert(users).values({
        unionId: "admin_123",
        name: "Admin User",
        email: "admin@smartfarm.com",
        phone: "9999999999",
        role: "admin",
        isVerified: true,
        password: hashPassword("admin123"),
    });
    const adminId = adminRes.insertId;

    const [farmerRes] = await db.insert(users).values({
        unionId: "farmer_123",
        name: "Ramesh Kumar",
        phone: "9876543210",
        role: "farmer",
        location: "Pune, Maharashtra",
        isVerified: true,
        isProfileComplete: true,
        rating: 4.8,
        reviewCount: 120,
    });
    const farmerId = farmerRes.insertId;

    const [consumerRes] = await db.insert(users).values({
        unionId: "consumer_123",
        name: "Rahul Sharma",
        phone: "1234567890",
        role: "consumer",
        location: "Mumbai, Maharashtra",
        isVerified: true,
    });
    const consumerId = consumerRes.insertId;

    // 2. Create Farm
    const [farmRes] = await db.insert(farms).values({
        farmerId,
        name: "Green Acres Farm",
        location: "Pune, Maharashtra",
        size: "15 Acres",
        soilType: "Black Cotton",
        isOrganic: true,
    });
    const farmId = farmRes.insertId;

    // 3. Create Crops
    await db.insert(crops).values([
        {
            farmerId,
            farmId,
            name: "Organic Tomatoes",
            category: "vegetables",
            price: "40.00",
            unit: "kg",
            stock: 200,
            image: "/crop-tomato.jpg",
            isOrganic: true,
            description: "Freshly harvested organic tomatoes.",
        },
        {
            farmerId,
            farmId,
            name: "Premium Wheat",
            category: "grains",
            price: "35.00",
            unit: "kg",
            stock: 1500,
            image: "/crop-wheat.jpg",
            isOrganic: false,
            description: "High quality wheat grains.",
        }
    ]);

    // 4. Create Schemes
    await db.insert(schemes).values([
        {
            title: "PM-KISAN Samman Nidhi",
            description: "Income support of Rs.6000/- per year in three equal installments.",
            category: "financial",
            benefit: "₹6,000/year",
            eligibility: "Small and marginal farmers",
            deadline: new Date("2026-12-31"),
            documentRequired: "Aadhar, Land Records",
            applicationLink: "https://pmkisan.gov.in/",
            image: "/scheme-pmkisan.jpg",
            isNew: true,
            color: "#1B5E20",
        }
    ]);

    // 5. Create Reviews
    await db.insert(reviews).values([
        {
            userId: consumerId,
            farmerId: farmerId,
            rating: 5,
            comment: "Excellent quality tomatoes, very fresh!",
        }
    ]);

    // 6. Create Notifications
    await db.insert(notifications).values([
        {
            userId: farmerId,
            title: "Welcome to SmartFarm",
            message: "Your profile has been approved.",
            type: "general",
            isRead: false,
        }
    ]);

    console.log("Seeding complete!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
