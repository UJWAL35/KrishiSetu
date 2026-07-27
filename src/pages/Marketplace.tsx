import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    MapPin,
    Star,
    ShoppingCart,
    Leaf,
    ChevronRight,
    SlidersHorizontal,
    Plus,
    CheckCircle2,
    Crosshair,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useNavigate } from "react-router";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import StarRating from "@/components/shared/StarRating";

const categories = [
    { name: "All" },
    { name: "Grains" },
    { name: "Vegetables" },
    { name: "Fruits" },
    { name: "Pulses" },
];

export default function Marketplace() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [location, setLocation] = useState(() => localStorage.getItem("sf_user_location") || "Pune, Maharashtra");
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(() => {
        const stored = localStorage.getItem("sf_user_coords");
        return stored ? JSON.parse(stored) : null;
    });
    const [radius, setRadius] = useState<number | "All">("All");
    const [isDetecting, setIsDetecting] = useState(false);
    const navigate = useNavigate();
    const { addToCart, getAverageRating, getReviewsForCrop, getAverageRatingForFarmer, getReviewsForFarmer } = useCart();
    const { t } = useLanguage();
    const [addedCropId, setAddedCropId] = useState<number | null>(null);

    const handleDetectLocation = () => {
        if ("geolocation" in navigator) {
            setIsDetecting(true);
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ lat: latitude, lng: longitude });
                localStorage.setItem("sf_user_coords", JSON.stringify({ lat: latitude, lng: longitude }));
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    const city = data.address.city || data.address.town || data.address.village || data.address.county || "Detected Location";
                    const fullLoc = data.address.state ? `${city}, ${data.address.state}` : city;
                    setLocation(fullLoc);
                    localStorage.setItem("sf_user_location", fullLoc);
                } catch (e) {
                    console.error("Geocoding failed", e);
                } finally {
                    setIsDetecting(false);
                }
            }, (error) => {
                console.error("Geolocation error", error);
                setIsDetecting(false);
            });
        }
    };

    const { data: rawFarmers } = trpc.farmer.list.useQuery({
        crop: activeCategory === "All" ? undefined : activeCategory,
        lat: coords?.lat,
        lng: coords?.lng,
    });

    const { data: rawCrops } = trpc.crop.list.useQuery({
        category: activeCategory === "All" ? undefined : activeCategory.toLowerCase(),
        search: searchQuery || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
    });

    // FIX: guard against undefined distance so items aren't silently dropped
    // before coords/distance data has loaded
    const farmers = rawFarmers?.filter(f => radius === "All" || f.distance == null || f.distance <= radius);
    const crops = rawCrops?.filter(c => radius === "All" || c.distance == null || c.distance <= radius);

    type Crop = NonNullable<typeof crops>[number];
    type Farmer = NonNullable<typeof farmers>[number];

    const handleAddToCart = (crop: Crop) => {
        addToCart({
            cropId: crop.id,
            name: crop.name,
            variety: crop.variety,
            image: crop.image,
            price: crop.price,
            unit: crop.unit,
            farmerName: crop.farmerName,
            farmerAvatar: crop.farmerAvatar,
            farmerId: crop.farmerId,
            farmName: crop.farmName,
            farmId: crop.farmId,
            isOrganic: crop.isOrganic,
        });
        setAddedCropId(crop.id);
        setTimeout(() => setAddedCropId(null), 1500);
    };

    // FIX: farmers previously had no way to be rated — this opens the
    // farmer's profile/rating screen, same pattern as crops -> /order/:id
    const handleOpenFarmer = (farmer: Farmer) => {
        navigate(`/farmer/${farmer.id}`);
    };

    const handleRateFarmer = (e: React.MouseEvent, farmer: Farmer) => {
        e.stopPropagation();
        navigate(`/farmer/${farmer.id}?rate=true`);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
        <div className="min-h-screen bg-[#F1F8E9]">
            {/* Hero Banner */}
            <div className="relative h-[280px] md:h-[320px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#E0F6FF] to-[#F1F8E9]">
                    <div className="absolute top-8 right-16 w-20 h-20 rounded-full bg-[#FFD54F] sun-pulse shadow-[0_0_40px_rgba(255,213,79,0.4)]" />
                    <div className="absolute bottom-0 left-0 right-0 h-[60%]">
                        <div className="absolute bottom-0 left-0 right-0 h-full hills-drift">
                            <div className="absolute bottom-0 left-[-10%] right-[-10%] h-[80%] rounded-[100%] bg-[#4CAF50] opacity-90" />
                            <div className="absolute bottom-0 left-[20%] right-[-20%] h-[60%] rounded-[100%] bg-[#388E3C] opacity-90" />
                            <div className="absolute bottom-0 left-[-30%] right-[30%] h-[50%] rounded-[100%] bg-[#2E7D32] opacity-90" />
                        </div>
                    </div>
                </div>

                <div className="relative z-10 h-full flex flex-col justify-center px-6 max-w-7xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg"
                        style={{ fontFamily: "var(--font-display)", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
                    >
                        Discover Fresh
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className="text-lg md:text-xl text-[#F9A825] font-semibold mt-1"
                        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}
                    >
                        From Local Farms
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-white/90 mt-2 max-w-md"
                        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}
                    >
                        Connect directly with farmers growing what you need. Fresh, organic, delivered to your doorstep.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4 flex flex-col sm:flex-row gap-2 max-w-xl"
                    >
                        <div className="flex-1 flex items-center bg-white rounded-full px-4 py-3 shadow-lg">
                            <Search className="w-5 h-5 text-[#9E9E9E] mr-2" />
                            <input
                                type="text"
                                placeholder="Search corn, wheat, rice..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm outline-none"
                            />
                        </div>
                        <div className="flex items-center bg-white/90 rounded-full px-4 py-3 shadow-lg group">
                            <MapPin className="w-5 h-5 text-[#C62828] mr-2" />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => {
                                    setLocation(e.target.value);
                                    localStorage.setItem("sf_user_location", e.target.value);
                                }}
                                className="bg-transparent text-sm outline-none w-36"
                                placeholder="Enter location..."
                            />
                            <button
                                onClick={handleDetectLocation}
                                disabled={isDetecting}
                                className="ml-2 text-xs font-medium text-[#1B5E20] hover:text-[#2E7D32] flex items-center gap-1 disabled:opacity-50 transition-opacity whitespace-nowrap"
                            >
                                <Crosshair className={`w-3.5 h-3.5 ${isDetecting ? "animate-spin" : ""}`} />
                                <span className="hidden sm:inline">Detect</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 space-y-8">
                {/* Distance Filter */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8F5E9] flex flex-col sm:flex-row items-center gap-4 justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#5F6368]" />
                        <span className="text-sm font-medium text-[#1B1B1B]">Distance Radius:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {([5, 10, 20, 50, "All"] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRadius(r)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${radius === r
                                    ? "bg-[#1B5E20] text-white"
                                    : "bg-[#F1F8E9] text-[#5F6368] hover:bg-[#E8F5E9]"
                                    }`}
                            >
                                {r === "All" ? "Anywhere" : `Within ${r} km`}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Categories */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <h2 className="text-xl font-semibold text-[#1B1B1B] mb-4 text-center">Browse by Category</h2>
                    <div className="flex gap-3 overflow-x-auto pb-2 justify-start md:justify-center scrollbar-hide">
                        {categories.map((cat) => (
                            <motion.button
                                key={cat.name}
                                variants={itemVariants}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-md transition-all whitespace-nowrap ${activeCategory === cat.name
                                    ? "bg-[#1B5E20] text-white border-2 border-[#4CAF50]"
                                    : "bg-white text-[#1B1B1B] border-2 border-transparent hover:border-[#4CAF50]"
                                    }`}
                            >
                                <span className="text-sm font-medium">{cat.name}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Crops Section */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-[#1B1B1B]">
                            {activeCategory === "All" ? "Fresh Crops Available" : `${activeCategory} Crops`}
                        </h2>
                        <button className="flex items-center gap-1 text-sm text-[#1B5E20] font-medium">
                            <SlidersHorizontal className="w-4 h-4" />
                            Filter
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {crops?.map((crop) => (
                            <motion.div
                                key={crop.id}
                                variants={itemVariants}
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer group"
                                onClick={() => navigate(`/order/${crop.id}`)}
                            >
                                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] flex items-center justify-center">
                                    {crop.image ? (
                                        <img
                                            src={crop.image}
                                            alt={crop.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <span className="text-6xl select-none">🌿</span>
                                    )}
                                    {crop.isOrganic && (
                                        <span className="absolute top-3 left-3 bg-[#2E7D32] text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                                            <Leaf className="w-3 h-3" />
                                            Organic
                                        </span>
                                    )}
                                    <span className="absolute top-3 right-3 bg-white/95 text-[#1B1B1B] text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                                        <MapPin className="w-3 h-3 text-[#C62828]" />
                                        {crop.distance} km
                                    </span>
                                </div>

                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-[#1B1B1B]">{crop.name}</h3>
                                            <p className="text-xs text-[#5F6368] mt-0.5">{crop.variety}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-[#1B5E20]">₹{crop.price}</p>
                                            <p className="text-xs text-[#5F6368]">{t("perKg")}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-3">
                                        <img
                                            src={crop.farmerAvatar}
                                            alt={crop.farmerName}
                                            className="w-6 h-6 rounded-full object-cover"
                                        />
                                        <span className="text-xs text-[#5F6368]">{crop.farmerName}</span>
                                        <span className="text-xs text-[#5F6368]">•</span>
                                        <div className="flex items-center gap-1">
                                            <StarRating
                                                value={getAverageRating(crop.id) ?? crop.rating ?? 0}
                                                size="sm"
                                            />
                                            <span className="text-xs font-medium text-[#1B1B1B]">
                                                {(getAverageRating(crop.id) ?? crop.rating ?? 0).toFixed(1)}
                                            </span>
                                            {getReviewsForCrop(crop.id).length > 0 && (
                                                <span className="text-[10px] text-[#9E9E9E]">
                                                    ({getReviewsForCrop(crop.id).length})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-[#E8F5E9]">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${crop.stock > 100
                                            ? "bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]"
                                            : crop.stock > 0
                                                ? "bg-[#FFF8E1] text-[#F57F17] border border-[#FFE082]"
                                                : "bg-red-50 text-red-600 border border-red-200"
                                            }`}>
                                            {crop.stock > 100 ? t("inStock") : crop.stock > 0 ? t("lowStock") : "Out of Stock"}
                                        </span>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => { e.stopPropagation(); handleAddToCart(crop); }}
                                            disabled={crop.stock === 0}
                                            className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl shadow-md transition-all ${addedCropId === crop.id
                                                ? "bg-[#4CAF50] text-white shadow-green-500/30"
                                                : crop.stock === 0
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white hover:shadow-lg hover:shadow-[#1B5E20]/40"
                                                }`}
                                        >
                                            <AnimatePresence mode="wait">
                                                {addedCropId === crop.id ? (
                                                    <motion.span key="added" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="w-4 h-4" /> {t("added")}
                                                    </motion.span>
                                                ) : (
                                                    <motion.span key="add" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                                                        <ShoppingCart className="w-4 h-4" /> {t("addToCart")}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Nearby Farmers */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <h2 className="text-xl font-semibold text-[#1B1B1B] mb-4">
                        Nearby Farmers {activeCategory !== "All" && `growing ${activeCategory}`}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {farmers?.map((farmer) => {
                            // FIX: use live aggregate rating/review data (same pattern as crops)
                            // instead of only the static farmer.rating snapshot from the backend
                            const liveRating = getAverageRatingForFarmer?.(farmer.id) ?? farmer.rating ?? 0;
                            const liveReviews = getReviewsForFarmer?.(farmer.id) ?? [];

                            return (
                                <motion.div
                                    key={farmer.id}
                                    variants={itemVariants}
                                    whileHover={{ y: -2 }}
                                    className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all cursor-pointer"
                                    onClick={() => handleOpenFarmer(farmer)}
                                >
                                    <div className="flex items-start gap-3">
                                        <img
                                            src={farmer.avatar}
                                            alt={farmer.name}
                                            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1">
                                                <h3 className="font-semibold text-[#1B1B1B] truncate">{farmer.name}</h3>
                                                {farmer.isVerified && (
                                                    <span className="text-[#0277BD] text-xs">&#10003;</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#5F6368]">{farmer.farmName}</p>

                                            <div className="flex items-center gap-1 mt-1">
                                                <StarRating value={liveRating} size="sm" />
                                                <span className="text-xs font-medium text-[#1B1B1B]">{liveRating.toFixed(1)}</span>
                                                <span className="text-xs text-[#9E9E9E]">
                                                    ({liveReviews.length || farmer.reviewCount} reviews)
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mt-2">
                                                <MapPin className="w-3 h-3 text-[#C62828]" />
                                                <span className="text-xs text-[#5F6368]">{farmer.distance} km away</span>
                                            </div>

                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {farmer.crops.map((crop) => (
                                                    <span
                                                        key={crop}
                                                        className="text-[10px] px-2 py-0.5 bg-[#E8F5E9] text-[#1B5E20] rounded-full"
                                                    >
                                                        {crop}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* FIX: previously there was no interactive way to rate a farmer */}
                                            <button
                                                onClick={(e) => handleRateFarmer(e, farmer)}
                                                className="mt-3 flex items-center gap-1 text-xs font-medium text-[#1B5E20] hover:text-[#2E7D32]"
                                            >
                                                <Star className="w-3.5 h-3.5" />
                                                Rate this farmer
                                            </button>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-[#9E9E9E] flex-shrink-0 mt-1" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}