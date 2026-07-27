import {
    mysqlTable,
    mysqlEnum,
    serial,
    varchar,
    text,
    timestamp,
    int,
    decimal,
    bigint,
    boolean,
    float,
} from "drizzle-orm/mysql-core";

// ── Users (auth system) ──────────────────────────────────
export const users = mysqlTable("users", {
    id: serial("id").primaryKey(),
    unionId: varchar("unionId", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 320 }),
    avatar: text("avatar"),
    role: mysqlEnum("role", ["consumer", "farmer", "admin", "delivery_partner"]).default("consumer").notNull(),
    phone: varchar("phone", { length: 20 }),
    location: varchar("location", { length: 255 }),
    lat: float("lat"),
    lng: float("lng"),
    isVerified: boolean("isVerified").default(false),
    isProfileComplete: boolean("isProfileComplete").default(false),
    rating: float("rating").default(0),
    reviewCount: int("reviewCount").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt")
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
    lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
    password: varchar("password", { length: 255 }),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Farms ────────────────────────────────────────────────
export const farms = mysqlTable("farms", {
    id: serial("id").primaryKey(),
    farmerId: bigint("farmerId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }),
    lat: float("lat"),
    lng: float("lng"),
    size: varchar("size", { length: 50 }),
    soilType: varchar("soilType", { length: 100 }),
    isOrganic: boolean("isOrganic").default(false),
    images: text("images"), // Store JSON stringified array of image URLs
    status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Farm = typeof farms.$inferSelect;

// ── Sensor Readings ──────────────────────────────────────
export const sensorReadings = mysqlTable("sensor_readings", {
    id: serial("id").primaryKey(),
    farmId: bigint("farmId", { mode: "number", unsigned: true }).notNull(),
    field: varchar("field", { length: 50 }).notNull(),
    type: mysqlEnum("type", ["temperature", "soil_moisture", "ph", "humidity"]).notNull(),
    value: float("value").notNull(),
    unit: varchar("unit", { length: 20 }).notNull(),
    status: mysqlEnum("status", ["optimal", "warning", "critical"]).default("optimal").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type SensorReading = typeof sensorReadings.$inferSelect;

// ── Spray Activities ─────────────────────────────────────
export const sprayActivities = mysqlTable("spray_activities", {
    id: serial("id").primaryKey(),
    farmId: bigint("farmId", { mode: "number", unsigned: true }).notNull(),
    field: varchar("field", { length: 50 }).notNull(),
    type: mysqlEnum("type", ["water", "pesticide", "fertilizer"]).notNull(),
    duration: int("duration").notNull(),
    status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SprayActivity = typeof sprayActivities.$inferSelect;

// ── Crops ────────────────────────────────────────────────
export const crops = mysqlTable("crops", {
    id: serial("id").primaryKey(),
    farmerId: bigint("farmerId", { mode: "number", unsigned: true }).notNull(),
    farmId: bigint("farmId", { mode: "number", unsigned: true }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    category: mysqlEnum("category", ["grains", "vegetables", "fruits", "pulses", "others"]).notNull(),
    variety: varchar("variety", { length: 100 }),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 20 }).default("kg").notNull(),
    stock: int("stock").default(0).notNull(),
    image: text("image"), // Note: we altered this to MEDIUMTEXT manually in the DB to support base64
    isOrganic: boolean("isOrganic").default(false),
    isAvailable: boolean("isAvailable").default(true),
    harvestDate: timestamp("harvestDate"),
    description: text("description"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Crop = typeof crops.$inferSelect;

// ── Orders ───────────────────────────────────────────────
export const orders = mysqlTable("orders", {
    id: serial("id").primaryKey(),
    orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    farmerId: bigint("farmerId", { mode: "number", unsigned: true }).notNull(),
    cropId: bigint("cropId", { mode: "number", unsigned: true }).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
    deliveryFee: decimal("deliveryFee", { precision: 10, scale: 2 }).default("0"),
    totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
    deliveryType: mysqlEnum("deliveryType", ["express", "standard", "pickup"]).default("express").notNull(),
    status: mysqlEnum("status", ["pending", "confirmed", "processing", "out_for_delivery", "delivered", "cancelled"]).default("pending").notNull(),
    otp: varchar("otp", { length: 10 }),
    deliveryAddress: text("deliveryAddress"),
    lat: float("lat"),
    lng: float("lng"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;

// ── Government Schemes ───────────────────────────────────
export const schemes = mysqlTable("schemes", {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: mysqlEnum("category", ["financial", "equipment", "insurance", "training", "subsidy"]).notNull(),
    benefit: varchar("benefit", { length: 255 }),
    eligibility: text("eligibility"),
    deadline: timestamp("deadline"),
    documentRequired: text("documentRequired"),
    applicationLink: text("applicationLink"),
    image: text("image"),
    isActive: boolean("isActive").default(true),
    isNew: boolean("isNew").default(false),
    color: varchar("color", { length: 50 }).default("#000000"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Scheme = typeof schemes.$inferSelect;

// ── Notifications ────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message"),
    type: mysqlEnum("type", ["scheme", "order", "sensor_alert", "general", "delivery", "system"]).default("general").notNull(),
    isRead: boolean("isRead").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;

// ── Reviews ──────────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    farmerId: bigint("farmerId", { mode: "number", unsigned: true }).notNull(),
    rating: int("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

// ── Sensor Issues ─────────────────────────────────────────
export const sensorIssues = mysqlTable("sensor_issues", {
    id: serial("id").primaryKey(),
    farmerId: bigint("farmerId", { mode: "number", unsigned: true }).notNull(),
    farmId: bigint("farmId", { mode: "number", unsigned: true }).notNull(),
    field: varchar("field", { length: 50 }).notNull(),
    sensorType: varchar("sensorType", { length: 100 }).notNull(),
    issueType: varchar("issueType", { length: 100 }).notNull(),
    urgency: varchar("urgency", { length: 50 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["open", "in_progress", "resolved"]).default("open").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type SensorIssue = typeof sensorIssues.$inferSelect;

// ── Favorite Farmers ─────────────────────────────────────
export const favoriteFarmers = mysqlTable("favorite_farmers", {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    farmerId: bigint("farmerId", { mode: "number", unsigned: true }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FavoriteFarmer = typeof favoriteFarmers.$inferSelect;

// ── KrishiSetu Warehouses ─────────────────────────────────
export const warehouses = mysqlTable("warehouses", {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }),
    lat: float("lat").notNull(),
    lng: float("lng").notNull(),
    isActive: boolean("isActive").default(true),
    capacity: int("capacity").default(1000), // in kg
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Warehouse = typeof warehouses.$inferSelect;

// ── Delivery Partners ─────────────────────────────────────
export const deliveryPartners = mysqlTable("delivery_partners", {
    id: serial("id").primaryKey(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull().unique(),
    vehicleType: mysqlEnum("vehicleType", ["bike", "auto", "van", "truck"]).default("bike").notNull(),
    licenseNumber: varchar("licenseNumber", { length: 50 }),
    isAvailable: boolean("isAvailable").default(false),
    isVerified: boolean("isVerified").default(false),
    avgRating: float("avgRating").default(0),
    totalDeliveries: int("totalDeliveries").default(0),
    totalEarnings: decimal("totalEarnings", { precision: 12, scale: 2 }).default("0"),
    currentLat: float("currentLat"),
    currentLng: float("currentLng"),
    homeWarehouseId: bigint("homeWarehouseId", { mode: "number", unsigned: true }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type DeliveryPartner = typeof deliveryPartners.$inferSelect;

// ── Deliveries ────────────────────────────────────────────
// A single order can have multiple delivery legs (chain delivery).
// Each leg is a row in this table: leg 1 = farm→warehouse1, leg 2 = warehouse1→warehouse2, leg N = lastWarehouse→customer
export const deliveries = mysqlTable("deliveries", {
    id: serial("id").primaryKey(),
    orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
    deliveryPartnerId: bigint("deliveryPartnerId", { mode: "number", unsigned: true }),
    // Chain delivery fields
    legIndex: int("legIndex").default(1).notNull(),       // 1-based leg number
    totalLegs: int("totalLegs").default(1).notNull(),     // total legs in this order
    fromWarehouseId: bigint("fromWarehouseId", { mode: "number", unsigned: true }), // null = pickup from farm
    toWarehouseId: bigint("toWarehouseId", { mode: "number", unsigned: true }),     // null = deliver to customer
    // Addresses
    pickupAddress: text("pickupAddress"),
    deliveryAddress: text("deliveryAddress"),
    pickupLat: float("pickupLat"),
    pickupLng: float("pickupLng"),
    deliveryLat: float("deliveryLat"),
    deliveryLng: float("deliveryLng"),
    // Status & OTP
    status: mysqlEnum("status", ["pending", "assigned", "picked_up", "at_warehouse", "out_for_delivery", "delivered", "cancelled"]).default("pending").notNull(),
    otp: varchar("otp", { length: 10 }),
    otpVerified: boolean("otpVerified").default(false),
    // Earnings
    partnerEarning: decimal("partnerEarning", { precision: 10, scale: 2 }).default("0"),
    // Timestamps
    assignedAt: timestamp("assignedAt"),
    pickedUpAt: timestamp("pickedUpAt"),
    deliveredAt: timestamp("deliveredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Delivery = typeof deliveries.$inferSelect;

// ── Delivery Ratings ──────────────────────────────────────
export const deliveryRatings = mysqlTable("delivery_ratings", {
    id: serial("id").primaryKey(),
    deliveryId: bigint("deliveryId", { mode: "number", unsigned: true }).notNull().unique(),
    orderId: bigint("orderId", { mode: "number", unsigned: true }).notNull(),
    deliveryPartnerId: bigint("deliveryPartnerId", { mode: "number", unsigned: true }).notNull(),
    userId: bigint("userId", { mode: "number", unsigned: true }).notNull(),
    rating: int("rating").notNull(), // 1-5
    comment: text("comment"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliveryRating = typeof deliveryRatings.$inferSelect;
