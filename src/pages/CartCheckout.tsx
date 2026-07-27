import { useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Zap,
    Truck,
    MapPin,
    CheckCircle2,
    ShoppingBag,
    Leaf,
    AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { trpc } from "@/providers/trpc";

export default function CartCheckout() {
    const navigate = useNavigate();
    const { cartItems, cartTotal, clearCart, savePurchase } = useCart();
    const { t } = useLanguage();
    const [selectedDelivery, setSelectedDelivery] = useState("express");
    const [isPlacing, setIsPlacing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const createOrder = trpc.order.createSimple.useMutation();

    const deliveryOptions = [
        { id: "express", label: t("expressDelivery"), time: "25-30 min", price: 30, icon: Zap },
        { id: "standard", label: t("standardDelivery"), time: "2-3 hours", price: 15, icon: Truck },
        { id: "pickup", label: t("selfPickup"), time: "From farm", price: 0, icon: MapPin },
    ];

    const delivery = deliveryOptions.find((d) => d.id === selectedDelivery)!;
    const platformFee = 5;
    const total = cartTotal + delivery.price + platformFee;

    // Generates a readable, always-unique fallback id, used only if the
    // backend response doesn't include a usable order number/id.
    const generateFallbackOrderNumber = () =>
        `SF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

    const handlePlaceOrder = async () => {
        if (isPlacing) return;
        if (cartItems.length === 0) {
            setErrorMessage(t("cartEmpty"));
            return;
        }

        setErrorMessage(null);
        setIsPlacing(true);
        try {
            let lastOrderNum = "";

            // Get the logged-in user id from localStorage if available, else default to 1
            let currentUserId = 1;
            try {
                const storedId = localStorage.getItem("sf_user_id");
                if (storedId) currentUserId = parseInt(storedId, 10) || 1;
            } catch { /* ignore */ }

            for (const item of cartItems) {
                const result = await createOrder.mutateAsync({
                    userId: currentUserId,
                    farmerId: item.farmerId,
                    cropId: item.cropId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    deliveryFee: delivery.price / cartItems.length, // distribute fee
                    totalAmount: (item.price * item.quantity) + (delivery.price / cartItems.length) + (platformFee / cartItems.length),
                    deliveryType: selectedDelivery as "express" | "standard" | "pickup",
                    address: "123 SmartFarm St, Pune",
                });

                // Be defensive about the shape of the mutation response —
                // different backends may return orderNumber, id, or orderId.
                const returnedNumber =
                    (result as any)?.orderNumber ??
                    (result as any)?.id ??
                    (result as any)?.orderId;

                if (returnedNumber) {
                    lastOrderNum = String(returnedNumber);
                }
            }

            // Never show a blank order number — fall back to a generated one.
            setOrderNumber(lastOrderNum || generateFallbackOrderNumber());
            clearCart();
            setIsSuccess(true);
            setTimeout(() => navigate("/orders"), 2800);
        } catch (error) {
            console.error("Order failed", error);
            setErrorMessage(t("orderFailed") || "Something went wrong placing your order. Please try again.");
        } finally {
            setIsPlacing(false);
        }
    };

    if (cartItems.length === 0 && !isSuccess) {
        return (
            <div className="min-h-screen bg-[#F1F8E9] flex flex-col items-center justify-center text-center px-4">
                <ShoppingBag className="w-16 h-16 text-[#C8E6C9] mb-4" />
                <h2 className="text-xl font-bold text-[#1B1B1B]">{t("cartEmpty")}</h2>
                <p className="text-sm text-[#9E9E9E] mt-1">{t("addItemsFirst")}</p>
                <button
                    onClick={() => navigate("/marketplace")}
                    className="mt-6 px-6 py-3 bg-[#1B5E20] text-white rounded-xl font-medium hover:bg-[#2E7D32] transition-colors"
                >
                    {t("goToMarketplace")}
                </button>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#1B5E20] to-[#0D3B10] flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="text-center text-white px-6"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <CheckCircle2 className="w-14 h-14 text-[#81C784]" />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl font-bold mb-2"
                    >
                        {t("orderPlacedEmoji")}
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-white/70 font-mono text-lg"
                    >
                        Order #{orderNumber}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-white/60 mt-2 text-sm"
                    >
                        ₹{total} • {cartItems.length} item{cartItems.length > 1 ? "s" : ""}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-white/40 mt-4 text-xs"
                    >
                        {t("redirecting")}
                    </motion.p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F8E9]">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-[#C8E6C9]">
                <div className="flex items-center h-14 px-4 gap-3 max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-[#F1F8E9] flex items-center justify-center hover:bg-[#E8F5E9] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1B1B1B]" />
                    </button>
                    <div>
                        <h1 className="text-base font-semibold text-[#1B1B1B]">{t("proceedToCheckout")}</h1>
                        <p className="text-xs text-[#9E9E9E]">{cartItems.length} {t("itemsInCart")}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-4">
                {/* Cart Items Summary */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-4 py-3 bg-[#F1F8E9] border-b border-[#C8E6C9]">
                        <h2 className="text-sm font-semibold text-[#1B1B1B]">{t("orderSummary")}</h2>
                    </div>
                    <div className="divide-y divide-[#F1F8E9]">
                        {cartItems.map((item) => (
                            <motion.div
                                key={item.cropId}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-3 p-4"
                            >
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-semibold text-sm text-[#1B1B1B]">{item.name}</p>
                                        {item.isOrganic && (
                                            <span className="flex items-center gap-0.5 text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.5 rounded-full">
                                                <Leaf className="w-2.5 h-2.5" /> {t("organic")}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[#9E9E9E]">{item.farmerName} · {item.farmName}</p>
                                    <p className="text-xs text-[#5F6368] mt-0.5">
                                        {item.quantity} {item.unit} × ₹{item.price}
                                    </p>
                                </div>
                                <p className="font-bold text-[#1B5E20] text-sm">₹{item.price * item.quantity}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Delivery Options */}
                <div className="bg-white rounded-xl shadow-md p-4">
                    <h2 className="text-sm font-semibold text-[#1B1B1B] mb-3">{t("deliveryOption")}</h2>
                    <div className="space-y-2">
                        {deliveryOptions.map((opt) => {
                            const Icon = opt.icon;
                            const isSelected = selectedDelivery === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => setSelectedDelivery(opt.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isSelected
                                        ? "border-[#1B5E20] bg-[#E8F5E9]"
                                        : "border-[#C8E6C9] hover:border-[#4CAF50]"
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-[#1B5E20] text-white" : "bg-[#F1F8E9] text-[#5F6368]"}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-medium ${isSelected ? "text-[#1B5E20]" : "text-[#1B1B1B]"}`}>{opt.label}</span>
                                            <span className="text-sm font-semibold">{opt.price === 0 ? t("free") : `₹${opt.price}`}</span>
                                        </div>
                                        <span className="text-xs text-[#9E9E9E]">{opt.time}</span>
                                    </div>
                                    {isSelected && <CheckCircle2 className="w-5 h-5 text-[#1B5E20] flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-white rounded-xl shadow-md p-4">
                    <h2 className="text-sm font-semibold text-[#1B1B1B] mb-3">{t("billSummary")}</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-[#5F6368]">
                            <span>{t("itemTotal")} ({cartItems.length})</span>
                            <span>₹{cartTotal}</span>
                        </div>
                        <div className="flex justify-between text-[#5F6368]">
                            <span>{t("deliveryFee")}</span>
                            <span>{delivery.price === 0 ? t("free") : `₹${delivery.price}`}</span>
                        </div>
                        <div className="flex justify-between text-[#5F6368]">
                            <span>{t("platformFee")}</span>
                            <span>₹{platformFee}</span>
                        </div>
                        <div className="border-t border-dashed border-[#C8E6C9] pt-2 flex justify-between items-center">
                            <span className="font-bold text-[#1B1B1B]">{t("toPay")}</span>
                            <span className="text-xl font-bold text-[#1B5E20]">₹{total}</span>
                        </div>
                    </div>
                </div>

                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 bg-[#FDECEA] text-[#C62828] rounded-xl p-3 text-sm"
                    >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errorMessage}</span>
                    </motion.div>
                )}
            </div>

            {/* Sticky Place Order */}
            <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.1)] p-4 z-50">
                <div className="max-w-2xl mx-auto">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePlaceOrder}
                        disabled={isPlacing}
                        className="w-full h-14 bg-[#1B5E20] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#2E7D32] transition-colors disabled:opacity-70"
                    >
                        {isPlacing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                {t("placingOrder")}
                            </>
                        ) : (
                            <>
                                <span>{t("placeOrder")}</span>
                                <span className="text-white/60">·</span>
                                <span>₹{total}</span>
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
