import { useState } from "react";
import { motion } from "framer-motion";
import {
    Bell,
    CheckCircle2,
    Calendar,
    Users,
    IndianRupee,
    ExternalLink,
    Filter,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { differenceInDays } from "date-fns";
import { useLanguage } from "@/context/LanguageContext";

const filterCategories = ["all", "financial", "equipment", "insurance", "training", "subsidy"];

const categoryColors: Record<string, string> = {
    financial: "#2E7D32",
    equipment: "#0277BD",
    insurance: "#EF6C00",
    training: "#7B1FA2",
    subsidy: "#6A1B9A",
};

export default function SchemesPage() {
    const [activeCategory, setActiveCategory] = useState("all");
    const [notifEnabled, setNotifEnabled] = useState(false);
    const { t } = useLanguage();

    const { data: schemes } = trpc.scheme.list.useQuery(
        activeCategory === "all" ? undefined : { category: activeCategory }
    );

    const categoryLabels: Record<string, string> = {
        financial: t("financial"),
        equipment: t("equipment"),
        insurance: t("insurance"),
        training: t("training"),
        subsidy: t("subsidy"),
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    };

    return (
        <div className="min-h-screen bg-[#F1F8E9] p-4 lg:p-6">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-4xl mx-auto space-y-6"
            >
                {/* Header */}
                <motion.div variants={itemVariants}>
                    <h1 className="text-2xl font-bold text-[#1B1B1B]">{t("governmentSchemes")}</h1>
                    <p className="text-sm text-[#5F6368] mt-1">
                        {t("stayUpdated")}
                    </p>
                </motion.div>

                {/* Subscription Banner */}
                <motion.div
                    variants={itemVariants}
                    className="relative bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] rounded-2xl p-6 shadow-xl overflow-hidden"
                >
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-4 left-4 text-white text-6xl font-bold rotate-12">K</div>
                        <div className="absolute bottom-4 right-8 text-white text-6xl font-bold -rotate-12">S</div>
                    </div>
                    <div className="relative text-center">
                        <Bell className="w-10 h-10 text-white mx-auto mb-3" />
                        <h2 className="text-xl font-bold text-white mb-1">{t("neverMissScheme")}</h2>
                        <p className="text-sm text-white/70 mb-4">
                            {t("getNotified")}
                        </p>
                        <button
                            onClick={() => setNotifEnabled((v) => !v)}
                            className={`px-6 py-2.5 border-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 mx-auto ${
                                notifEnabled
                                    ? "border-transparent bg-white text-[#1B5E20] shadow-lg"
                                    : "border-white text-white hover:bg-white/10"
                            }`}
                        >
                            {notifEnabled ? (
                                <><CheckCircle2 className="w-4 h-4" /> {t("notificationsEnabled")}</>
                            ) : (
                                <><Bell className="w-4 h-4" /> {t("enableNotifications")}</>
                            )}
                        </button>
                        {notifEnabled && (
                            <p className="text-xs text-white/60 mt-2">
                                {t("alertedWhenNew")}
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div variants={itemVariants} className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Filter className="w-4 h-4 text-[#5F6368] flex-shrink-0" />
                    {filterCategories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat
                                    ? "bg-[#1B5E20] text-white"
                                    : "bg-white text-[#5F6368] hover:bg-[#E8F5E9] border border-[#C8E6C9]"
                                }`}
                        >
                            {cat === "all" ? t("allSchemes") : categoryLabels[cat]}
                        </button>
                    ))}
                </motion.div>

                {/* Scheme Cards */}
                <div className="space-y-4">
                    {schemes?.map((scheme) => {
                        const color = categoryColors[scheme.category] || "#1B5E20";
                        const daysLeft = differenceInDays(new Date(scheme.deadline), new Date());
                        const isUrgent = daysLeft < 30;
                        const isNew = scheme.isNew;

                        return (
                            <motion.div
                                key={scheme.id}
                                variants={itemVariants}
                                whileHover={{ scale: 1.005 }}
                                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row">
                                    {/* Image */}
                                    <div className="md:w-48 h-40 md:h-auto flex-shrink-0">
                                        <img
                                            src={scheme.image}
                                            alt={scheme.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-5 border-l-4" style={{ borderLeftColor: color }}>
                                        {/* Badges */}
                                        <div className="flex items-center gap-2 mb-2">
                                            {isNew && (
                                                <span className="text-[10px] font-bold px-2.5 py-1 bg-[#C62828] text-white rounded-full status-dot-pulse">
                                                    NEW
                                                </span>
                                            )}
                                            <span
                                                className="text-[10px] font-medium px-2.5 py-1 rounded-full"
                                                style={{ backgroundColor: `${color}15`, color }}
                                            >
                                                {categoryLabels[scheme.category]}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-semibold text-[#1B1B1B] mb-2">{scheme.title}</h3>
                                        <p className="text-sm text-[#5F6368] line-clamp-2 mb-3">{scheme.description}</p>

                                        <div className="flex flex-wrap items-center gap-4 mb-3 text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-4 h-4 text-[#5F6368]" />
                                                <span className="text-[#5F6368]">{scheme.eligibility}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <IndianRupee className="w-4 h-4 text-[#2E7D32]" />
                                                <span className="font-semibold text-[#2E7D32]">{scheme.benefit}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" style={{ color: isUrgent ? "#C62828" : "#5F6368" }} />
                                                <span className={isUrgent ? "text-[#C62828] font-medium" : "text-[#5F6368]"}>
                                                    {daysLeft > 0 ? t("daysLeft", { n: daysLeft }) : t("expired")}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button className="px-4 py-2 border border-[#C8E6C9] text-[#5F6368] rounded-lg text-sm font-medium hover:bg-[#F1F8E9] transition-colors">
                                                {t("learnMore")}
                                            </button>
                                            <a
                                                href={scheme.applicationLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-1"
                                                style={{ backgroundColor: color }}
                                            >
                                                {t("applyNow")}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
