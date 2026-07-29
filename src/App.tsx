import { Routes, Route, useLocation } from "react-router";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ProfileSetup from "./pages/ProfileSetup";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import FarmerDashboard from "./pages/FarmerDashboard";
import CropManagement from "./pages/CropManagement";
import Marketplace from "./pages/Marketplace";
import OrderingPage from "./pages/OrderingPage";
import SchemesPage from "./pages/SchemesPage";
import FarmControls from "./pages/FarmControls";
import CartCheckout from "./pages/CartCheckout";
import PurchaseHistory from "./pages/PurchaseHistory";
import AdminFarmers from "./pages/admin/AdminFarmers";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSchemes from "./pages/admin/AdminSchemes";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDelivery from "./pages/admin/AdminDelivery";
import SensorManagement from "./pages/SensorManagement";
import FarmerLayout from "./components/layouts/FarmerLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import UserLayout from "./components/layouts/UserLayout";
import DeliveryLayout from "./components/layouts/DeliveryLayout";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import DeliveryOrders from "./pages/delivery/DeliveryOrders";
import DeliveryMap from "./pages/delivery/DeliveryMap";
import DeliveryProfile from "./pages/delivery/DeliveryProfile";

export default function App() {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/farmer/profile-setup" element={<ProfileSetup />} />

                {/* Admin routes */}
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/farmers" element={<AdminFarmers />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/schemes" element={<AdminSchemes />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/delivery" element={<AdminDelivery />} />
                </Route>

                {/* Farmer routes */}
                <Route element={<FarmerLayout />}>
                    <Route path="/farmer" element={<FarmerDashboard />} />
                    <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
                    <Route path="/farmer/crops" element={<CropManagement />} />
                    <Route path="/farmer/controls" element={<FarmControls />} />
                    <Route path="/farmer/sensors" element={<SensorManagement />} />
                    <Route path="/farmer/schemes" element={<SchemesPage />} />
                </Route>

                {/* User routes */}
                <Route element={<UserLayout />}>
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/order/:cropId" element={<OrderingPage />} />
                    <Route path="/cart/checkout" element={<CartCheckout />} />
                    <Route path="/orders" element={<PurchaseHistory />} />
                </Route>

                {/* Delivery Partner routes */}
                <Route element={<DeliveryLayout />}>
                    <Route path="/delivery" element={<DeliveryDashboard />} />
                    <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
                    <Route path="/delivery/orders" element={<DeliveryOrders />} />
                    <Route path="/delivery/map" element={<DeliveryMap />} />
                    <Route path="/delivery/profile" element={<DeliveryProfile />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </AnimatePresence>
    );
}
