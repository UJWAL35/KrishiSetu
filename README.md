# KrishiSetu 🌾 (SmartFarm)

KrishiSetu is a comprehensive and modern web application designed to empower farmers and streamline agricultural processes. By bridging the gap between farmers, consumers, and delivery networks, it provides an end-to-end ecosystem encompassing a digital marketplace, smart farm management, real-time sensor integrations, government scheme awareness, and automated delivery tracking.

## 🚀 Key Features

### 🚜 For Farmers
- **Farmer Dashboard**: A central hub to track crop health, weather updates, and farm statistics.
- **Crop Management**: Easily list crops for sale, manage inventory, update pricing, and highlight organic produce.
- **Farm Controls & Sensor Management**: Monitor IoT sensor readings (temperature, soil moisture, pH, humidity) in real-time. Trigger and track spray activities (water, pesticide, fertilizer).
- **Issue Tracking**: Report and track sensor or farm issues directly from the dashboard.

### 🛒 For Consumers
- **Marketplace & Cart Checkout**: Browse and purchase fresh agricultural products directly from farmers.
- **Purchase History & Order Tracking**: Keep track of past orders and track current deliveries in real-time.
- **Farmer Profiles & Reviews**: View farmer profiles, rate deliveries, and save favorite farmers.

### 🚚 Delivery & Logistics
- **Delivery Dashboard**: Manage delivery partners, warehouses, and automated routing.
- **Chain Delivery System**: Advanced multi-leg delivery tracking (Farm → Warehouse → Customer).
- **OTP Verification**: Secure deliveries with OTP verification at every stage.

### 🛡️ Admin & Analytics
- **Admin Dashboard**: Comprehensive view of platform activity, user management, and delivery oversight.
- **Analytics**: Data-driven insights into sales, crop trends, and delivery performance.

### 🏛️ Government Schemes
- **Schemes Page**: A dedicated section to discover and apply for government agricultural schemes (financial, equipment, insurance, subsidy).

### 🤖 Smart & Automated
- **AI Integration**: Powered by Google Generative AI for smart recommendations and analytics.
- **Real-time Notifications**: SMS alerts via Twilio for order updates, sensor warnings, and system notifications.

---

## 🛠️ Tech Stack & Architecture

KrishiSetu is built using a modern, scalable, and type-safe stack:

### Frontend
- **Framework**: React 19 (Vite), TypeScript
- **Styling**: Tailwind CSS, shadcn/ui (Radix UI), Framer Motion for animations
- **State Management**: Zustand
- **Data Fetching & API**: TanStack React Query, tRPC Client
- **Maps**: React Leaflet (Leaflet.js)
- **Charts**: Recharts

### Backend
- **Framework**: Node.js, Hono (Edge-ready fast web framework)
- **API Layer**: tRPC Server (End-to-end type safety)
- **Authentication**: JWT (jose) with role-based access control
- **AI & Cloud Services**: Google Generative AI, AWS S3 (Storage), Twilio (SMS Notifications)

### Database
- **DBMS**: MySQL
- **ORM**: Drizzle ORM
- **Migrations & Tools**: Drizzle Kit

---

## 🗄️ Database Schema Overview

The database is designed to handle complex relationships in the agricultural supply chain:
- **Users & Auth**: `users` (Farmers, Consumers, Admins, Delivery Partners)
- **Farm Management**: `farms`, `sensor_readings`, `spray_activities`, `sensor_issues`
- **Marketplace**: `crops`, `orders`, `favorite_farmers`, `reviews`
- **Delivery System**: `warehouses`, `delivery_partners`, `deliveries` (supports multi-leg routing), `delivery_ratings`
- **Platform Features**: `schemes`, `notifications`

---

## 📁 Project Structure

```text
app/
├── api/                  # Backend API (Hono + tRPC)
│   ├── routers/          # tRPC routers (admin, AI, crop, delivery, farmer, etc.)
│   ├── context.ts        # tRPC Context & DB connection
│   └── boot.ts           # Server entry point
├── db/                   # Database configurations
│   ├── schema.ts         # Drizzle ORM schemas
│   ├── migrations/       # SQL migrations
│   └── seed scripts      # Scripts to populate dummy data
├── src/                  # Frontend Application
│   ├── components/       # Reusable UI components (shadcn, layouts, etc.)
│   ├── pages/            # Page components (Marketplace, Dashboards, etc.)
│   ├── context/          # React contexts
│   ├── hooks/            # Custom hooks
│   └── providers/        # App providers (tRPC, QueryClient, Theme)
├── package.json          # Project dependencies & scripts
└── tailwind.config.js    # Tailwind styling configuration
```

---

## 📦 Getting Started

### Prerequisites
- Node.js (v20 or higher recommended)
- MySQL Database running locally or remotely

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/UJWAL35/KrishiSetu.git
   cd KrishiSetu/app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   *Required variables include Database URL, AWS S3 credentials, Google AI API Key, Twilio credentials, and JWT secrets.*

4. **Database Setup:**
   Generate and apply Drizzle migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
   *(Optional)* To view and manage your database via a web UI:
   ```bash
   npm run db:studio
   ```

### Running the Application

**Start the development environment (Frontend + Backend):**
```bash
npm run dev
```

---

## 📜 Available Scripts

- `npm run dev` - Start the Vite frontend and Hono backend in development mode.
- `npm run build` - Build the React frontend and bundle the backend API via esbuild.
- `npm run start` - Run the production build.
- `npm run check` - Run TypeScript type checking.
- `npm run lint` - Run ESLint.
- `npm run format` - Format codebase using Prettier.
- `npm run test` - Run unit tests using Vitest.
- `npm run db:generate` - Generate Drizzle migrations.
- `npm run db:migrate` - Apply migrations to the MySQL database.
- `npm run db:push` - Push schema changes directly (for rapid prototyping).
- `npm run db:studio` - Open Drizzle Studio.