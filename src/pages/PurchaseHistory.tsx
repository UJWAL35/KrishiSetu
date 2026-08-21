import { useState, useMemo } from "react";
import type { ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    ArrowLeft,
    Star,
    Truck,
    Zap,
    MapPin,
    RotateCcw,
    Leaf,
    Calendar,
    MessageSquarePlus,
    CheckCircle2,
    ThumbsUp,
    KeyRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useCart } from "@/context/CartContext";
import type { PurchaseRecord, CartItem } from "@/context/CartContext";
import ReviewModal from "@/components/shared/ReviewModal";
import StarRating from "@/components/shared/StarRating";
import { useLanguage } from "@/context/LanguageContext";
import { trpc } from "@/providers/trpc";
import LiveDeliveryMap from "@/components/shared/LiveDeliveryMap";

const deliveryIcons: Record<string, ElementType> = {
    express: Zap,
    standard: Truck,
    pickup: MapPin,
};

const SESSION_ID = (() => {
    const existing = localStorage.getItem("sf_session_id");
    if (existing) return existing;
    const id = Math.random().toString(36).slice(2);
    localStorage.setItem("sf_session_id", id);
    return id;
})();

function groupByDate(records: PurchaseRecord[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { label: string; items: PurchaseRecord[] }[] = [];
    const todayItems = records.filter((r) => new Date(r.date) >= today);
    const yesterdayItems = records.filter((r) => {
        const d = new Date(r.date);
        return d >= yesterday && d < today;
    });
    const earlierItems = records.filter((r) => new Date(r.date) < yesterday);

    return [
        ...(todayItems.length ? [{ label: "today", items: todayItems }] : []),
        ...(yesterdayItems.length ? [{ label: "yesterday", items: yesterdayItems }] : []),
        ...(earlierItems.length ? [{ label: "earlier", items: earlierItems }] : []),
    ];
}

// ── OTP Banner Component ────────────────────────────────
function OtpBanner({ orderId }: { orderId: number }) {
    const { data: otpData } = trpc.delivery.getOrderOTP.useQuery(
        { orderId },
        { enabled: !!orderId, refetchInterval: 30000 }
    );
    if (!otpData || !otpData.otp || otpData.status === "delivered" || otpData.status === "cancelled") return null;
    
    const isOutForDelivery = otpData.status === "out_for_delivery";
    
    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-200">
            <KeyRound className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
                <p className="text-xs font-semibold text-amber-700">Delivery OTP — Share with your delivery partner</p>
                <p className="font-mono text-2xl font-bold text-amber-800 tracking-[0.2em] mt-0.5">
                    {otpData.otp}
                </p>
            </div>
            <div className="text-[10px] text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                {isOutForDelivery ? "🚚 Out for Delivery" : "📦 Preparing Delivery"}
            </div>
        </div>
    );
}

function OrderTrackingMap({ orderId }: { orderId: number }) {
    const { data: deliveries } = trpc.delivery.getOrderTracking.useQuery({ orderId });
    if (!deliveries || deliveries.length === 0) return null;
    return (
        <div className="p-4 border-b border-[#F1F8E9]">
            <p className="text-xs font-semibold text-[#5F6368] mb-2 uppercase tracking-wide">Live Tracking</p>
            <div className="w-full h-[250px] rounded-xl overflow-hidden shadow-sm">
                <LiveDeliveryMap deliveries={deliveries} />
            </div>
        </div>
    );
}

export default function PurchaseHistory() {

    const navigate = useNavigate();
    const { addToCart, addReview, hasReviewedOrder, markHelpful, reviews } = useCart();
    const { t } = useLanguage();

    // Fetch orders for the logged-in user (auth token handled via cookie)
    const { data: dbOrders } = trpc.order.myOrders.useQuery();
    const submitReviewMutation = trpc.farmer.submitReview.useMutation();

    const purchaseHistory = useMemo(() => {
        if (!dbOrders) return [];
        
        // Group by orderNumber
        const grouped = dbOrders.reduce((acc: Record<string, any>, order: any) => {
            if (!acc[order.orderNumber]) {
                acc[order.orderNumber] = {
                    id: order.id.toString(),
                    orderNumber: order.orderNumber,
                    date: order.createdAt,
                    deliveryType: order.deliveryType,
                    deliveryFee: parseFloat(order.deliveryFee || "0"),
                    platformFee: 5,
                    total: 0,
                    items: [] as any[],
                };
            }
            
            const qty = parseFloat(order.quantity);
            const unitPrice = parseFloat(order.unitPrice);
            acc[order.orderNumber].total += qty * unitPrice;
            acc[order.orderNumber].items.push({
                cropId: order.cropId || 0,
                name: order.cropName || "Crop",
                variety: "",
                image: order.cropImage || "/crop-1.jpg",
                price: unitPrice,
                unit: order.unit || "kg",
                farmerName: order.farmerName || "Farmer",
                farmerAvatar: "/farmer-1.jpg",
                farmerId: order.farmerId || 0,
                farmName: order.farmName || "Farm",
                farmId: 0,
                isOrganic: false,
                quantity: qty,
            });
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [dbOrders]);

    const [reviewModal, setReviewModal] = useState<{ item: CartItem; order: PurchaseRecord } | null>(null);
    const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
    const [ratedDeliveries, setRatedDeliveries] = useState<Set<string>>(new Set());

    const purchaseGroups = groupByDate(purchaseHistory as PurchaseRecord[]);

    const handleReorder = (record: PurchaseRecord) => {
        record.items.forEach((item) => addToCart(item));
        navigate("/marketplace");
    };

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const toggleReviews = (orderId: string) => {
        setExpandedReviews((prev) => {
            const next = new Set(prev);
            if (next.has(orderId)) next.delete(orderId);
            else next.add(orderId);
            return next;
        });
    };

    const deliveryLabels: Record<string, string> = {
        express: t("expressDelivery"),
        standard: t("standardDelivery"),
        pickup: t("selfPickup"),
    };

    const groupLabels: Record<string, string> = {
        today: t("today"),
        yesterday: t("yesterday"),
        earlier: t("earlier"),
    };

    return (
        <div className="min-h-screen bg-[#F1F8E9]">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-[#C8E6C9]">
                <div className="flex items-center h-14 px-4 gap-3 max-w-3xl mx-auto">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate("/marketplace")}
                        className="w-10 h-10 rounded-full bg-[#F1F8E9] flex items-center justify-center hover:bg-[#E8F5E9] transition-colors ripple-btn"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1B1B1B]" />
                    </motion.button>
                    <div>
                        <h1 className="text-base font-semibold text-[#1B1B1B]">{t("myOrdersTitle")}</h1>
                        <p className="text-xs text-[#9E9E9E]">
                            {t("ordersPlaced", { n: purchaseHistory.length })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {purchaseHistory.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center text-center py-24"
                    >
                        <div className="w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-4">
                            <ShoppingBag className="w-12 h-12 text-[#C8E6C9]" />
                        </div>
                        <h2 className="text-xl font-bold text-[#1B1B1B]">{t("noOrdersYet")}</h2>
                        <p className="text-sm text-[#9E9E9E] mt-1 max-w-xs">
                            Start shopping from the marketplace and your order history will appear here.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => navigate("/marketplace")}
                            className="mt-6 px-6 py-3 bg-[#1B5E20] text-white rounded-xl font-medium hover:bg-[#2E7D32] transition-colors ripple-btn"
                        >
                            {t("browseMarketplace")}
                        </motion.button>
                    </motion.div>
                ) : (
                    purchaseGroups.map((group) => (
                        <div key={group.label}>
                            <div className="flex items-center gap-2 mb-3">
                                <Calendar className="w-4 h-4 text-[#5F6368]" />
                                <h2 className="text-sm font-semibold text-[#5F6368] uppercase tracking-wide">
                                    {groupLabels[group.label] ?? group.label}
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {group.items.map((record, idx) => {
                                    const DeliveryIcon = deliveryIcons[record.deliveryType] || Truck;
                                    const showReviews = expandedReviews.has(record.id);
                                    const orderReviews = reviews.filter((r) =>
                                        record.items.some((item) => item.cropId === r.cropId && r.orderId === record.id)
                                    );

                                    return (
                                        <motion.div
                                            key={record.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.06 }}
                                            className="bg-white rounded-xl shadow-md overflow-hidden"
                                        >
                                            {/* Order Header */}
                                            <div className="flex items-center justify-between px-4 py-3 bg-[#F1F8E9] border-b border-[#C8E6C9]">
                                                <div>
                                                    <span className="font-mono text-sm font-bold text-[#1B5E20]">#{record.orderNumber}</span>
                                                    <p className="text-xs text-[#9E9E9E]">{formatDate(record.date)}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1 text-xs text-[#5F6368]">
                                                        <DeliveryIcon className="w-3.5 h-3.5" />
                                                        {deliveryLabels[record.deliveryType]}
                                                    </div>
                                                    <span className="text-base font-bold text-[#1B5E20]">₹{record.total}</span>
                                                </div>
                                            </div>

                                            {/* OTP Banner */}
                                            <OtpBanner orderId={Number(record.id)} />
                                            <OrderTrackingMap orderId={Number(record.id)} />

                                            <div className="divide-y divide-[#F1F8E9]">
                                                {record.items.map((item) => {
                                                    const alreadyReviewed = hasReviewedOrder(record.id, item.cropId);
                                                    const itemReview = reviews.find(
                                                        (r) => r.orderId === record.id && r.cropId === item.cropId
                                                    );

                                                    return (
                                                        <div key={item.cropId} className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                {item.image ? (
                                                                    <motion.img
                                                                        whileHover={{ scale: 1.05 }}
                                                                        src={item.image}
                                                                        alt={item.name}
                                                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-lg bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                                                                        <span className="text-xl">🌿</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <p className="font-semibold text-sm text-[#1B1B1B]">{item.name}</p>
                                                                        {item.isOrganic && (
                                                                            <span className="flex items-center gap-0.5 text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.5 rounded-full">
                                                                                <Leaf className="w-2.5 h-2.5" /> Organic
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                                        <img src={item.farmerAvatar} alt={item.farmerName} className="w-4 h-4 rounded-full object-cover" />
                                                                        <p className="text-xs text-[#9E9E9E]">{item.farmerName}</p>
                                                                        {itemReview && (
                                                                            <>
                                                                                <span className="text-[#C8E6C9]">·</span>
                                                                                <StarRating value={itemReview.rating} size="sm" />
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-[#5F6368] mt-0.5">
                                                                        {item.quantity} {item.unit} × ₹{item.price}/{t("perKg")}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1.5">
                                                                    <p className="text-sm font-bold text-[#1B5E20]">₹{item.price * item.quantity}</p>
                                                                    {/* Rate & Review button */}
                                                                    {alreadyReviewed ? (
                                                                        <span className="flex items-center gap-1 text-[10px] text-[#2E7D32] bg-[#E8F5E9] px-2 py-1 rounded-full font-medium">
                                                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                                                            {t("alreadyReviewed")}
                                                                        </span>
                                                                    ) : (
                                                                        <motion.button
                                                                            whileHover={{ scale: 1.05 }}
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={() => setReviewModal({ item, order: record })}
                                                                            className="flex items-center gap-1 text-[10px] text-[#F9A825] bg-[#FFF8E1] border border-[#F9A825]/30 px-2 py-1 rounded-full font-semibold hover:bg-[#FFF3CD] transition-colors glow-pulse"
                                                                        >
                                                                            <Star className="w-2.5 h-2.5 fill-[#F9A825]" />
                                                                            {t("rateAndReview")}
                                                                        </motion.button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F8E9] bg-[#FAFAFA]">
                                                <div className="text-xs text-[#9E9E9E] space-y-0.5">
                                                    <p>{t("deliveryFee")}: {record.deliveryFee === 0 ? t("free") : `₹${record.deliveryFee}`} · {t("platformFee")}: ₹{record.platformFee}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {orderReviews.length > 0 && (
                                                        <motion.button
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => toggleReviews(record.id)}
                                                            className="flex items-center gap-1 text-xs text-[#5F6368] hover:text-[#1B1B1B] transition-colors"
                                                        >
                                                            <MessageSquarePlus className="w-3.5 h-3.5" />
                                                            {showReviews ? "Hide" : `${orderReviews.length} review${orderReviews.length > 1 ? "s" : ""}`}
                                                        </motion.button>
                                                    )}
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleReorder(record)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5E9] text-[#1B5E20] rounded-full text-xs font-semibold hover:bg-[#C8E6C9] transition-colors ripple-btn"
                                                    >
                                                        <RotateCcw className="w-3 h-3" />
                                                        {t("reorder")}
                                                    </motion.button>
                                                </div>
                                            </div>

                                            {/* Expanded Reviews */}
                                            <AnimatePresence>
                                                {showReviews && orderReviews.length > 0 && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="border-t border-[#F1F8E9] px-4 py-3 space-y-3 bg-[#FAFFFE]">
                                                            <p className="text-xs font-semibold text-[#5F6368] uppercase tracking-wide">{t("recentReviews")}</p>
                                                            {orderReviews.map((review) => {
                                                                const alreadyMarked = review.markedHelpfulBy.includes(SESSION_ID);
                                                                return (
                                                                    <motion.div
                                                                        key={review.id}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        className="bg-white rounded-xl p-3 border border-[#E8F5E9]"
                                                                    >
                                                                        <div className="flex items-center gap-2 mb-1.5">
                                                                            <StarRating value={review.rating} size="sm" />
                                                                            <span className="text-[10px] text-[#9E9E9E]">
                                                                                {new Date(review.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                                            </span>
                                                                        </div>
                                                                        {review.comment && (
                                                                            <p className="text-xs text-[#5F6368] leading-relaxed mb-2">"{review.comment}"</p>
                                                                        )}
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.9 }}
                                                                            onClick={() => !alreadyMarked && markHelpful(review.id, SESSION_ID)}
                                                                            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full transition-colors ${
                                                                                alreadyMarked
                                                                                    ? "bg-[#E8F5E9] text-[#2E7D32]"
                                                                                    : "bg-[#F5F5F5] text-[#9E9E9E] hover:bg-[#EEEEEE]"
                                                                            }`}
                                                                        >
                                                                            <ThumbsUp className="w-2.5 h-2.5" />
                                                                            {alreadyMarked ? t("markedHelpful") : t("helpful")}
                                                                            {review.helpful > 0 && ` (${review.helpful})`}
                                                                        </motion.button>
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Review Modal */}
            {reviewModal && (
                <ReviewModal
                    item={reviewModal.item}
                    order={reviewModal.order}
                    onClose={() => setReviewModal(null)}
                    onSubmit={async (rating, comment) => {
                        addReview({
                            cropId: reviewModal.item.cropId,
                            cropName: reviewModal.item.name,
                            cropImage: reviewModal.item.image,
                            farmerName: reviewModal.item.farmerName,
                            orderId: reviewModal.order.id,
                            orderNumber: reviewModal.order.orderNumber,
                            rating,
                            comment,
                        });
                        try {
                            await submitReviewMutation.mutateAsync({
                                farmerId: reviewModal.item.farmerId,
                                rating,
                                comment,
                            });
                        } catch (e) {
                            console.error("Failed to submit review", e);
                        }
                        setReviewModal(null);
                    }}
                />
            )}
        </div>
    );
}
