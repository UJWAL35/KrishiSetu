import { motion } from "framer-motion";
import { Link } from "react-router";
import {
    Wheat,
    ArrowRight,
    Shield,
    ShoppingBag,
    Sprout,
    BarChart3,
    Droplets,
    Bell,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Home() {
    const { t } = useLanguage();

    const features = [
        {
            icon: BarChart3,
            title: t("smartMonitoring"),
            description: t("smartMonitoringDesc"),
            color: "#00BCD4",
        },
        {
            icon: Droplets,
            title: t("oneClickSpray"),
            description: t("oneClickSprayDesc"),
            color: "#0277BD",
        },
        {
            icon: ShoppingBag,
            title: t("directMarketplace"),
            description: t("directMarketplaceDesc"),
            color: "#F9A825",
        },
        {
            icon: Bell,
            title: t("schemeAlerts"),
            description: t("schemeAlertsDesc"),
            color: "#7B1FA2",
        },
    ];

    const userRoles = [
        {
            icon: Sprout,
            title: t("forFarmers"),
            description: t("forFarmersDesc"),
            color: "#1B5E20",
            link: "/login",
            roleKey: "Farmers",
        },
        {
            icon: ShoppingBag,
            title: t("forConsumers"),
            description: t("forConsumersDesc"),
            color: "#F9A825",
            link: "/login",
            roleKey: "Consumers",
        },
        {
            icon: Shield,
            title: t("forAdmins"),
            description: t("forAdminsDesc"),
            color: "#6A1B9A",
            link: "/login",
            roleKey: "Admins",
        },
    ];

    const stats = [
        { value: "1,247+", label: t("farmersConnected") },
        { value: "8,942+", label: t("ordersDelivered") },
        { value: "50+", label: t("cropVarieties") },
        { value: "99.2%", label: t("satisfactionRate") },
    ];

    return (
        <div className="min-h-screen bg-[#F1F8E9]">
            {/* Hero Section */}
            <div className="relative min-h-[600px] overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0">
                    <img
                        src="/hero-farm.jpg"
                        alt="Farm"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0D3B10]/80 via-[#1B5E20]/50 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-2xl"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Wheat className="w-8 h-8 text-[#F9A825]" />
                            <span className="text-[#F9A825] font-semibold tracking-wider uppercase text-sm">
                                KrishiSetu Platform
                            </span>
                        </div>
                        <h1
                            className="text-4xl lg:text-6xl font-bold text-white leading-tight"
                            style={{ fontFamily: "var(--font-display)", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
                        >
                            {t("heroTitle").split("For Everyone")[0]}
                            <br />
                            <span className="text-[#F9A825]">
                                {t("heroTitle").includes("For Everyone") ? "For Everyone" : ""}
                            </span>
                        </h1>
                        <p className="text-lg text-white/80 mt-4 max-w-lg">
                            {t("heroSubtitle")}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-8">
                            <Link
                                to="/login"
                                className="flex items-center gap-2 px-8 py-4 bg-[#F9A825] text-[#1B1B1B] rounded-full font-semibold hover:bg-[#FFD54F] transition-colors shadow-lg"
                            >
                                {t("getStarted")}
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/marketplace"
                                className="flex items-center gap-2 px-8 py-4 bg-white/10 text-white border border-white/30 rounded-full font-semibold hover:bg-white/20 transition-colors backdrop-blur-sm"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                {t("browseMarketplaceBtn")}
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white shadow-md -mt-0 relative z-20">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat, idx) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="text-center"
                            >
                                <p className="text-2xl lg:text-3xl font-bold text-[#1B5E20]">{stat.value}</p>
                                <p className="text-sm text-[#5F6368] mt-1">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-6 py-20">
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl font-bold text-[#1B1B1B]">{t("platformFeatures")}</h2>
                    <p className="text-[#5F6368] mt-2 max-w-xl mx-auto">
                        {t("everythingYouNeed")}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ y: -4 }}
                                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all"
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                    style={{ backgroundColor: `${feature.color}15` }}
                                >
                                    <Icon className="w-6 h-6" style={{ color: feature.color }} />
                                </div>
                                <h3 className="font-semibold text-[#1B1B1B] mb-2">{feature.title}</h3>
                                <p className="text-sm text-[#5F6368]">{feature.description}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* User Roles Section */}
            <div className="bg-white py-20">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-3xl font-bold text-[#1B1B1B]">{t("builtForEveryone")}</h2>
                        <p className="text-[#5F6368] mt-2">
                            {t("agriculturalEcosystem")}
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {userRoles.map((role, idx) => {
                            const Icon = role.icon;
                            return (
                                <motion.div
                                    key={role.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.15 }}
                                    whileHover={{ y: -4 }}
                                    className="bg-[#F1F8E9] rounded-xl p-8 hover:shadow-lg transition-all text-center"
                                >
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                        style={{ backgroundColor: `${role.color}15` }}
                                    >
                                        <Icon className="w-8 h-8" style={{ color: role.color }} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-[#1B1B1B] mb-2">{role.title}</h3>
                                    <p className="text-sm text-[#5F6368] mb-6">{role.description}</p>
                                    <Link
                                        to={role.link}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-medium hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: role.color }}
                                    >
                                        {t("loginAs")} {role.roleKey}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gradient-to-r from-[#1B5E20] to-[#0D3B10] text-white py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <Wheat className="w-6 h-6 text-[#F9A825]" />
                            <span className="text-xl font-bold">
                                <span>Krishi</span>
                                <span className="text-[#F9A825]">Setu</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-white/70">
                            <span>{t("smartAgriculturePlatform")}</span>
                            <span>•</span>
                            <span>{t("empoweringFarmers")}</span>
                            <span>•</span>
                            <span>{t("connectingCommunities")}</span>
                        </div>
                        <p className="text-xs text-white/50">
                            &copy; 2024 KrishiSetu. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
