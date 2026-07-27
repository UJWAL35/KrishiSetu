import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingCart, Trash2, ChevronRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router";

interface CartPanelProps {
    onClose: () => void;
}

export default function CartPanel({ onClose }: CartPanelProps) {
    const { cartItems, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();
    const navigate = useNavigate();

    const deliveryFee = 30;
    const platformFee = 5;
    const total = cartTotal + deliveryFee + platformFee;

    const handleCheckout = () => {
        onClose();
        navigate("/cart/checkout");
    };

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#C8E6C9] bg-[#F1F8E9]">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-[#1B5E20]" />
                        <h2 className="text-lg font-bold text-[#1B1B1B]">Your Cart</h2>
                        {cartCount > 0 && (
                            <span className="bg-[#1B5E20] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-[#5F6368]" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mb-4">
                                <ShoppingCart className="w-10 h-10 text-[#4CAF50]" />
                            </div>
                            <p className="text-lg font-semibold text-[#1B1B1B]">Cart is empty</p>
                            <p className="text-sm text-[#9E9E9E] mt-1">Add items from the marketplace</p>
                            <button
                                onClick={onClose}
                                className="mt-4 px-6 py-2 bg-[#1B5E20] text-white rounded-full text-sm font-medium hover:bg-[#2E7D32] transition-colors"
                            >
                                Browse Marketplace
                            </button>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <motion.div
                                key={item.cropId}
                                layout
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white border border-[#E8F5E9] rounded-xl p-3 shadow-sm flex gap-3"
                            >
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">🌿</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-sm text-[#1B1B1B] truncate">{item.name}</p>
                                            <p className="text-xs text-[#9E9E9E]">{item.farmerName}</p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.cropId)}
                                            className="p-1 hover:bg-[#FFEBEE] rounded-full transition-colors"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-[#C62828]" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-sm font-bold text-[#1B5E20]">
                                            ₹{(item.price * item.quantity).toLocaleString()}
                                        </p>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => updateQuantity(item.cropId, item.quantity - 1)}
                                                className="w-7 h-7 rounded-full bg-[#F1F8E9] border border-[#C8E6C9] flex items-center justify-center hover:bg-[#E8F5E9] transition-colors"
                                            >
                                                <Minus className="w-3 h-3 text-[#1B5E20]" />
                                            </button>
                                            <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.cropId, item.quantity + 1)}
                                                className="w-7 h-7 rounded-full bg-[#1B5E20] flex items-center justify-center hover:bg-[#2E7D32] transition-colors"
                                            >
                                                <Plus className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[#9E9E9E] mt-0.5">
                                        ₹{item.price} per {item.unit}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="border-t border-[#C8E6C9] bg-white px-5 py-4 space-y-3">
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between text-[#5F6368]">
                                <span>Items Total</span>
                                <span>₹{cartTotal}</span>
                            </div>
                            <div className="flex justify-between text-[#5F6368]">
                                <span>Delivery Fee</span>
                                <span>₹{deliveryFee}</span>
                            </div>
                            <div className="flex justify-between text-[#5F6368]">
                                <span>Platform Fee</span>
                                <span>₹{platformFee}</span>
                            </div>
                            <div className="flex justify-between font-bold text-[#1B1B1B] text-base pt-2 border-t border-dashed border-[#C8E6C9]">
                                <span>Total</span>
                                <span className="text-[#1B5E20]">₹{total}</span>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleCheckout}
                            className="w-full h-12 bg-[#1B5E20] text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#2E7D32] transition-colors"
                        >
                            <span>Proceed to Checkout</span>
                            <ChevronRight className="w-5 h-5" />
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </>
    );
}
