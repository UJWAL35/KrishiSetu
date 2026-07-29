import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package,
    MapPin,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Truck,
    Warehouse,
    Navigation,
    Phone,
    X,
    KeyRound,
    Star,
    ArrowRight,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";

type Status = "pending" | "assigned" | "picked_up" | "at_warehouse" | "out_for_delivery" | "delivered" | "cancelled";

const statusSteps: { key: Status; label: string; icon: React.ElementType }[] = [
    { key: "assigned",         label: "Assigned",          icon: Package },
    { key: "picked_up",        label: "Picked Up",         icon: Truck },
    { key: "at_warehouse",     label: "At Warehouse",      icon: Warehouse },
    { key: "out_for_delivery", label: "Out for Delivery",  icon: Navigation },
    { key: "delivered",        label: "Delivered",         icon: CheckCircle2 },
];

const statusOrder: Status[] = ["assigned", "picked_up", "at_warehouse", "out_for_delivery", "delivered"];
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending:           { label: "Pending",           color: "#9E9E9E", bg: "#F5F5F5" },
    assigned:          { label: "Assigned",          color: "#01579B", bg: "#E3F2FD" },
    picked_up:         { label: "Picked Up",         color: "#E65100", bg: "#FFF3E0" },
    at_warehouse:      { label: "At Warehouse",      color: "#6A1B9A", bg: "#F3E5F5" },
    out_for_delivery:  { label: "Out for Delivery",  color: "#2E7D32", bg: "#E8F5E9" },
    delivered:         { label: "Delivered",         color: "#1B5E20", bg: "#C8E6C9" },
    cancelled:         { label: "Cancelled",         color: "#C62828", bg: "#FFEBEE" },
};

function getNextStatus(current: Status, isLastLeg: boolean, totalLegs: number): Status | null {
    if (current === "assigned") {
        if (isLastLeg && totalLegs > 1) {
            return "out_for_delivery";
        }
        return "picked_up";
    }
    if (current === "picked_up")        return isLastLeg ? "out_for_delivery" : "at_warehouse";
    if (current === "at_warehouse")     return isLastLeg ? "out_for_delivery" : null;
    return null;
}

export default function DeliveryOrders() {
    const navigate = useNavigate();
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [otpModal, setOtpModal] = useState<{ deliveryId: number; orderNumber: string } | null>(null);
    const [otpInput, setOtpInput] = useState("");
    const [otpError, setOtpError] = useState("");
    const [otpSuccess, setOtpSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

    const { data: myDeliveries, refetch } = trpc.delivery.myDeliveries.useQuery();
    const updateStatusMutation = trpc.delivery.updateDeliveryStatus.useMutation();
    const verifyOTPMutation = trpc.delivery.verifyOTP.useMutation();

    const active = myDeliveries?.filter((d) => {
        if (d.status === "delivered" || d.status === "cancelled") return false;
        if (d.status === "at_warehouse" && d.legIndex !== d.totalLegs) return false;
        return true;
    }) || [];
    
    const completed = myDeliveries?.filter((d) => {
        if (d.status === "delivered" || d.status === "cancelled") return true;
        if (d.status === "at_warehouse" && d.legIndex !== d.totalLegs) return true;
        return false;
    }) || [];
    const displayed = activeTab === "active" ? active : completed;

    const handleStatusUpdate = async (deliveryId: number, newStatus: Status) => {
        await updateStatusMutation.mutateAsync({ deliveryId, status: newStatus });
        refetch();
    };

    const handleVerifyOTP = async () => {
        if (!otpModal) return;
        setOtpError("");
        try {
            await verifyOTPMutation.mutateAsync({ deliveryId: otpModal.deliveryId, otp: otpInput });
            setOtpSuccess(true);
            setTimeout(() => {
                setOtpModal(null);
                setOtpInput("");
                setOtpSuccess(false);
                refetch();
            }, 1500);
        } catch (e: any) {
            setOtpError(e.message || "Invalid OTP");
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F7FF] p-4 lg:p-8">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-[#0D1B2A]">My Deliveries</h1>
                    <p className="text-sm text-[#9E9E9E] mt-1">Manage your assigned delivery legs</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-[#E8EDF5] w-fit">
                    {[
                        { key: "active" as const, label: `Active (${active.length})` },
                        { key: "completed" as const, label: `Completed (${completed.length})` },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.key
                                    ? "bg-[#01579B] text-white shadow-md"
                                    : "text-[#9E9E9E] hover:text-[#01579B]"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Delivery Cards */}
                <div className="space-y-4">
                    {displayed.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-[#E8EDF5]">
                            <div className="w-16 h-16 rounded-full bg-[#E3F2FD] flex items-center justify-center mx-auto mb-3">
                                <Truck className="w-8 h-8 text-[#01579B]" />
                            </div>
                            <p className="text-[#9E9E9E]">No {activeTab} deliveries</p>
                        </div>
                    ) : (
                        displayed.map((delivery) => {
                            const cfg = statusConfig[delivery.status] || statusConfig.assigned;
                            const isExpanded = expandedId === delivery.id;
                            const nextStatus = getNextStatus(
                                delivery.status as Status,
                                delivery.legIndex === delivery.totalLegs,
                                delivery.totalLegs
                            );
                            const currentIdx = statusOrder.indexOf(delivery.status as Status);

                            return (
                                <motion.div
                                    key={delivery.id}
                                    layout
                                    className="bg-white rounded-2xl shadow-sm border border-[#E8EDF5] overflow-hidden"
                                >
                                    {/* Card Header */}
                                    <div
                                        className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[#F8FBFF] transition-colors"
                                        onClick={() => setExpandedId(isExpanded ? null : delivery.id)}
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-mono text-sm font-bold text-[#01579B]">
                                                    {delivery.orderNumber}
                                                </span>
                                                {delivery.totalLegs > 1 && (
                                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                                                        Leg {delivery.legIndex}/{delivery.totalLegs}
                                                    </span>
                                                )}
                                                <span
                                                    className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                                                    style={{ color: cfg.color, backgroundColor: cfg.bg }}
                                                >
                                                    {cfg.label}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#5F6368] mt-0.5">{delivery.cropName}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-semibold text-[#1B5E20]">+₹{delivery.partnerEarning}</p>
                                            
                                            {/* Quick Action Button in Header */}
                                            {delivery.status !== "delivered" && delivery.status !== "cancelled" && (
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    {delivery.status === "out_for_delivery" && delivery.legIndex === delivery.totalLegs ? (
                                                        <button
                                                            onClick={() => {
                                                                setOtpInput("");
                                                                setOtpError("");
                                                                setOtpModal({ deliveryId: delivery.id, orderNumber: delivery.orderNumber || "" });
                                                            }}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2E7D32] text-white text-xs font-semibold shadow hover:bg-[#1B5E20] transition-colors"
                                                        >
                                                            <KeyRound className="w-3.5 h-3.5" />
                                                            Enter OTP
                                                        </button>
                                                    ) : nextStatus ? (
                                                        <button
                                                            onClick={() => handleStatusUpdate(delivery.id, nextStatus)}
                                                            disabled={updateStatusMutation.isPending}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#01579B] text-white text-xs font-semibold shadow hover:bg-[#0277BD] transition-colors disabled:opacity-50"
                                                        >
                                                            <ArrowRight className="w-3.5 h-3.5" />
                                                            {statusConfig[nextStatus]?.label}
                                                        </button>
                                                    ) : null}
                                                </div>
                                            )}

                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-[#9E9E9E]" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-[#9E9E9E]" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="border-t border-[#F0F4FA]"
                                            >
                                                <div className="p-5 space-y-4">
                                                    {/* Route Info */}
                                                    <div className="bg-[#F0F7FF] rounded-xl p-4 space-y-3">
                                                        <div className="flex gap-3">
                                                            <div className="flex flex-col items-center gap-1 pt-1">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#01579B]" />
                                                                <div className="w-0.5 h-8 bg-[#B3D4F5]" />
                                                                <div className="w-2.5 h-2.5 rounded-full bg-[#2E7D32]" />
                                                            </div>
                                                            <div className="flex-1 space-y-3">
                                                                <div>
                                                                    <p className="text-[10px] text-[#9E9E9E] uppercase tracking-wide">Pickup</p>
                                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.pickupAddress || "")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#01579B] font-medium hover:underline flex items-center gap-1">
                                                                        {delivery.pickupAddress} <Navigation className="w-3 h-3" />
                                                                    </a>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-[#9E9E9E] uppercase tracking-wide">Drop-off</p>
                                                                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.deliveryAddress || "")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#01579B] font-medium hover:underline flex items-center gap-1">
                                                                        {delivery.deliveryAddress} <Navigation className="w-3 h-3" />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Customer Info */}
                                                    {delivery.customerName && delivery.legIndex === delivery.totalLegs && (
                                                        <div className="flex items-center gap-3 bg-[#F8FBF8] rounded-xl p-3">
                                                            <div className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                                                                <span className="text-sm font-bold text-[#2E7D32]">
                                                                    {delivery.customerName[0]}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-[#0D1B2A]">{delivery.customerName}</p>
                                                                <p className="text-xs text-[#9E9E9E]">Customer</p>
                                                            </div>
                                                            {delivery.customerPhone && (
                                                                <a
                                                                    href={`tel:${delivery.customerPhone}`}
                                                                    className="w-8 h-8 rounded-full bg-[#E3F2FD] flex items-center justify-center"
                                                                >
                                                                    <Phone className="w-4 h-4 text-[#01579B]" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Progress Stepper */}
                                                    <div className="flex items-center gap-1">
                                                        {statusSteps.map((step, idx) => {
                                                            const stepIdx = statusOrder.indexOf(step.key);
                                                            const isDone = stepIdx <= currentIdx;
                                                            const isCurrent = stepIdx === currentIdx;
                                                            return (
                                                                <div key={step.key} className="flex items-center flex-1">
                                                                    <div className="flex flex-col items-center gap-1 flex-1">
                                                                        <div
                                                                            className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                                                                                isDone
                                                                                    ? "bg-[#01579B] border-[#01579B]"
                                                                                    : "bg-white border-[#E0E0E0]"
                                                                            } ${isCurrent ? "ring-4 ring-[#01579B]/20" : ""}`}
                                                                        >
                                                                            <step.icon
                                                                                className={`w-3 h-3 ${isDone ? "text-white" : "text-[#BDBDBD]"}`}
                                                                            />
                                                                        </div>
                                                                        <span className={`text-[9px] text-center leading-tight ${isCurrent ? "text-[#01579B] font-semibold" : "text-[#BDBDBD]"}`}>
                                                                            {step.label}
                                                                        </span>
                                                                    </div>
                                                                    {idx < statusSteps.length - 1 && (
                                                                        <div className={`flex-1 h-0.5 mb-4 ${stepIdx < currentIdx ? "bg-[#01579B]" : "bg-[#E0E0E0]"}`} />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    {delivery.status !== "delivered" && delivery.status !== "cancelled" && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => navigate("/delivery/map")}
                                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-[#01579B] text-[#01579B] text-sm font-medium hover:bg-[#E3F2FD] transition-colors"
                                                            >
                                                                <Navigation className="w-4 h-4" />
                                                                Navigate
                                                            </button>

                                                            {delivery.status === "out_for_delivery" && delivery.legIndex === delivery.totalLegs ? (
                                                                <button
                                                                    onClick={() => {
                                                                        setOtpInput("");
                                                                        setOtpError("");
                                                                        setOtpModal({ deliveryId: delivery.id, orderNumber: delivery.orderNumber || "" });
                                                                    }}
                                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                                                                >
                                                                    <KeyRound className="w-4 h-4" />
                                                                    Verify OTP
                                                                </button>
                                                            ) : nextStatus ? (
                                                                <button
                                                                    onClick={() => handleStatusUpdate(delivery.id, nextStatus)}
                                                                    disabled={updateStatusMutation.isPending}
                                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#01579B] to-[#0277BD] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                                                                >
                                                                    <ArrowRight className="w-4 h-4" />
                                                                    {statusConfig[nextStatus]?.label}
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* OTP Modal */}
            <AnimatePresence>
                {otpModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 60, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
                        >
                            {otpSuccess ? (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-[#0D1B2A] mb-2">Delivered! 🎉</h3>
                                    <p className="text-[#9E9E9E] text-sm">Order successfully delivered</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold text-[#0D1B2A]">Verify Delivery</h3>
                                            <p className="text-sm text-[#9E9E9E] mt-0.5">
                                                Order {otpModal.orderNumber}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setOtpModal(null)}
                                            className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center hover:bg-[#EEEEEE]"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="bg-[#E3F2FD] rounded-xl p-4 mb-5 flex items-start gap-3">
                                        <KeyRound className="w-5 h-5 text-[#01579B] flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-[#01579B]">
                                            Ask the customer for the 6-digit OTP shown in their app to confirm delivery.
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <label className="text-xs font-semibold text-[#5F6368] uppercase tracking-wide mb-2 block">
                                            Customer OTP
                                        </label>
                                        <input
                                            type="tel"
                                            maxLength={6}
                                            value={otpInput}
                                            onChange={(e) => {
                                                setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                                                setOtpError("");
                                            }}
                                            placeholder="• • • • • •"
                                            className="w-full text-center text-2xl font-bold tracking-[0.5em] border-2 border-[#E0E0E0] rounded-xl px-4 py-3 focus:border-[#01579B] focus:ring-4 focus:ring-[#01579B]/10 outline-none transition-all"
                                        />
                                        {otpError && (
                                            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> {otpError}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        onClick={handleVerifyOTP}
                                        disabled={otpInput.length !== 6 || verifyOTPMutation.isPending}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2E7D32] to-[#4CAF50] text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {verifyOTPMutation.isPending ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" />
                                                Confirm Delivery
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
