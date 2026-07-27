import { motion } from "framer-motion";
import {
    Users,
    ShoppingBag,
    Package,
    AlertTriangle,
    TrendingUp,
    ChevronDown,
    Wrench,
    CheckCircle2,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";

const revenueData = [
    { month: "Jan", revenue: 45000 },
    { month: "Feb", revenue: 52000 },
    { month: "Mar", revenue: 48000 },
    { month: "Apr", revenue: 61000 },
    { month: "May", revenue: 55000 },
    { month: "Jun", revenue: 67000 },
    { month: "Jul", revenue: 71000 },
    { month: "Aug", revenue: 58000 },
    { month: "Sep", revenue: 74000 },
    { month: "Oct", revenue: 82000 },
    { month: "Nov", revenue: 78000 },
    { month: "Dec", revenue: 91000 },
];

const sensorStatusData = [
    { name: "Optimal", value: 65, color: "#2E7D32" },
    { name: "Warning", value: 20, color: "#F9A825" },
    { name: "Critical", value: 10, color: "#C62828" },
    { name: "Offline", value: 5, color: "#9E9E9E" },
];

const statusBadgeStyles: Record<string, string> = {
    delivered: "bg-[#2E7D3215] text-[#2E7D32]",
    processing: "bg-[#00BCD415] text-[#00BCD4]",
    pending: "bg-[#F9A82515] text-[#F9A825]",
    cancelled: "bg-[#C6282815] text-[#C62828]",
    confirmed: "bg-[#1B5E2015] text-[#1B5E20]",
    out_for_delivery: "bg-[#6A1B9A15] text-[#6A1B9A]",
};

export default function AdminDashboard() {
    const { data: adminStats } = trpc.admin.getStats.useQuery();
    const { data: recentOrders } = trpc.admin.getRecentOrders.useQuery();
    const { data: sensorIssues, refetch: refetchIssues } = trpc.sensor.getIssues.useQuery({ status: "open" });
    const resolveIssue = trpc.sensor.resolveIssue.useMutation();

    const handleResolve = async (id: number) => {
        if (!confirm("Mark this issue as resolved?")) return;
        await resolveIssue.mutateAsync({ id });
        refetchIssues();
    };

    const stats = [
        { label: "Total Farmers", value: adminStats?.totalFarmers?.toString() || "0", change: "", icon: Users, color: "#1B5E20" },
        { label: "Total Users", value: adminStats?.activeUsers?.toString() || "0", change: "", icon: ShoppingBag, color: "#00BCD4" },
        { label: "Total Orders", value: adminStats?.totalOrders?.toString() || "0", change: "", icon: Package, color: "#F9A825" },
        { label: "Sensor Alerts", value: adminStats?.sensorAlerts?.toString() || "0", change: "", icon: AlertTriangle, color: "#C62828" },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
        <div className="min-h-screen bg-[#F1F8E9] p-6">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto space-y-6"
            >
                {/* Top Bar */}
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1B1B1B]">Dashboard</h1>
                        <p className="text-sm text-[#5F6368]">Welcome back, Admin</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] flex items-center justify-center text-white text-sm font-bold">
                            A
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                variants={itemVariants}
                                whileHover={{ y: -2 }}
                                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${stat.color}15` }}
                                    >
                                        <Icon className="w-6 h-6" style={{ color: stat.color }} />
                                    </div>
                                    {stat.change && (
                                        <span className="text-xs font-medium text-[#2E7D32] flex items-center gap-0.5">
                                            <TrendingUp className="w-3 h-3" />
                                            {stat.change}
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-[#1B1B1B]">{stat.value}</p>
                                <p className="text-sm text-[#5F6368] mt-1">{stat.label}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Revenue Chart */}
                    <motion.div variants={itemVariants} className="lg:col-span-3 bg-white rounded-xl p-6 shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-[#1B1B1B]">Monthly Revenue</h3>
                            <button className="flex items-center gap-1 text-xs px-3 py-1.5 bg-[#F1F8E9] rounded-full text-[#5F6368]">
                                This Year
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9E9E9E" }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12, fill: "#9E9E9E" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                                    <Tooltip
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                                        contentStyle={{ borderRadius: "8px", border: "1px solid #C8E6C9", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#4CAF50" strokeWidth={2} fill="url(#revenueGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Sensor Status Pie Chart */}
                    <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-xl p-6 shadow-md">
                        <h3 className="text-lg font-semibold text-[#1B1B1B] mb-6">Sensor Status</h3>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sensorStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {sensorStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-[#1B1B1B]">156</p>
                                <p className="text-xs text-[#5F6368]">Active Sensors</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-2">
                            {sensorStatusData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-[#5F6368]">{item.name}</span>
                                    </div>
                                    <span className="font-medium text-[#1B1B1B]">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Sensor Issues Table */}
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 shadow-md border-l-4 border-[#C62828]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-[#C62828]" />
                            <h3 className="text-lg font-semibold text-[#1B1B1B]">Open Sensor Issues</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-[#9E9E9E] uppercase bg-[#FFEBEE]">
                                    <th className="px-4 py-3 rounded-l-lg font-medium">Issue ID</th>
                                    <th className="px-4 py-3 font-medium">Field</th>
                                    <th className="px-4 py-3 font-medium">Sensor</th>
                                    <th className="px-4 py-3 font-medium">Issue</th>
                                    <th className="px-4 py-3 font-medium">Urgency</th>
                                    <th className="px-4 py-3 rounded-r-lg font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sensorIssues?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-6 text-sm text-[#9E9E9E]">No open issues. All sensors are optimal.</td>
                                    </tr>
                                ) : (
                                    sensorIssues?.map((issue) => (
                                        <tr key={issue.id} className="border-b border-[#FFEBEE]/50 hover:bg-[#FAFAFA] transition-colors">
                                            <td className="px-4 py-3 text-sm font-mono text-[#C62828]">#{issue.id}</td>
                                            <td className="px-4 py-3 text-sm">{issue.field}</td>
                                            <td className="px-4 py-3 text-sm capitalize">{issue.sensorType}</td>
                                            <td className="px-4 py-3 text-sm capitalize">{issue.issueType.replace("_", " ")}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                                                    issue.urgency === "critical" ? "bg-[#FFEBEE] text-[#C62828]" :
                                                    issue.urgency === "high" ? "bg-[#FFF3E0] text-[#EF6C00]" :
                                                    "bg-[#FFF8E1] text-[#F9A825]"
                                                }`}>
                                                    {issue.urgency}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleResolve(Number(issue.id))}
                                                    disabled={resolveIssue.isPending}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9] rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                >
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Resolve
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Recent Orders Table */}
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[#1B1B1B]">Recent Orders</h3>
                        <button className="text-sm text-[#1B5E20] font-medium hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-[#9E9E9E] uppercase bg-[#F1F8E9]">
                                    <th className="px-4 py-3 rounded-l-lg font-medium">Order ID</th>
                                    <th className="px-4 py-3 font-medium">Customer</th>
                                    <th className="px-4 py-3 font-medium">Crop</th>
                                    <th className="px-4 py-3 font-medium">Amount</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 rounded-r-lg font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders?.map((order) => (
                                    <tr key={order.id} className="border-b border-[#C8E6C9]/50 hover:bg-[#F1F8E9] transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm text-[#1B5E20]">{order.orderNumber}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <img src={order.customerAvatar} alt={order.customer} className="w-7 h-7 rounded-full object-cover border border-[#C8E6C9]" />
                                                <span className="text-sm">{order.customer}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{order.crop}</td>
                                        <td className="px-4 py-3 text-sm font-medium">₹{order.amount}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusBadgeStyles[order.status] || "bg-[#9E9E9E15] text-[#9E9E9E]"}`}>
                                                {order.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#5F6368]">{order.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
