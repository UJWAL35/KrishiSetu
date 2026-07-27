import { useState } from "react";
import { motion } from "framer-motion";
import {
    Star,
    Truck,
    Package,
    IndianRupee,
    Shield,
    MapPin,
    Bike,
    Car,
    CheckCircle2,
    Edit2,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";

const vehicleIcons: Record<string, React.ElementType> = {
    bike: Bike,
    auto: Car,
    van: Truck,
    truck: Truck,
};

function StarDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(rating) ? "text-[#F9A825] fill-[#F9A825]" : "text-[#E0E0E0]"}`}
                />
            ))}
        </div>
    );
}

export default function DeliveryProfile() {
    const { user } = useAuth();
    const { data: profile, refetch } = trpc.delivery.getMyPartnerProfile.useQuery();
    const { data: myDeliveries } = trpc.delivery.myDeliveries.useQuery();

    const totalEarnings = profile?.totalEarnings ? parseFloat(profile.totalEarnings as any) : 0;
    const avgRating = profile?.avgRating ? parseFloat(profile.avgRating as any) : 0;
    const totalDeliveries = profile?.totalDeliveries ?? 0;
    const completedDeliveries = myDeliveries?.filter((d) => d.status === "delivered").length ?? 0;

    const VehicleIcon = vehicleIcons[profile?.vehicleType || "bike"] || Truck;

    return (
        <div className="min-h-screen bg-[#F0F7FF] p-4 lg:p-8">
            <div className="max-w-2xl mx-auto space-y-5">
                {/* Profile Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#01579B] to-[#003D6B] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl"
                >
                    {/* Background deco */}
                    <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
                    <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />

                    <div className="relative flex items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-3xl font-bold shadow-inner">
                            {user?.name?.[0]?.toUpperCase() || "D"}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold">{user?.name || "Delivery Partner"}</h1>
                            <p className="text-white/70 text-sm mt-0.5">{user?.phone}</p>
                            <div className="flex items-center gap-2 mt-2">
                                {profile?.isVerified ? (
                                    <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-300 px-2.5 py-1 rounded-full font-semibold">
                                        <Shield className="w-3 h-3" /> Verified Partner
                                    </span>
                                ) : (
                                    <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2.5 py-1 rounded-full font-semibold">
                                        Pending Verification
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-[10px] bg-white/10 text-white/80 px-2.5 py-1 rounded-full capitalize">
                                    <VehicleIcon className="w-3 h-3" />
                                    {profile?.vehicleType || "bike"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{totalDeliveries}</p>
                            <p className="text-white/50 text-xs mt-0.5">Total Deliveries</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <p className="text-2xl font-bold">{avgRating > 0 ? avgRating.toFixed(1) : "—"}</p>
                                {avgRating > 0 && <Star className="w-4 h-4 text-[#FFD54F] fill-[#FFD54F]" />}
                            </div>
                            <p className="text-white/50 text-xs mt-0.5">Avg Rating</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">₹{totalEarnings.toLocaleString("en-IN")}</p>
                            <p className="text-white/50 text-xs mt-0.5">Total Earned</p>
                        </div>
                    </div>
                </motion.div>

                {/* Rating Stars */}
                {avgRating > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8EDF5]"
                    >
                        <h3 className="font-semibold text-[#0D1B2A] mb-3">Your Rating</h3>
                        <div className="flex items-center gap-4">
                            <p className="text-5xl font-bold text-[#0D1B2A]">{avgRating.toFixed(1)}</p>
                            <div>
                                <StarDisplay rating={avgRating} />
                                <p className="text-xs text-[#9E9E9E] mt-1">Based on {totalDeliveries} deliveries</p>
                            </div>
                        </div>
                        <div className="mt-4 space-y-1.5">
                            {[5, 4, 3, 2, 1].map((star) => (
                                <div key={star} className="flex items-center gap-2">
                                    <span className="text-xs text-[#9E9E9E] w-3">{star}</span>
                                    <Star className="w-3 h-3 text-[#F9A825] fill-[#F9A825]" />
                                    <div className="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#F9A825] rounded-full"
                                            style={{
                                                width: star === Math.round(avgRating) ? "60%" :
                                                       star > Math.round(avgRating) ? "15%" : "25%",
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Vehicle & License */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8EDF5]"
                >
                    <h3 className="font-semibold text-[#0D1B2A] mb-4">Vehicle Details</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-3 border-b border-[#F5F5F5]">
                            <div className="flex items-center gap-2 text-sm text-[#5F6368]">
                                <VehicleIcon className="w-4 h-4 text-[#01579B]" />
                                Vehicle Type
                            </div>
                            <span className="text-sm font-semibold text-[#0D1B2A] capitalize">
                                {profile?.vehicleType || "—"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-2 text-sm text-[#5F6368]">
                                <Shield className="w-4 h-4 text-[#01579B]" />
                                License Number
                            </div>
                            <span className="text-sm font-semibold text-[#0D1B2A]">
                                {profile?.licenseNumber || "Not provided"}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Performance Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-4"
                >
                    {[
                        { label: "Completed", value: completedDeliveries, icon: CheckCircle2, color: "#2E7D32", bg: "#E8F5E9" },
                        { label: "Total Earned", value: `₹${totalEarnings.toLocaleString("en-IN")}`, icon: IndianRupee, color: "#1B5E20", bg: "#F1F8E9" },
                    ].map((s) => (
                        <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8EDF5]">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
                                <s.icon className="w-5 h-5" style={{ color: s.color }} />
                            </div>
                            <p className="text-xl font-bold text-[#0D1B2A]">{s.value}</p>
                            <p className="text-xs text-[#9E9E9E] mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Account Info */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-[#E8EDF5]"
                >
                    <h3 className="font-semibold text-[#0D1B2A] mb-4">Account Details</h3>
                    <div className="space-y-3">
                        {[
                            { label: "Full Name", value: user?.name || "—" },
                            { label: "Phone", value: user?.phone || "—" },
                            { label: "Member Since", value: profile?.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                                : "—" },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-[#F5F5F5] last:border-0">
                                <p className="text-sm text-[#9E9E9E]">{item.label}</p>
                                <p className="text-sm font-semibold text-[#0D1B2A]">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
