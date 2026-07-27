import { useEffect, useState } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
    Truck,
    LayoutDashboard,
    MapPin,
    ClipboardList,
    User,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { AUTH_KEY } from "@/pages/Login";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
    { label: "Dashboard", path: "/delivery/dashboard", icon: LayoutDashboard },
    { label: "My Orders", path: "/delivery/orders", icon: ClipboardList },
    { label: "Live Map", path: "/delivery/map", icon: MapPin },
    { label: "Profile", path: "/delivery/profile", icon: User },
];

export default function DeliveryLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const role = localStorage.getItem(AUTH_KEY);

    useEffect(() => {
        if (role !== "delivery_partner") {
            navigate("/login", { replace: true });
        }
    }, [navigate, role]);

    if (role !== "delivery_partner") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-[#01579B] border-t-transparent animate-spin" />
                    <p className="text-sm text-[#5F6368]">Redirecting to login…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F0F7FF] flex">
            {/* Sidebar — Desktop */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-[#01579B] to-[#003D6B] text-white z-50 hidden lg:flex flex-col shadow-2xl">
                {/* Logo */}
                <div className="flex items-center gap-3 p-6 border-b border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Truck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-sm leading-tight">
                            Krishi<span className="text-[#FFD54F]">Setu</span>
                        </p>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest">Delivery Partner</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-5 space-y-1">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                    isActive
                                        ? "bg-white/15 text-white shadow-inner"
                                        : "text-white/60 hover:bg-white/8 hover:text-white"
                                }`}
                            >
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#FFD54F]" : ""}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FFD54F]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom User Info */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#FFD54F] flex items-center justify-center text-[#01579B] text-sm font-bold flex-shrink-0">
                            {user?.name?.[0]?.toUpperCase() || "D"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{user?.name || "Delivery Partner"}</p>
                            <p className="text-xs text-white/50">{user?.phone}</p>
                        </div>
                        <button
                            onClick={() => { localStorage.removeItem(AUTH_KEY); logout(); }}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4 text-white/60" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#01579B] text-white px-4 py-3 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    <span className="font-bold">Krishi<span className="text-[#FFD54F]">Setu</span> Delivery</span>
                </div>
                <button onClick={() => setMobileOpen(true)}>
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] lg:hidden"
                    >
                        <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                        <motion.div
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="absolute left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-[#01579B] to-[#003D6B] text-white p-6 flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <Truck className="w-5 h-5" />
                                    <span className="font-bold">KrishiSetu Delivery</span>
                                </div>
                                <button onClick={() => setMobileOpen(false)}>
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="space-y-2 flex-1">
                                {navItems.map((item) => {
                                    const isActive = location.pathname === item.path;
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={() => setMobileOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                                isActive ? "bg-white/15 text-white" : "text-white/60"
                                            }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            <button
                                onClick={() => { localStorage.removeItem(AUTH_KEY); logout(); }}
                                className="flex items-center gap-2 text-white/60 hover:text-white mt-4"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm">Logout</span>
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main content */}
            <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
                <Outlet />
            </main>
        </div>
    );
}
