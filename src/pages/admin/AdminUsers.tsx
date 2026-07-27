import { motion } from "framer-motion";
import { Search, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/providers/trpc";

const statusColors: Record<string, string> = {
    delivered: "bg-[#E8F5E9] text-[#2E7D32]",
    processing: "bg-[#E0F7FA] text-[#00BCD4]",
    pending: "bg-[#FFF8E1] text-[#F9A825]",
    cancelled: "bg-[#FFEBEE] text-[#C62828]",
    confirmed: "bg-[#E8F5E9] text-[#1B5E20]",
    out_for_delivery: "bg-[#F3E5F5] text-[#6A1B9A]",
};

export default function AdminUsers() {
    const { data: orders } = trpc.order.list.useQuery();
    const [search, setSearch] = useState("");

    // Build unique users from orders
    const usersMap = new Map<string, { name: string; avatar: string; orders: number; totalSpend: number; lastOrder: string; lastStatus: string }>();
    (orders ?? []).forEach((o) => {
        if (!usersMap.has(o.customer)) {
            usersMap.set(o.customer, { name: o.customer, avatar: o.customerAvatar, orders: 0, totalSpend: 0, lastOrder: o.date, lastStatus: o.status });
        }
        const u = usersMap.get(o.customer)!;
        u.orders++;
        u.totalSpend += o.amount;
        if (new Date(o.date) > new Date(u.lastOrder)) { u.lastOrder = o.date; u.lastStatus = o.status; }
    });

    const users = Array.from(usersMap.values()).filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase())
    );

    const totalRevenue = users.reduce((s, u) => s + u.totalSpend, 0);
    const totalOrders = users.reduce((s, u) => s + u.orders, 0);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1B1B1B]">Users</h1>
                <p className="text-sm text-[#5F6368]">All consumers who have placed orders on the platform</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Users", value: users.length, icon: Users, color: "#00BCD4" },
                    { label: "Total Orders", value: totalOrders, icon: ShoppingBag, color: "#F9A825" },
                    { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp, color: "#1B5E20" },
                ].map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}20` }}>
                                <Icon className="w-5 h-5" style={{ color: s.color }} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#1B1B1B]">{s.value}</p>
                                <p className="text-xs text-[#9E9E9E]">{s.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search */}
            <div className="flex items-center bg-white rounded-xl px-4 py-2.5 shadow-sm border border-[#C8E6C9] max-w-md">
                <Search className="w-4 h-4 text-[#9E9E9E] mr-2" />
                <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#F1F8E9] text-xs text-[#9E9E9E] uppercase">
                                <th className="px-4 py-3 text-left font-medium">User</th>
                                <th className="px-4 py-3 text-left font-medium">Orders</th>
                                <th className="px-4 py-3 text-left font-medium">Total Spent</th>
                                <th className="px-4 py-3 text-left font-medium">Last Order</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, i) => (
                                <motion.tr key={user.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="border-b border-[#F1F8E9] hover:bg-[#FAFAFA]">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#1B1B1B]">{user.name}</p>
                                                <p className="text-xs text-[#9E9E9E]">Consumer</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><span className="text-sm font-medium">{user.orders}</span></td>
                                    <td className="px-4 py-3"><span className="text-sm font-semibold text-[#1B5E20]">₹{user.totalSpend}</span></td>
                                    <td className="px-4 py-3"><span className="text-sm text-[#5F6368]">{user.lastOrder}</span></td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[user.lastStatus] ?? "bg-[#F1F8E9] text-[#5F6368]"}`}>
                                            {user.lastStatus.replace("_", " ")}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {users.length === 0 && (
                    <div className="text-center py-12 text-[#9E9E9E]">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No users found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
