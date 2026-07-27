import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface StarRatingProps {
    value: number;
    max?: number;
    interactive?: boolean;
    size?: "sm" | "md" | "lg" | "xl";
    onChange?: (rating: number) => void;
    showLabel?: boolean;
}

const sizeMap = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
    xl: "w-9 h-9",
};

export default function StarRating({
    value,
    max = 5,
    interactive = false,
    size = "md",
    onChange,
    showLabel = false,
}: StarRatingProps) {
    const [hovered, setHovered] = useState<number | null>(null);

    const displayValue = hovered ?? value;

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: max }).map((_, i) => {
                const starValue = i + 1;
                const isFilled = starValue <= displayValue;
                const isPartial = !isFilled && starValue - 0.5 <= displayValue;

                return (
                    <motion.button
                        key={i}
                        type="button"
                        disabled={!interactive}
                        onClick={() => interactive && onChange?.(starValue)}
                        onMouseEnter={() => interactive && setHovered(starValue)}
                        onMouseLeave={() => interactive && setHovered(null)}
                        whileHover={interactive ? { scale: 1.3, rotate: -5 } : {}}
                        whileTap={interactive ? { scale: 0.85 } : {}}
                        animate={isFilled && interactive && hovered === starValue
                            ? { y: [0, -4, 0] }
                            : {}
                        }
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className={`relative focus:outline-none ${interactive ? "cursor-pointer" : "cursor-default"}`}
                        aria-label={`${starValue} star`}
                    >
                        {/* Background (empty) star */}
                        <Star
                            className={`${sizeMap[size]} text-[#E0E0E0] transition-colors duration-150`}
                        />
                        {/* Filled star overlay */}
                        <Star
                            className={`${sizeMap[size]} absolute inset-0 transition-all duration-150 ${
                                isFilled
                                    ? "text-[#F9A825] fill-[#F9A825] drop-shadow-[0_0_4px_rgba(249,168,37,0.6)]"
                                    : isPartial
                                    ? "text-[#F9A825] fill-[#F9A825]"
                                    : "opacity-0"
                            }`}
                            style={isPartial && !isFilled ? { clipPath: "inset(0 50% 0 0)" } : {}}
                        />
                        {/* Glow ring on hover */}
                        {interactive && hovered !== null && starValue <= hovered && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0.8 }}
                                animate={{ scale: 2.5, opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 rounded-full bg-[#F9A825]/30 pointer-events-none"
                            />
                        )}
                    </motion.button>
                );
            })}
            {showLabel && (
                <span className="ml-1 text-sm font-semibold text-[#1B1B1B]">
                    {value.toFixed(1)}
                </span>
            )}
        </div>
    );
}
