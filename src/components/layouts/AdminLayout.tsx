import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import AdminSidebar from "@/components/shared/AdminSidebar";
import AiAssistant from "@/components/shared/AiAssistant";
import { AUTH_KEY } from "@/pages/Login";
import { Menu } from "lucide-react";

export default function AdminLayout() {
    const navigate = useNavigate();
    const role = localStorage.getItem(AUTH_KEY);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        if (role !== "admin") {
            navigate("/login", { replace: true });
        }
    }, [navigate, role]);

    if (role !== "admin") {
        return (
            <div className="min-h-screen bg-[#F1F8E9] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-4 border-[#6A1B9A] border-t-transparent animate-spin" />
                    <p className="text-sm text-[#5F6368]">Redirecting to login…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F8E9] flex flex-col lg:flex-row">
            <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
            
            <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white h-14 border-b border-[#C8E6C9] flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-[#1B5E20]">
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-bold text-[#1B1B1B]">Krishi<span className="text-[#F9A825]">Setu</span> Admin</span>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden">
                    <Outlet />
                </main>
            </div>
            
            <AiAssistant role="admin" />
        </div>
    );
}
