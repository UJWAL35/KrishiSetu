import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Leaf, CheckCircle2 } from "lucide-react";
import StarRating from "./StarRating";
import { useLanguage } from "@/context/LanguageContext";
import type { CartItem, PurchaseRecord } from "@/context/CartContext";

interface ReviewModalProps {
    item: CartItem;
    order: PurchaseRecord;
    onSubmit: (rating: number, comment: string) => void;
    onClose: () => void;
}

const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
const ratingColors = ["", "#C62828", "#EF6C00", "#F9A825", "#2E7D32", "#1B5E20"];
const ratingEmojis = ["", "😞", "😐", "🙂", "😊", "🤩"];

export default function ReviewModal({ item, order, onSubmit, onClose }: ReviewModalProps) {
    const { t } = useLanguage();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        if (rating === 0) return;
        setSubmitted(true);
        setTimeout(() => {
            onSubmit(rating, comment);
            onClose();
        }, 2200);
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 80, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 80, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                >
                    <AnimatePresence mode="wait">
                        {submitted ? (
                            /* Success State */
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-12 px-8 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.1, type: "spring", damping: 10 }}
                                    className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4"
                                >
                                    <CheckCircle2 className="w-10 h-10 text-[#2E7D32]" />
                                </motion.div>

                                {/* Star burst animation */}
                                <div className="relative flex justify-center mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ scale: 0, opacity: 1, x: 0, y: 0 }}
                                            animate={{
                                                scale: [0, 1.5, 0],
                                                opacity: [1, 1, 0],
                                                x: Math.cos((i * 72 * Math.PI) / 180) * 40,
                                                y: Math.sin((i * 72 * Math.PI) / 180) * 40,
                                            }}
                                            transition={{ delay: i * 0.08, duration: 0.6 }}
                                            className="absolute text-[#F9A825] text-xl"
                                        >
                                            ⭐
                                        </motion.div>
                                    ))}
                                </div>

                                <motion.h3
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xl font-bold text-[#1B1B1B] mb-2"
                                >
                                    {t("reviewSubmitted")}
                                </motion.h3>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-sm text-[#5F6368]"
                                >
                                    {t("thankYouReview")}
                                </motion.p>
                            </motion.div>
                        ) : (
                            /* Review Form */
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                                    <h2 className="text-lg font-bold text-[#1B1B1B]">{t("rateYourOrder")}</h2>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center hover:bg-[#EEEEEE] transition-colors"
                                    >
                                        <X className="w-4 h-4 text-[#5F6368]" />
                                    </button>
                                </div>

                                {/* Product Preview */}
                                <div className="mx-6 mb-4 flex items-center gap-3 p-3 bg-[#F1F8E9] rounded-2xl border border-[#C8E6C9]">
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-semibold text-sm text-[#1B1B1B]">{item.name}</p>
                                            {item.isOrganic && (
                                                <span className="flex items-center gap-0.5 text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-1.5 py-0.5 rounded-full">
                                                    <Leaf className="w-2.5 h-2.5" /> Organic
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#5F6368] mt-0.5">{item.farmerName} • {item.farmName}</p>
                                        <p className="text-xs text-[#9E9E9E]">#{order.orderNumber}</p>
                                    </div>
                                </div>

                                {/* Star Rating */}
                                <div className="px-6 mb-4 text-center">
                                    <p className="text-sm text-[#5F6368] mb-3">{t("howWasProduct")}</p>
                                    <div className="flex justify-center mb-2">
                                        <StarRating
                                            value={rating}
                                            interactive
                                            size="xl"
                                            onChange={setRating}
                                        />
                                    </div>
                                    <AnimatePresence mode="wait">
                                        {rating > 0 && (
                                            <motion.div
                                                key={rating}
                                                initial={{ opacity: 0, y: -8, scale: 0.8 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.8 }}
                                                transition={{ type: "spring", damping: 15 }}
                                                className="flex items-center justify-center gap-2"
                                            >
                                                <span className="text-2xl">{ratingEmojis[rating]}</span>
                                                <span
                                                    className="text-base font-bold"
                                                    style={{ color: ratingColors[rating] }}
                                                >
                                                    {ratingLabels[rating]}
                                                </span>
                                            </motion.div>
                                        )}
                                        {rating === 0 && (
                                            <motion.p
                                                key="placeholder"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-xs text-[#9E9E9E]"
                                            >
                                                {t("tapToRate")}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Comment */}
                                <div className="px-6 mb-5">
                                    <label className="text-xs font-medium text-[#5F6368] mb-1.5 block">{t("writeReview")} <span className="text-[#9E9E9E]">(optional)</span></label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder={t("reviewPlaceholder")}
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-[#C8E6C9] bg-[#F1F8E9] text-sm text-[#1B1B1B] placeholder-[#9E9E9E] focus:outline-none focus:border-[#4CAF50] focus:ring-2 focus:ring-[#4CAF50]/20 transition-all resize-none"
                                    />
                                </div>

                                {/* Submit */}
                                <div className="px-6 pb-6">
                                    <motion.button
                                        whileHover={rating > 0 ? { scale: 1.02 } : {}}
                                        whileTap={rating > 0 ? { scale: 0.97 } : {}}
                                        onClick={handleSubmit}
                                        disabled={rating === 0}
                                        className="w-full h-13 py-3.5 rounded-2xl font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: rating > 0 ? ratingColors[rating] : "#9E9E9E" }}
                                    >
                                        {t("submitReview")}
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
