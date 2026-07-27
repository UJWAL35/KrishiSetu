import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Truck,
    Package,
    Star,
    IndianRupee,
    CheckCircle2,
    Wifi,
    WifiOff,
    AlertCircle,
    ChevronRight,
    MapPin,
    Navigation,
    TrendingUp,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pending", color: "#9E9E9E", bg: "#F5F5F5" },
    assigned: { label: "Assigned", color: "#01579B", bg: "#E3F2FD" },
    picked_up: { label: "Picked Up", color: "#E65100", bg: "#FFF3E0" },
    at_warehouse: { label: "At Warehouse", color: "#6A1B9A", bg: "#F3E5F5" },
    out_for_delivery: { label: "Out for Delivery", color: "#2E7D32", bg: "#E8F5E9" },
    delivered: { label: "Delivered", color: "#1B5E20", bg: "#C8E6C9" },
    cancelled: { label: "Cancelled", color: "#C62828", bg: "#FFEBEE" },
};

export default function DeliveryDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isAvailable, setIsAvailable] = useState(false);
    const [toggling, setToggling] = useState(false);

    const utils = trpc.useUtils();
    const { data: profile } = trpc.delivery.getMyPartnerProfile.useQuery();
    const { data: myDeliveries } = trpc.delivery.myDeliveries.useQuery();
    const setAvailabilityMutation = trpc.delivery.partnerSetAvailability.useMutation();

    useEffect(() => {
        if (profile) setIsAvailable(profile.isAvailable ?? false);
    }, [profile]);

    const registerMutation = trpc.delivery.registerAsPartner.useMutation();
    useEffect(() => {
        if (profile === null && user) {
            registerMutation.mutate({ vehicleType: "bike" }, { onSuccess: () => { void utils.delivery.getMyPartnerProfile.invalidate(); } });
        }
    }, [profile, user]);

    const activeDeliveries = myDeliveries?.filter((d) =>
        ["assigned", "picked_up", "at_warehouse", "out_for_delivery"].includes(d.status)
    ) || [];
    const completedToday = myDeliveries?.filter(
        (d) =>
            d.status === "delivered" &&
            d.deliveredAt &&
            new Date(d.deliveredAt).toDateString() === new Date().toDateString()
    ).length || 0;

    const totalEarnings = profile?.totalEarnings ? parseFloat(profile.totalEarnings as string) : 0;

    const handleToggleAvailability = async () => {
        setToggling(true);
        try {
            await setAvailabilityMutation.mutateAsync({ isAvailable: !isAvailable });
            setIsAvailable(!isAvailable);
            void utils.delivery.getMyPartnerProfile.invalidate();
        } finally {
            setToggling(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    };

    return (
        <div className="min-h-screen bg-[#F0F7FF] p-4 lg:p-8">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-5xl mx-auto space-y-6"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0D1B2A]">
                            Hey, {user?.name?.split(" ")[0] || "Partner"}
                        </h1>
                        <p className="text-sm text-[#5F6368] mt-0.5">
                            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleToggleAvailability}
                        disabled={toggling}
                        className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-semibold text-sm shadow-lg transition-all ${isAvailable
                            ? "bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] text-white shadow-green-200"
                            : "bg-white text-[#9E9E9E] border-2 border-[#E0E0E0]"
                            } disabled:opacity-50`}
                    >
                        {toggling ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isAvailable ? (
                            <Wifi className="w-4 h-4" />
                        ) : (
                            <WifiOff className="w-4 h-4" />
                        )}
                        {isAvailable ? "Online" : "Go Online"}
                    </motion.button>
                </motion.div>

                {!isAvailable && (
                    <motion.div
                        variants={itemVariants}
                        className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3"
                    >
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-sm text-amber-700">
                            You are currently <strong>offline</strong>. Go online to receive delivery assignments.
                        </p>
                    </motion.div>
                )}

                <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: "Total Deliveries",
                            value: profile?.totalDeliveries ?? 0,
                            icon: Package,
                            color: "#01579B",
                            bg: "#E3F2FD",
                        },
                        {
                            label: "Today Delivered",
                            value: completedToday,
                            icon: CheckCircle2,
                            color: "#2E7D32",
                            bg: "#E8F5E9",
                        },
                        {
                            label: "Avg Rating",
                            value: profile?.avgRating ? `${(profile.avgRating as number).toFixed(1)}★` : "N/A",
                            icon: Star,
                            color: "#F9A825",
                            bg: "#FFF8E1",
                        },
                        {
                            label: "Total Earnings",
                            value: `₹${totalEarnings.toLocaleString("en-IN")}`,
                            icon: IndianRupee,
                            color: "#1B5E20",
                            bg: "#F1F8E9",
                        },
                    ].map((stat) => (
                        <motion.div
                            key={stat.label}
                            whileHover={{ y: -3 }}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8EDF5]"
                        >
                            <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                                style={{ backgroundColor: stat.bg }}
                            >
                                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                            </div>
                            <p className="text-xl font-bold text-[#0D1B2A]">{stat.value}</p>
                            <p className="text-xs text-[#9E9E9E] mt-0.5">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-[#E8EDF5] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F4FA]">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <h2 className="font-semibold text-[#0D1B2A]">Active Deliveries</h2>
                            {activeDeliveries.length > 0 && (
                                <span className="text-xs bg-[#01579B] text-white px-2 py-0.5 rounded-full">
                                    {activeDeliveries.length}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => navigate("/delivery/orders")}
                            className="text-xs text-[#01579B] font-medium hover:underline flex items-center gap-1"
                        >
                            View All <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    {activeDeliveries.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-[#E3F2FD] flex items-center justify-center mx-auto mb-3">
                                <Truck className="w-8 h-8 text-[#01579B]" />
                            </div>
                            <p className="text-[#9E9E9E] text-sm">No active deliveries right now</p>
                            <p className="text-xs text-[#BDBDBD] mt-1">
                                {isAvailable ? "Waiting for assignment…" : "Go online to receive orders"}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#F0F4FA]">
                            {activeDeliveries.map((delivery) => {
                                const cfg = statusConfig[delivery.status] || statusConfig.assigned;
                                return (
                                    <motion.div
                                        key={delivery.id}
                                        whileHover={{ backgroundColor: "#F8FBFF" }}
                                        className="px-6 py-4 cursor-pointer"
                                        onClick={() => navigate("/delivery/orders")}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-mono text-sm font-semibold text-[#01579B]">
                                                        #{delivery.orderNumber}
                                                    </span>
                                                    {delivery.totalLegs > 1 && (
                                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                                            Leg {delivery.legIndex}/{delivery.totalLegs}
                                                        </span>
                                                    )}
                                                    <span
                                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                                                    >
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-[#5F6368]">{delivery.cropName}</p>
                                                <div className="flex items-center gap-1 mt-1.5 text-xs text-[#9E9E9E]">
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="truncate max-w-[250px]">{delivery.deliveryAddress}</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-semibold text-[#1B5E20]">
                                                    +₹{delivery.partnerEarning}
                                                </p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate("/delivery/map"); }}
                                                    className="mt-1 flex items-center gap-1 text-xs text-[#01579B] hover:underline"
                                                >
                                                    <Navigation className="w-3 h-3" />
                                                    Navigate
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {myDeliveries && myDeliveries.filter((d) => d.status === "delivered").length > 0 && (
                    <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-sm border border-[#E8EDF5] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#F0F4FA]">
                            <h2 className="font-semibold text-[#0D1B2A] flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-[#2E7D32]" />
                                Recent Deliveries
                            </h2>
                        </div>
                        <div className="divide-y divide-[#F0F4FA]">
                            {myDeliveries.filter((d) => d.status === "delivered").slice(0, 4).map((delivery) => (
                                <div key={delivery.id} className="px-6 py-3 flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                                        <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-[#0D1B2A]">
                                            {delivery.orderNumber} — {delivery.cropName}
                                        </p>
                                        <p className="text-xs text-[#9E9E9E]">
                                            {delivery.deliveredAt
                                                ? new Date(delivery.deliveredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                                                : "Completed"}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold text-[#1B5E20]">+₹{delivery.partnerEarning}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}