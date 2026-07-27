import { useState } from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Star,
    Clock,
    Zap,
    Truck,
    MapPin,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { useParams, useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";

const quantityOptions = [
    { label: "500g", price: 22 },
    { label: "1kg", price: 45 },
    { label: "2kg", price: 85 },
    { label: "5kg", price: 210 },
];

const deliveryOptions = [
    { id: "express", label: "Express", time: "25-30 min", price: 30, icon: Zap },
    { id: "standard", label: "Standard", time: "2-3 hours", price: 15, icon: Truck },
    { id: "pickup", label: "Self Pickup", time: "From farm", price: 0, icon: MapPin },
];

export default function OrderingPage() {
    const { cropId } = useParams<{ cropId: string }>();
    const navigate = useNavigate();
    const [selectedQuantity, setSelectedQuantity] = useState(1); // 1kg default
    const [selectedDelivery, setSelectedDelivery] = useState("express");
    const [isPlacing, setIsPlacing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { data: crop, isLoading: isCropLoading } = trpc.crop.getById.useQuery({ id: Number(cropId) || 1 });
    const createOrder = trpc.order.createSimple.useMutation();

    const quantity = quantityOptions[selectedQuantity];
    const delivery = deliveryOptions.find((d) => d.id === selectedDelivery)!;

    const itemTotal = quantity.price;
    const deliveryFee = delivery.price;
    const platformFee = 5;
    const total = itemTotal + deliveryFee + platformFee;

    const handlePlaceOrder = async () => {
        setErrorMessage(null);

        if (isCropLoading) {
            setErrorMessage("Still loading product details, please wait a moment.");
            return;
        }

        if (!crop) {
            setErrorMessage("We couldn't find this product. Please go back and try again.");
            return;
        }

        setIsPlacing(true);
        try {
            // Get the logged-in user id from localStorage, default to 1
            let currentUserId = 1;
            try {
                const storedId = localStorage.getItem("sf_user_id");
                if (storedId) currentUserId = parseInt(storedId, 10) || 1;
            } catch { /* ignore */ }

            const kgAmount = parseFloat((quantity.price / 45).toFixed(2)) || 1;

            const result = await createOrder.mutateAsync({
                userId: currentUserId,
                farmerId: crop.farmerId,
                cropId: crop.id,
                quantity: kgAmount,
                unitPrice: quantity.price,
                deliveryFee: deliveryFee,
                totalAmount: total,
                deliveryType: selectedDelivery as "express" | "standard" | "pickup",
                address: "123 SmartFarm St, Pune",
            });

            // Use the real orderNumber returned by the backend.
            // Fall back to a locally generated unique id so the UI never shows a blank order number.
            const generatedFallbackId = `KS-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
            const finalOrderId =
                (result as any)?.orderNumber ??
                (result as any)?.id ??
                (result as any)?.orderId ??
                generatedFallbackId;

            setOrderId(finalOrderId);
            setIsSuccess(true);

            setTimeout(() => {
                navigate("/marketplace");
            }, 2500);
        } catch (error) {
            console.error("Order failed", error);
            setErrorMessage("Something went wrong placing your order. Please try again.");
        } finally {
            setIsPlacing(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#1B5E20] flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    className="text-center text-white"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                    >
                        <CheckCircle2 className="w-24 h-24 mx-auto mb-4" />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-3xl font-bold mb-2"
                    >
                        Order Placed!
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-white/70 font-mono"
                    >
                        Order #{orderId}
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="text-white/60 mt-4 text-sm"
                    >
                        Redirecting to marketplace...
                    </motion.p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F8E9] slide-in-right">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white shadow-sm border-b border-[#C8E6C9]">
                <div className="flex items-center h-14 px-4 gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-[#F1F8E9] flex items-center justify-center hover:bg-[#E8F5E9] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#1B1B1B]" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-base font-semibold text-[#1B1B1B]">
                            {crop?.name || "Fresh Corn"}
                        </h1>
                        <p className="text-xs text-[#5F6368]">
                            {crop?.farmerName || "Rajesh Farms"} • {crop?.distance || 2.3}km
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto pb-24">
                {/* Product Hero */}
                <div className="bg-gradient-to-b from-[#E8F5E9] to-[#F1F8E9] p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative w-56 h-56 mx-auto"
                    >
                        {crop?.image ? (
                            <img
                                src={crop.image}
                                alt={crop.name || "Crop"}
                                className="w-full h-full object-cover rounded-2xl shadow-xl float-animation"
                            />
                        ) : (
                            <div className="w-full h-full bg-[#E8F5E9] rounded-2xl shadow-xl float-animation flex items-center justify-center">
                                <span className="text-6xl">🌿</span>
                            </div>
                        )}
                        <span className="absolute -bottom-2 -right-2 bg-[#2E7D32] text-white text-xs font-medium px-3 py-1 rounded-full">
                            Fresh Harvest
                        </span>
                    </motion.div>

                    <div className="text-center mt-4">
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl font-bold text-[#1B5E20]">₹{quantity.price}</span>
                            <span className="text-lg text-[#9E9E9E] line-through">₹{Math.round(quantity.price * 1.25)}</span>
                            <span className="text-sm text-[#2E7D32] font-medium">25% off</span>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-2 text-sm text-[#5F6368]">
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-[#F9A825] fill-[#F9A825]" />
                                <span className="font-medium">{crop?.rating || 4.8}</span>
                                <span>({crop ? 128 : 128} reviews)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-[#00BCD4]" />
                                <span>Delivery in 25-30 min</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 space-y-4">
                    {/* Quantity Selector */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl p-4 shadow-md"
                    >
                        <h3 className="text-sm font-semibold text-[#1B1B1B] mb-3">Select Quantity</h3>
                        <div className="flex flex-wrap gap-2">
                            {quantityOptions.map((opt, idx) => (
                                <motion.button
                                    key={opt.label}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.1 * idx, type: "spring" }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedQuantity(idx)}
                                    className={`flex-1 min-w-[70px] py-3 px-2 rounded-xl text-center text-sm font-medium border-2 transition-all ${selectedQuantity === idx
                                        ? "border-[#1B5E20] bg-[#E8F5E9] text-[#1B5E20]"
                                        : "border-[#C8E6C9] text-[#5F6368] hover:border-[#4CAF50]"
                                        }`}
                                >
                                    {opt.label === "500g" && <span className="text-xs">500g</span>}
                                    {opt.label === "1kg" && <span className="text-xs">1kg</span>}
                                    {opt.label === "2kg" && <span className="text-xs">2kg</span>}
                                    {opt.label === "5kg" && <span className="text-xs">5kg</span>}
                                    <span className="block text-xs mt-0.5">₹{opt.price}</span>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Delivery Options */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl p-4 shadow-md"
                    >
                        <h3 className="text-sm font-semibold text-[#1B1B1B] mb-3">Delivery Option</h3>
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
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? "bg-[#1B5E20] text-white" : "bg-[#F1F8E9] text-[#5F6368]"
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-sm font-medium ${isSelected ? "text-[#1B5E20]" : "text-[#1B1B1B]"}`}>
                                                    {opt.label}
                                                </span>
                                                <span className="text-sm font-semibold">₹{opt.price}</span>
                                            </div>
                                            <span className="text-xs text-[#5F6368]">{opt.time}</span>
                                        </div>
                                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[#1B5E20]" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Price Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-xl p-4 shadow-md"
                    >
                        <h3 className="text-sm font-semibold text-[#1B1B1B] mb-3">Bill Summary</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-[#5F6368]">
                                <span>Item Total ({quantity.label})</span>
                                <span>₹{itemTotal}</span>
                            </div>
                            <div className="flex justify-between text-[#5F6368]">
                                <span>Delivery Fee</span>
                                <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
                            </div>
                            <div className="flex justify-between text-[#5F6368]">
                                <span>Platform Fee</span>
                                <span>₹{platformFee}</span>
                            </div>
                            <div className="flex justify-between text-[#2E7D32] text-xs">
                                <span>Discount</span>
                                <span>-₹{Math.round(quantity.price * 0.15)}</span>
                            </div>
                            <div className="border-t border-dashed border-[#C8E6C9] pt-2 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-[#1B1B1B]">To Pay</span>
                                    <span className="text-2xl font-bold text-[#1B5E20]">₹{total}</span>
                                </div>
                            </div>
                            <p className="text-xs text-[#2E7D32]">You save ₹{Math.round(quantity.price * 0.15)}</p>
                        </div>
                    </motion.div>

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
            </div>

            {/* Sticky Place Order Button */}
            <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.1)] p-4 z-50">
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
                            Placing Order...
                        </>
                    ) : (
                        <>
                            <span>Place Order</span>
                            <span className="text-white/70">•</span>
                            <span>₹{total}</span>
                            <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
}
