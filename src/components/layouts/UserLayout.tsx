import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import TopNav from "@/components/shared/TopNav";
import AiAssistant from "@/components/shared/AiAssistant";
import { AUTH_KEY } from "@/pages/Login";
import { CartProvider } from "@/context/CartContext";

const userLinks = [
    { label: "Marketplace", path: "/marketplace", icon: "ShoppingBag" },
    { label: "My Orders",   path: "/orders",       icon: "BarChart3"  },
    { label: "Schemes",     path: "/schemes",      icon: "Bell"       },
];

export default function UserLayout() {
    const navigate = useNavigate();

    const role = localStorage.getItem(AUTH_KEY);

    useEffect(() => {
        if (role !== "consumer") {
            navigate("/login", { replace: true });
        }
    }, [navigate, role]);

    if (role !== "consumer") {
        return (
            <div className="min-h-screen bg-[#F1F8E9] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-[#F9A825] border-t-transparent animate-spin" />
                    <p className="text-sm text-[#5F6368]">Redirecting to login…</p>
                </div>
            </div>
        );
    }

    return (
        <CartProvider>
            <div className="min-h-screen bg-[#F1F8E9]">
                <TopNav links={userLinks} role="user" />
                <main className="pt-16">
                    <Outlet />
                </main>
                <AiAssistant role="consumer" />
            </div>
        </CartProvider>
    );
}
