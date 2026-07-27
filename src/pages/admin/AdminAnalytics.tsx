import { motion } from "framer-motion";
import { trpc } from "@/providers/trpc";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const revenueData = [
    { month: "Jan", revenue: 45000 }, { month: "Feb", revenue: 52000 },
    { month: "Mar", revenue: 48000 }, { month: "Apr", revenue: 61000 },
    { month: "May", revenue: 55000 }, { month: "Jun", revenue: 67000 },
    { month: "Jul", revenue: 71000 }, { month: "Aug", revenue: 58000 },
    { month: "Sep", revenue: 74000 }, { month: "Oct", revenue: 82000 },
    { month: "Nov", revenue: 78000 }, { month: "Dec", revenue: 91000 },
];

const categoryData = [
    { name: "Grains", value: 35, color: "#F9A825" },
    { name: "Vegetables", value: 28, color: "#4CAF50" },
    { name: "Fruits", value: 22, color: "#E91E63" },
    { name: "Pulses", value: 15, color: "#9C27B0" },
];

const orderStatusData = [
    { status: "Delivered", count: 42, color: "#2E7D32" },
    { status: "Processing", count: 18, color: "#00BCD4" },
    { status: "Pending", count: 12, color: "#F9A825" },
    { status: "Out for Delivery", count: 8, color: "#6A1B9A" },
    { status: "Cancelled", count: 5, color: "#C62828" },
];

export default function AdminAnalytics() {
    const { data: farmers } = trpc.farmer.list.useQuery({});
    const { data: orders } = trpc.order.list.useQuery();

    const topFarmers = [...(farmers ?? [])]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1B1B1B]">Analytics</h1>
                <p className="text-sm text-[#5F6368]">Platform-wide insights and performance metrics</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Annual Revenue", value: "₹7.82L", change: "+18%", color: "#1B5E20" },
                    { label: "Avg Order Value", value: "₹195", change: "+5%", color: "#0277BD" },
                    { label: "Order Completion", value: "91%", change: "+2%", color: "#2E7D32" },
                    { label: "Active Farmers", value: farmers?.length ?? 0, change: "+12%", color: "#F9A825" },
                ].map((s) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl p-4 shadow-sm">
                        <p className="text-2xl font-bold text-[#1B1B1B]">{s.value}</p>
                        <p className="text-xs text-[#9E9E9E] mt-0.5">{s.label}</p>
                        <p className="text-xs font-medium mt-1" style={{ color: s.color }}>{s.change} this year</p>
                    </motion.div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-[#1B1B1B] mb-4">Monthly Revenue (₹)</h3>
                    <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9E9E9E" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: "#9E9E9E" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} contentStyle={{ borderRadius: 8, border: "1px solid #C8E6C9" }} />
                                <Area type="monotone" dataKey="revenue" stroke="#4CAF50" strokeWidth={2} fill="url(#rev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Category Pie */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-[#1B1B1B] mb-4">Sales by Category</h3>
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value">
                                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(v: number) => [`${v}%`, "Share"]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                        {categoryData.map((c) => (
                            <div key={c.name} className="flex items-center gap-1.5 text-xs text-[#5F6368]">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                                {c.name} ({c.value}%)
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders by Status */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-[#1B1B1B] mb-4">Orders by Status</h3>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={orderStatusData} layout="vertical">
                                <XAxis type="number" tick={{ fontSize: 11, fill: "#9E9E9E" }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="status" tick={{ fontSize: 11, fill: "#5F6368" }} axisLine={false} tickLine={false} width={110} />
                                <Tooltip />
                                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                    {orderStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Top Farmers */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-[#1B1B1B] mb-4">Top Farmers by Rating</h3>
                    <div className="space-y-3">
                        {topFarmers.map((f, i) => (
                            <div key={f.id} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-[#9E9E9E] w-4">#{i + 1}</span>
                                <img src={f.avatar} alt={f.name} className="w-8 h-8 rounded-full object-cover" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#1B1B1B] truncate">{f.name}</p>
                                    <p className="text-xs text-[#9E9E9E] truncate">{f.farmName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-[#1B5E20]">⭐ {f.rating}</p>
                                    <p className="text-xs text-[#9E9E9E]">{f.reviewCount} reviews</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
