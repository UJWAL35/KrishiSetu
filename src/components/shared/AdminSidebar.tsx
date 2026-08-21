import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
    BarChart3,
    Users,
    ShoppingBag,
    Bell,
    TrendingUp,
    Settings,
    LogOut,
    Wheat,
    ChevronLeft,
    ChevronRight,
    Truck,
    X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_KEY } from "@/pages/Login";

const navItems = [
    { label: "Dashboard",  path: "/admin",           icon: BarChart3  },
    { label: "Farmers",    path: "/admin/farmers",   icon: Users      },
    { label: "Users",      path: "/admin/users",     icon: ShoppingBag},
    { label: "Delivery",   path: "/admin/delivery",  icon: Truck      },
    { label: "Schemes",    path: "/admin/schemes",   icon: Bell       },
    { label: "Analytics",  path: "/admin/analytics", icon: TrendingUp },
    { label: "Settings",   path: "/admin/settings",  icon: Settings   },
];

interface AdminSidebarProps {
    mobileOpen?: boolean;
    setMobileOpen?: (open: boolean) => void;
}

export default function AdminSidebar({ mobileOpen = false, setMobileOpen }: AdminSidebarProps) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <>
            {/* Logo */}
            <div className={`flex items-center gap-3 p-6 ${collapsed && !isMobile ? "justify-center px-2" : ""}`}>
                <Wheat className="w-6 h-6 flex-shrink-0" />
                {(!collapsed || isMobile) && (
                    <span className="text-lg font-bold">
                        <span>Krishi</span>
                        <span className="text-[#F9A825]">Setu</span>
                    </span>
                )}
                {/* Mobile close button */}
                {isMobile && (
                    <button
                        onClick={() => setMobileOpen?.(false)}
                        className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Collapse Toggle — desktop only */}
            {!isMobile && (
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-[#1B5E20] hover:scale-110 transition-transform"
                >
                    {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            )}

            {/* Nav Items */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileOpen?.(false)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                                isActive
                                    ? "bg-white/10 border-l-[3px] border-[#F9A825] text-white"
                                    : "text-white/70 hover:bg-white/5 hover:text-white"
                            } ${collapsed && !isMobile ? "justify-center px-2" : ""}`}
                            title={collapsed && !isMobile ? item.label : undefined}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {(!collapsed || isMobile) && <span className="text-sm font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom - User */}
            <div className={`p-4 border-t border-white/10 ${collapsed && !isMobile ? "px-2" : ""}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F9A825] flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {user?.name?.[0] || "A"}
                    </div>
                    {(!collapsed || isMobile) && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || "Admin"}</p>
                            <p className="text-xs text-white/50">Administrator</p>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            localStorage.removeItem(AUTH_KEY);
                            logout();
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4 text-white/70" />
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full bg-gradient-to-b from-[#1B5E20] to-[#0D3B10] text-white z-50 transition-all duration-300 ${
                    collapsed ? "w-16" : "w-64"
                } hidden lg:flex flex-col shadow-xl`}
            >
                <SidebarContent />
            </aside>

            {/* Mobile Drawer Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 lg:hidden"
                    onClick={() => setMobileOpen?.(false)}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                </div>
            )}

            {/* Mobile Drawer */}
            <aside
                className={`fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-[#1B5E20] to-[#0D3B10] text-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <SidebarContent isMobile />
            </aside>
        </>
    );
}
