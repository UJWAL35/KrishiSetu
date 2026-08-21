import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Truck,
    Users,
    MapPin,
    Package,
    Star,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronDown,
    Wifi,
    WifiOff,
    Navigation,
    IndianRupee,
    ArrowRight,
    X,
    Warehouse,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending:           { label: "Pending",           color: "#9E9E9E", bg: "#F5F5F5" },
    assigned:          { label: "Assigned",          color: "#01579B", bg: "#E3F2FD" },
    picked_up:         { label: "Picked Up",         color: "#E65100", bg: "#FFF3E0" },
    at_warehouse:      { label: "At Warehouse",      color: "#6A1B9A", bg: "#F3E5F5" },
    out_for_delivery:  { label: "Out for Delivery",  color: "#2E7D32", bg: "#E8F5E9" },
    delivered:         { label: "Delivered",         color: "#1B5E20", bg: "#C8E6C9" },
    cancelled:         { label: "Cancelled",         color: "#C62828", bg: "#FFEBEE" },
};

type Tab = "overview" | "partners" | "deliveries" | "warehouses" | "assign";

import LiveDeliveryMap from "@/components/shared/LiveDeliveryMap";

// ── Assign Delivery Modal ───────────────────────────────────
function AssignModal({ orders, partners, onClose, onAssign }: {
    orders: any[];
    partners: any[];
    onClose: () => void;
    onAssign: (orderId: number, partnerId: number) => Promise<void>;
}) {
    const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
    const [selectedPartner, setSelectedPartner] = useState<number | null>(null);
    const [assigning, setAssigning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleAssign = async () => {
        if (!selectedOrder || !selectedPartner) return;
        setAssigning(true);
        try {
            await onAssign(selectedOrder, selectedPartner);
            setResult("✅ Delivery assigned successfully! Legs created based on distance.");
        } catch (e: any) {
            setResult(`❌ ${e.message}`);
        } finally {
            setAssigning(false);
        }
    };

    const pendingOrders = orders.filter((o) => ["pending", "confirmed"].includes(o.status));
    const availablePartners = partners.filter((p) => p.isAvailable);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-7 w-full max-w-lg shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#0D1B2A]">Assign Delivery</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {result ? (
                    <div className={`p-4 rounded-xl text-sm mb-4 ${result.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {result}
                        <p className="text-xs text-[#9E9E9E] mt-1">
                            The system automatically plans chain delivery legs if the distance exceeds 200km.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <label className="text-xs font-semibold text-[#5F6368] uppercase tracking-wide mb-2 block">
                                Select Order ({pendingOrders.length} pending)
                            </label>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {pendingOrders.length === 0 && (
                                    <p className="text-sm text-[#9E9E9E] text-center py-4">No pending orders</p>
                                )}
                                {pendingOrders.map((o) => (
                                    <button
                                        key={o.id}
                                        onClick={() => setSelectedOrder(o.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                                            selectedOrder === o.id
                                                ? "border-[#01579B] bg-[#E3F2FD]"
                                                : "border-[#E0E0E0] hover:border-[#01579B]/40"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-sm font-bold text-[#01579B]">{o.orderNumber}</span>
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full`} style={{ color: statusConfig[o.status]?.color, backgroundColor: statusConfig[o.status]?.bg }}>
                                                {statusConfig[o.status]?.label || o.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#5F6368] mt-0.5">{o.customer} — {o.crop}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="text-xs font-semibold text-[#5F6368] uppercase tracking-wide mb-2 block">
                                Select Partner ({availablePartners.length} online)
                            </label>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {availablePartners.length === 0 && (
                                    <p className="text-sm text-[#9E9E9E] text-center py-4">No partners online right now</p>
                                )}
                                {availablePartners.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPartner(p.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                                            selectedPartner === p.id
                                                ? "border-[#01579B] bg-[#E3F2FD]"
                                                : "border-[#E0E0E0] hover:border-[#01579B]/40"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#E3F2FD] flex items-center justify-center text-sm font-bold text-[#01579B]">
                                                {p.name?.[0] || "D"}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-[#0D1B2A]">{p.name}</p>
                                                <p className="text-xs text-[#9E9E9E]">{p.vehicleType} · ⭐ {(p.avgRating || 0).toFixed(1)}</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">
                                If the delivery is <strong>over 200km</strong>, the system will automatically create a <strong>chain delivery</strong> through the nearest warehouses.
                            </p>
                        </div>

                        <button
                            onClick={handleAssign}
                            disabled={!selectedOrder || !selectedPartner || assigning}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#01579B] to-[#0277BD] text-white font-semibold shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {assigning ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Truck className="w-4 h-4" /> Assign Delivery
                                </>
                            )}
                        </button>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}

function AssignLegModal({ deliveryId, partners, onClose, onAssign }: {
    deliveryId: number;
    partners: any[];
    onClose: () => void;
    onAssign: (deliveryId: number, partnerId: number) => Promise<void>;
}) {
    const [selectedPartner, setSelectedPartner] = useState<number | null>(null);
    const [assigning, setAssigning] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleAssign = async () => {
        if (!selectedPartner) return;
        setAssigning(true);
        try {
            await onAssign(deliveryId, selectedPartner);
            setResult("✅ Leg assigned successfully!");
        } catch (e: any) {
            setResult(`❌ ${e.message}`);
        } finally {
            setAssigning(false);
        }
    };

    const availablePartners = partners.filter((p) => p.isAvailable);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-7 w-full max-w-lg shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#0D1B2A]">Assign Next Leg</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {result ? (
                    <div className={`p-4 rounded-xl text-sm mb-4 ${result.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {result}
                    </div>
                ) : (
                    <>
                        <div className="mb-5">
                            <label className="text-xs font-semibold text-[#5F6368] uppercase tracking-wide mb-2 block">
                                Select Partner ({availablePartners.length} online)
                            </label>
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {availablePartners.length === 0 && (
                                    <p className="text-sm text-[#9E9E9E] text-center py-4">No partners online right now</p>
                                )}
                                {availablePartners.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPartner(p.id)}
                                        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                                            selectedPartner === p.id
                                                ? "border-[#01579B] bg-[#E3F2FD]"
                                                : "border-[#E0E0E0] hover:border-[#01579B]/40"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm text-[#0D1B2A]">{p.name}</span>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32]">
                                                Online
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-[#F9A825] fill-[#F9A825]" />
                                                <span className="text-xs text-[#9E9E9E]">{(p.avgRating || 0).toFixed(1)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Truck className="w-3 h-3 text-[#9E9E9E]" />
                                                <p className="text-xs text-[#9E9E9E]">{p.vehicleType}</p>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleAssign}
                            disabled={!selectedPartner || assigning}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#01579B] to-[#0277BD] text-white font-semibold shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {assigning ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Truck className="w-4 h-4" /> Assign Leg
                                </>
                            )}
                        </button>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
}

// ── Main Admin Delivery Page ────────────────────────────────
export default function AdminDelivery() {
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [showAssign, setShowAssign] = useState(false);
    const [assigningLegId, setAssigningLegId] = useState<number | null>(null);

    const { data: stats } = trpc.delivery.adminGetDeliveryStats.useQuery();
    const { data: partners } = trpc.delivery.adminGetPartners.useQuery();
    const { data: allDeliveries, refetch: refetchDeliveries } = trpc.delivery.adminGetAllDeliveries.useQuery();
    const { data: warehouses } = trpc.delivery.getWarehouses.useQuery();
    const { data: allOrders } = trpc.order.list.useQuery();
    const { data: availablePartners } = trpc.delivery.getAvailablePartners.useQuery();

    const assignMutation = trpc.delivery.adminAssignDelivery.useMutation();
    const assignNextLegMutation = trpc.delivery.adminAssignNextLeg.useMutation();
    const approveArrivalMutation = trpc.delivery.adminApproveArrival.useMutation();

    const handleAssign = async (orderId: number, partnerId: number) => {
        await assignMutation.mutateAsync({ orderId, deliveryPartnerId: partnerId });
        refetchDeliveries();
    };

    const handleAssignNextLeg = async (deliveryId: number, partnerId: number) => {
        await assignNextLegMutation.mutateAsync({ deliveryId, deliveryPartnerId: partnerId });
        refetchDeliveries();
    };

    const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: "overview",    label: "Overview",   icon: Package },
        { key: "partners",    label: "Partners",   icon: Users },
        { key: "deliveries",  label: "Deliveries", icon: Truck },
        { key: "warehouses",  label: "Warehouses", icon: Warehouse },
    ];

    return (
        <div className="min-h-screen bg-[#F1F8E9] p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1B1B1B] flex items-center gap-2">
                            <Truck className="w-6 h-6 text-[#01579B]" /> Delivery Management
                        </h1>
                        <p className="text-sm text-[#5F6368] mt-1">Manage delivery partners, assignments & warehouses</p>
                    </div>
                    <button
                        onClick={() => setShowAssign(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#01579B] to-[#0277BD] text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                        <Truck className="w-4 h-4" />
                        Assign Delivery
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-[#E0E0E0] w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.key
                                    ? "bg-[#01579B] text-white shadow-md"
                                    : "text-[#5F6368] hover:text-[#01579B]"
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Overview ── */}
                {activeTab === "overview" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "Total Partners", value: stats?.totalPartners ?? 0, icon: Users, color: "#01579B", bg: "#E3F2FD" },
                                { label: "Online Now", value: stats?.availablePartners ?? 0, icon: Wifi, color: "#2E7D32", bg: "#E8F5E9" },
                                { label: "Total Deliveries", value: stats?.totalDeliveries ?? 0, icon: Package, color: "#E65100", bg: "#FFF3E0" },
                                { label: "Completed", value: stats?.completedDeliveries ?? 0, icon: CheckCircle2, color: "#1B5E20", bg: "#C8E6C9" },
                            ].map((s) => (
                                <motion.div
                                    key={s.label}
                                    whileHover={{ y: -2 }}
                                    className="bg-white rounded-xl p-5 shadow-sm border border-[#E0E0E0]"
                                >
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: s.bg }}>
                                        <s.icon className="w-5 h-5" style={{ color: s.color }} />
                                    </div>
                                    <p className="text-2xl font-bold text-[#1B1B1B]">{s.value}</p>
                                    <p className="text-sm text-[#5F6368] mt-0.5">{s.label}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Auto-chaining removes the need for manual next-leg assignment */}

                        {/* Chain delivery explanation */}
                        <div className="bg-gradient-to-r from-[#01579B] to-[#0277BD] rounded-2xl p-6 text-white">
                            <h3 className="font-bold text-lg mb-2">🔗 Smart Chain Delivery System</h3>
                            <p className="text-white/80 text-sm leading-relaxed">
                                KrishiSetu automatically plans delivery routes. For orders within <strong>200km</strong>, a single partner handles the full journey. 
                                For longer distances, the system creates a <strong>relay chain</strong> through the nearest warehouses — 
                                each leg is handled by a different local partner, maximizing efficiency.
                            </p>
                            <div className="flex items-center gap-2 mt-4 text-sm">
                                <span className="bg-white/20 px-3 py-1 rounded-full">Farm</span>
                                <ArrowRight className="w-4 h-4" />
                                <span className="bg-white/20 px-3 py-1 rounded-full">Warehouse A</span>
                                <ArrowRight className="w-4 h-4" />
                                <span className="bg-white/20 px-3 py-1 rounded-full">Warehouse B</span>
                                <ArrowRight className="w-4 h-4" />
                                <span className="bg-white/20 px-3 py-1 rounded-full">Customer</span>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Partners ── */}
                {activeTab === "partners" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#F0F0F0]">
                                <h3 className="font-semibold text-[#1B1B1B]">All Delivery Partners ({partners?.length || 0})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-[#9E9E9E] uppercase bg-[#F8F9FA]">
                                            <th className="px-5 py-3 text-left font-medium">Partner</th>
                                            <th className="px-5 py-3 text-left font-medium">Vehicle</th>
                                            <th className="px-5 py-3 text-left font-medium">Status</th>
                                            <th className="px-5 py-3 text-left font-medium">Rating</th>
                                            <th className="px-5 py-3 text-left font-medium">Deliveries</th>
                                            <th className="px-5 py-3 text-left font-medium">Earnings</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {partners?.map((p) => (
                                            <tr key={p.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-[#E3F2FD] flex items-center justify-center text-sm font-bold text-[#01579B]">
                                                            {p.name?.[0] || "D"}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm text-[#1B1B1B]">{p.name}</p>
                                                            <p className="text-xs text-[#9E9E9E]">{p.phone}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-sm capitalize text-[#5F6368]">{p.vehicleType}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${
                                                        p.isAvailable ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#F5F5F5] text-[#9E9E9E]"
                                                    }`}>
                                                        {p.isAvailable ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                                                        {p.isAvailable ? "Online" : "Offline"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 text-[#F9A825] fill-[#F9A825]" />
                                                        <span className="text-sm font-semibold">
                                                            {(p.avgRating || 0) > 0 ? (p.avgRating as number).toFixed(1) : "—"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm font-medium text-[#1B1B1B]">
                                                    {p.totalDeliveries}
                                                </td>
                                                <td className="px-5 py-4 text-sm font-semibold text-[#1B5E20]">
                                                    ₹{(p.totalEarnings || 0).toLocaleString("en-IN")}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Deliveries ── */}
                {activeTab === "deliveries" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] overflow-hidden">
                            <div className="px-6 py-4 border-b border-[#F0F0F0]">
                                <h3 className="font-semibold text-[#1B1B1B]">All Delivery Legs ({allDeliveries?.length || 0})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-xs text-[#9E9E9E] uppercase bg-[#F8F9FA]">
                                            <th className="px-5 py-3 text-left font-medium">Order</th>
                                            <th className="px-5 py-3 text-left font-medium">Leg</th>
                                            <th className="px-5 py-3 text-left font-medium">Partner</th>
                                            <th className="px-5 py-3 text-left font-medium">Route</th>
                                            <th className="px-5 py-3 text-left font-medium">Status</th>
                                            <th className="px-5 py-3 text-left font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allDeliveries?.map((d) => {
                                            const cfg = statusConfig[d.status] || statusConfig.pending;
                                            const needsNextLeg =
                                                d.status === "at_warehouse" &&
                                                d.legIndex < d.totalLegs;
                                            return (
                                                <tr key={d.id} className="border-b border-[#F5F5F5] hover:bg-[#FAFAFA]">
                                                    <td className="px-5 py-4">
                                                        <span className="font-mono text-sm font-bold text-[#01579B]">{d.orderNumber}</span>
                                                        <p className="text-xs text-[#9E9E9E]">{d.cropName}</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                            d.totalLegs > 1 ? "bg-purple-100 text-purple-700" : "bg-[#F0F4FA] text-[#5F6368]"
                                                        }`}>
                                                            {d.legIndex}/{d.totalLegs}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-sm text-[#1B1B1B]">{d.partnerName || "—"}</p>
                                                        <p className="text-xs text-[#9E9E9E]">{d.partnerPhone || ""}</p>
                                                        {needsNextLeg && (
                                                            <button
                                                                onClick={() => setAssigningLegId(d.id)}
                                                                className="mt-1 text-[10px] bg-[#E3F2FD] text-[#01579B] px-2 py-0.5 rounded-full hover:bg-[#BBDEFB] transition-colors"
                                                            >
                                                                + Assign next leg
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="text-xs text-[#5F6368] truncate max-w-[150px]">{d.pickupAddress}</p>
                                                        <p className="text-xs text-[#9E9E9E]">→ {d.deliveryAddress?.slice(0, 30)}...</p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                                                            {cfg.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-xs text-[#9E9E9E]">
                                                        {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Warehouses ── */}
                {activeTab === "warehouses" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {warehouses?.map((wh) => (
                                <div key={wh.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E0E0E0]">
                                    <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg mb-3">🏭</div>
                                    <p className="font-semibold text-sm text-[#1B1B1B]">{wh.city}</p>
                                    <p className="text-xs text-[#9E9E9E]">{wh.name}</p>
                                    <p className="text-xs text-[#9E9E9E] mt-1">{wh.capacity?.toLocaleString()} kg capacity</p>
                                    <span className={`mt-2 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        wh.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    }`}>
                                        {wh.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {warehouses && (
                            <div className="mt-6">
                                <h2 className="text-lg font-bold text-[#0D1B2A] mb-4">Network Map</h2>
                                <LiveDeliveryMap warehouses={warehouses} deliveries={allDeliveries || []} />
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Assign Modal */}
            <AnimatePresence>
                {showAssign && (
                    <AssignModal
                        orders={allOrders?.filter((o) => o.status === "pending") || []}
                        partners={availablePartners || []}
                        onClose={() => setShowAssign(false)}
                        onAssign={handleAssign}
                    />
                )}
                {assigningLegId !== null && (
                    <AssignLegModal
                        deliveryId={assigningLegId}
                        partners={availablePartners || []}
                        onClose={() => setAssigningLegId(null)}
                        onAssign={handleAssignNextLeg}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
