import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router";
import AdminSidebar from "@/components/shared/AdminSidebar";
import AiAssistant from "@/components/shared/AiAssistant";
import { AUTH_KEY } from "@/pages/Login";

export default function AdminLayout() {
    const navigate = useNavigate();

    const role = localStorage.getItem(AUTH_KEY);

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
        <div className="min-h-screen bg-[#F1F8E9] flex">
            <AdminSidebar />
            <main className="flex-1 ml-0 lg:ml-64">
                <Outlet />
            </main>
            <AiAssistant role="admin" />
        </div>
    );
}
