import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import TopNav from "@/components/shared/TopNav";
import AiAssistant from "@/components/shared/AiAssistant";
import { AUTH_KEY } from "@/pages/Login";

const farmerLinks = [
    { label: "Dashboard", path: "/farmer/dashboard", icon: "BarChart3" },
    { label: "Crops",     path: "/farmer/crops",     icon: "Wheat"     },
    { label: "Controls",  path: "/farmer/controls",  icon: "Settings"  },
    { label: "Sensors",   path: "/farmer/sensors",   icon: "Wifi"      },
    { label: "Schemes",   path: "/farmer/schemes",   icon: "Bell"      },
];

export default function FarmerLayout() {
    const navigate = useNavigate();

    const role = localStorage.getItem(AUTH_KEY);

    useEffect(() => {
        if (role !== "farmer") {
            navigate("/login", { replace: true });
        }
    }, [navigate, role]);

    // If not authenticated as farmer, show nothing while redirect fires
    if (role !== "farmer") {
        return (
            <div className="min-h-screen bg-[#F1F8E9] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-[#4CAF50] border-t-transparent animate-spin" />
                    <p className="text-sm text-[#5F6368]">Redirecting to login…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F8E9]">
            <TopNav links={farmerLinks} role="farmer" />
            <main className="pt-16">
                <Outlet />
            </main>
            <AiAssistant role="farmer" />
        </div>
    );
}
