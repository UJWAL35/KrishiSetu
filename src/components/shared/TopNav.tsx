import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
    Bell,
    Menu,
    X,
    Wheat,
    ShoppingBag,
    BarChart3,
    Settings,
    LogOut,
    Search,
    ShoppingCart,
    Wifi,
    Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import NotificationPanel from "./NotificationPanel";
import CartPanel from "./CartPanel";
import { AUTH_KEY } from "@/pages/Login";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

interface NavLink {
    label: string;
    path: string;
    icon: string;
}

interface TopNavProps {
    links: NavLink[];
    role: string;
}

const iconMap: Record<string, React.ElementType> = {
    BarChart3,
    Settings,
    Bell,
    ShoppingBag,
    Wifi,
};

export default function TopNav({ links, role }: TopNavProps) {
    const location = useLocation();
    const { user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [bellWiggling, setBellWiggling] = useState(false);
    const [cartBouncing, setCartBouncing] = useState(false);
    const prevCartCount = useRef(0);
    const prevUnreadCount = useRef(0);
    const langRef = useRef<HTMLDivElement>(null);

    const { cartCount } = useCart();
    const { t, lang, setLang, languages, currentLanguage } = useLanguage();
    const { data: unreadCount } = trpc.notification.unreadCount.useQuery();

    // Cart bounce on item added
    useEffect(() => {
        if (cartCount > prevCartCount.current) {
            setCartBouncing(true);
            setTimeout(() => setCartBouncing(false), 600);
        }
        prevCartCount.current = cartCount;
    }, [cartCount]);

    // Bell wiggle on new notification
    useEffect(() => {
        const count = unreadCount ?? 0;
        if (count > prevUnreadCount.current) {
            setBellWiggling(true);
            setTimeout(() => setBellWiggling(false), 700);
        }
        prevUnreadCount.current = count;
    }, [unreadCount]);

    // Close language dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setLangOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const navLinks = [
        { label: t("dashboard"), path: role === "farmer" ? "/farmer/dashboard" : "/marketplace", icon: "BarChart3" },
        ...links.slice(1),
    ];
    const localizedLinks = links.map((link) => {
        const keyMap: Record<string, string> = {
            "Dashboard": t("dashboard"),
            "Controls": t("controls"),
            "Sensors": t("sensors"),
            "Schemes": t("schemes"),
            "Marketplace": t("marketplace"),
            "My Orders": t("myOrders"),
        };
        return { ...link, label: keyMap[link.label] ?? link.label };
    });

    return (
        <nav className="fixed top-0 left-0 right-0 h-16 bg-white shadow-sm z-50 border-b border-[#C8E6C9]">
            <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                {/* Logo */}
                <Link to={role === "farmer" ? "/farmer/dashboard" : "/marketplace"} className="flex items-center gap-2 group">
                    <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }}>
                        <Wheat className="w-6 h-6 text-[#1B5E20]" />
                    </motion.div>
                    <span className="text-xl font-bold">
                        <span className="text-[#1B5E20]">Krishi</span>
                        <span className="text-[#F9A825]">Setu</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {localizedLinks.map((link) => {
                        const Icon = iconMap[link.icon] || BarChart3;
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`relative flex items-center gap-2 text-sm font-medium transition-colors ${
                                    isActive
                                        ? "text-[#1B5E20]"
                                        : "text-[#5F6368] hover:text-[#1B1B1B]"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {link.label}
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-indicator"
                                        className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-[#1B5E20] rounded-full"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    {/* Cart — user only */}
                    {role === "user" && (
                        <motion.button
                            onClick={() => setCartOpen(!cartOpen)}
                            whileTap={{ scale: 0.9 }}
                            className={`relative p-2 hover:bg-[#E8F5E9] rounded-full transition-colors ${cartBouncing ? "cart-bounce" : ""}`}
                            title={t("myOrders")}
                        >
                            <ShoppingCart className="w-5 h-5 text-[#5F6368]" />
                            <AnimatePresence>
                                {cartCount > 0 && (
                                    <motion.span
                                        key={cartCount}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        transition={{ type: "spring", damping: 12 }}
                                        className="absolute top-1 right-1 w-4 h-4 bg-[#C62828] text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                                    >
                                        {cartCount > 9 ? "9+" : cartCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    )}

                    {/* Search — user only */}
                    {role === "user" && (
                        <motion.button
                            onClick={() => setSearchOpen(!searchOpen)}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 hover:bg-[#E8F5E9] rounded-full transition-colors"
                        >
                            <Search className="w-5 h-5 text-[#5F6368]" />
                        </motion.button>
                    )}

                    {/* Notifications */}
                    <motion.button
                        onClick={() => setNotifOpen(!notifOpen)}
                        whileTap={{ scale: 0.9 }}
                        className="relative p-2 hover:bg-[#E8F5E9] rounded-full transition-colors"
                        title={t("notifications")}
                    >
                        <Bell className={`w-5 h-5 text-[#5F6368] ${bellWiggling ? "bell-wiggle" : ""}`} />
                        <AnimatePresence>
                            {(unreadCount ?? 0) > 0 && (
                                <motion.span
                                    key={unreadCount}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-1 right-1 w-4 h-4 bg-[#C62828] text-white text-[10px] rounded-full flex items-center justify-center"
                                >
                                    {unreadCount}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    {/* Language Switcher */}
                    <div ref={langRef} className="relative">
                        <motion.button
                            onClick={() => setLangOpen(!langOpen)}
                            whileTap={{ scale: 0.9 }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-[#E8F5E9] transition-colors text-sm"
                            title={t("language")}
                        >
                            <Globe className="w-4 h-4 text-[#5F6368]" />
                            <span className="hidden sm:block text-xs font-medium text-[#5F6368]">{currentLanguage.nativeLabel}</span>
                        </motion.button>

                        <AnimatePresence>
                            {langOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-[#C8E6C9] overflow-hidden z-50 min-w-[180px]"
                                >
                                    <div className="px-3 py-2 border-b border-[#E8F5E9]">
                                        <p className="text-xs font-semibold text-[#9E9E9E] uppercase tracking-wide">{t("language")}</p>
                                    </div>
                                    {languages.map((l) => (
                                        <motion.button
                                            key={l.code}
                                            whileHover={{ x: 4 }}
                                            onClick={() => { setLang(l.code); setLangOpen(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[#F1F8E9] ${
                                                lang === l.code ? "bg-[#E8F5E9] text-[#1B5E20]" : "text-[#1B1B1B]"
                                            }`}
                                        >
                                            <span className="text-lg">{l.flag}</span>
                                            <div>
                                                <p className="text-sm font-medium">{l.nativeLabel}</p>
                                                <p className="text-[10px] text-[#9E9E9E]">{l.label}</p>
                                            </div>
                                            {lang === l.code && (
                                                <motion.div
                                                    layoutId="lang-check"
                                                    className="ml-auto w-2 h-2 rounded-full bg-[#1B5E20]"
                                                />
                                            )}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile */}
                    <div className="hidden md:flex items-center gap-2">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] flex items-center justify-center text-white text-sm font-semibold shadow-sm"
                        >
                            {user?.name?.[0] || "U"}
                        </motion.div>
                        <span className="text-sm text-[#5F6368] hidden lg:block">
                            {user?.name || "User"}
                        </span>
                    </div>

                    {/* Logout */}
                    <LogoutButton t={t} />


                    {/* Mobile Menu Toggle */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 hover:bg-[#E8F5E9] rounded-full"
                    >
                        <AnimatePresence mode="wait">
                            {mobileOpen ? (
                                <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
                                    <X className="w-5 h-5" />
                                </motion.div>
                            ) : (
                                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
                                    <Menu className="w-5 h-5" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden bg-white border-t border-[#C8E6C9] shadow-lg overflow-hidden"
                    >
                        <div className="px-4 py-2">
                            {localizedLinks.map((link, i) => {
                                const Icon = iconMap[link.icon] || BarChart3;
                                const isActive = location.pathname === link.path;
                                return (
                                    <motion.div
                                        key={link.path}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            to={link.path}
                                            onClick={() => setMobileOpen(false)}
                                            className={`flex items-center gap-3 py-3 px-2 rounded-lg ${
                                                isActive
                                                    ? "bg-[#E8F5E9] text-[#1B5E20]"
                                                    : "text-[#5F6368] hover:bg-[#F1F8E9]"
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-sm font-medium">{link.label}</span>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Panel */}
            {notifOpen && (
                <NotificationPanel onClose={() => setNotifOpen(false)} />
            )}

            {/* Cart Panel */}
            <AnimatePresence>
                {cartOpen && role === "user" && (
                    <CartPanel onClose={() => setCartOpen(false)} />
                )}
            </AnimatePresence>

            {/* Search Overlay */}
            <AnimatePresence>
                {searchOpen && role === "user" && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-16 left-0 right-0 bg-white shadow-lg border-t border-[#C8E6C9] p-4"
                    >
                        <div className="max-w-xl mx-auto">
                            <input
                                type="text"
                                placeholder={t("search") + " crops, farmers..."}
                                className="w-full h-12 px-4 rounded-xl border border-[#C8E6C9] bg-[#F1F8E9] focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                                autoFocus
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

// ── Dedicated logout button — handles both cookie (server) + localStorage ──
function LogoutButton({ t }: { t: (key: string) => string }) {
    const navigate = useNavigate();
    const logoutMutation = trpc.auth.logout.useMutation({
        onSettled: () => {
            // Always clear localStorage and redirect, even if server call fails
            localStorage.removeItem(AUTH_KEY);
            navigate("/login", { replace: true });
        },
    });

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="p-2 hover:bg-[#FFEBEE] rounded-full transition-colors disabled:opacity-50"
            title={t("logout")}
        >
            {logoutMutation.isPending ? (
                <svg className="animate-spin h-5 w-5 text-[#5F6368]" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
            ) : (
                <LogOut className="w-5 h-5 text-[#5F6368]" />
            )}
        </motion.button>
    );
}
