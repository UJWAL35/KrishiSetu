import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Droplets,
    Bug,
    Sprout,
    Play,
    Pause,
    Clock,
    Calendar,
    CheckCircle2,
    AlertCircle,
    Activity,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useLanguage } from "@/context/LanguageContext";

// ── Static field definitions ──────────────────────────────────────────────────
const FIELDS = [
    { name: "Field A", crop: "Wheat" },
    { name: "Field B", crop: "Rice" },
    { name: "Field C", crop: "Vegetables" },
    { name: "Field D", crop: "Corn" },
] as const;

type FieldName = (typeof FIELDS)[number]["name"];
type SprayType = "water" | "pesticide" | "fertilizer";

// ── Per-field tank levels (initial values vary per field to look realistic) ───
const INITIAL_TANK_LEVELS: Record<FieldName, Record<SprayType, number>> = {
    "Field A": { water: 75, pesticide: 52, fertilizer: 68 },
    "Field B": { water: 60, pesticide: 38, fertilizer: 55 },
    "Field C": { water: 82, pesticide: 71, fertilizer: 40 },
    "Field D": { water: 45, pesticide: 29, fertilizer: 63 },
};

const sprayMetaBase: {
    id: SprayType;
    icon: React.ElementType;
    color: string;
    gradient: string;
    lightBg: string;
    consumePerMin: number;
}[] = [
    {
        id: "water",
        icon: Droplets,
        color: "#0277BD",
        gradient: "from-[#0277BD] to-[#01579B]",
        lightBg: "#E1F5FE",
        consumePerMin: 4,
    },
    {
        id: "pesticide",
        icon: Bug,
        color: "#E65100",
        gradient: "from-[#E65100] to-[#BF360C]",
        lightBg: "#FFF3E0",
        consumePerMin: 5,
    },
    {
        id: "fertilizer",
        icon: Sprout,
        color: "#6A1B9A",
        gradient: "from-[#6A1B9A] to-[#4A148C]",
        lightBg: "#F3E5F5",
        consumePerMin: 3,
    },
];

// ── Recommended text (dynamic, based on tank level) ──────────────────────────
function getRecommended(id: SprayType, level: number): string {
    if (id === "water") return `Soil moisture indicator • Tank: ${level}%`;
    if (id === "pesticide") {
        if (level < 30) return "⚠️ Low tank — refill recommended";
        return `Tank at ${level}% • Spray when needed`;
    }
    return `N-P-K: 14-14-14 • Tank: ${level}%`;
}

// ── Activity entry type ───────────────────────────────────────────────────────
type ActivityEntry = {
    id: number;
    time: string;
    action: string;
    field: FieldName;
    status: "completed" | "in_progress" | "failed";
    durationMin: number;
};

// ── Seed recent activity with some past entries ───────────────────────────────
const SEED_ACTIVITY: ActivityEntry[] = [
    { id: 100, time: "Today 6:00 AM",        action: "Water Spray",    field: "Field A", status: "completed", durationMin: 10 },
    { id: 101, time: "Yesterday 3:30 PM",    action: "Fertilizer",     field: "Field B", status: "completed", durationMin: 12 },
    { id: 102, time: "Dec 21, 2:00 PM",      action: "Pesticide Spray",field: "Field D", status: "completed", durationMin: 15 },
    { id: 103, time: "Dec 20, 6:00 AM",      action: "Water Spray",    field: "Field A", status: "completed", durationMin: 8  },
];

const scheduleItems = [
    { time: "6:00 AM",   action: "Water Spray",  field: "Field A", type: "auto"      },
    { time: "3:00 PM",   action: "Fertilizer",   field: "Field B", type: "manual"    },
    { time: "Tomorrow",  action: "Pesticide",    field: "Field C", type: "scheduled" },
];

let nextId = 200;

function nowLabel(): string {
    const d = new Date();
    const h = d.getHours();
    const m = d.getMinutes().toString().padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h % 12 || 12;
    return `Today ${hr}:${m} ${ampm}`;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function FarmControls() {
    const [selectedField, setSelectedField] = useState<FieldName>("Field A");
    const [activeSpray, setActiveSpray] = useState<SprayType | null>(null);
    const [sprayProgress, setSprayProgress] = useState(0);
    const [durations, setDurations] = useState<Record<SprayType, number>>({
        water: 10,
        pesticide: 15,
        fertilizer: 12,
    });
    const { t } = useLanguage();

    // Build translated sprayMeta inside component
    const sprayMeta = sprayMetaBase.map((s) => ({
        ...s,
        name: s.id === "water" ? t("waterSpray") : s.id === "pesticide" ? t("pesticideSpray") : t("fertilizerSpray"),
        description: s.id === "water" ? t("irrigateAllFields") : s.id === "pesticide" ? t("protectCrops") : t("nourishSoil"),
    }));

    // Per-field tank levels (mutable state)
    const [tankLevels, setTankLevels] = useState<Record<FieldName, Record<SprayType, number>>>(
        () => structuredClone(INITIAL_TANK_LEVELS),
    );

    // Recent activity list (newest first)
    const [activities, setActivities] = useState<ActivityEntry[]>(SEED_ACTIVITY);

    const simulateSpray = trpc.sensor.simulateSpray.useMutation();

    const startSpray = (sprayId: SprayType) => {
        if (activeSpray) return;
        setActiveSpray(sprayId);
        setSprayProgress(0);

        const duration = durations[sprayId];
        const meta = sprayMeta.find((s) => s.id === sprayId)!;

        // Add an "in_progress" entry immediately
        const entry: ActivityEntry = {
            id: nextId++,
            time: nowLabel(),
            action: meta.name,
            field: selectedField,
            status: "in_progress",
            durationMin: duration,
        };
        setActivities((prev) => [entry, ...prev]);

        const interval = setInterval(() => {
            setSprayProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setActiveSpray(null);
                    setSprayProgress(0);

                    // Reduce tank level for this field & spray type
                    const consumed = Math.min(meta.consumePerMin * duration, 90);
                    setTankLevels((prev) => ({
                        ...prev,
                        [selectedField]: {
                            ...prev[selectedField],
                            [sprayId]: Math.max(0, prev[selectedField][sprayId] - consumed),
                        },
                    }));

                    // Mark the activity as completed
                    setActivities((prev) =>
                        prev.map((a) =>
                            a.id === entry.id ? { ...a, status: "completed" } : a,
                        ),
                    );

                    // Call backend
                    simulateSpray.mutate({
                        field: selectedField,
                        type: sprayId,
                    });

                    return 100;
                }
                return prev + 2;
            });
        }, 100);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    return (
        <div className="min-h-screen bg-[#F1F8E9] p-4 lg:p-6">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto space-y-6"
            >
                {/* Header */}
                <motion.div variants={itemVariants}>
                    <h1 className="text-2xl font-bold text-[#1B1B1B]">{t("farmControlCenter")}</h1>
                    <p className="text-sm text-[#5F6368] mt-1">
                        {t("manageIrrigation")}
                    </p>
                </motion.div>

                {/* Field Selector */}
                <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-2">
                    {FIELDS.map((field) => (
                        <button
                            key={field.name}
                            onClick={() => setSelectedField(field.name)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap transition-all ${
                                selectedField === field.name
                                    ? "bg-[#1B5E20] text-white shadow-md"
                                    : "bg-white text-[#5F6368] hover:bg-[#E8F5E9] border border-[#C8E6C9]"
                            }`}
                        >
                            <span className="text-sm font-medium">{field.name}</span>
                            <span className="text-xs opacity-70">— {field.crop}</span>
                        </button>
                    ))}
                </motion.div>

                {/* Field tank level summary bar */}
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-4 shadow-sm border border-[#C8E6C9]">
                    <p className="text-xs font-semibold text-[#5F6368] mb-3 uppercase tracking-wide">
                        {selectedField} — {t("currentTankLevels")}
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        {sprayMeta.map((s) => {
                            const level = tankLevels[selectedField][s.id];
                            return (
                                <div key={s.id} className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-[#5F6368]">{s.name.split(" ")[0]}</span>
                                        <span
                                            className="text-xs font-bold"
                                            style={{ color: s.color }}
                                        >
                                            {Math.round(level)}%
                                        </span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: s.lightBg }}>
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: s.color }}
                                            animate={{ width: `${level}%` }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Spray Control Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {sprayMeta.map((spray) => {
                        const Icon = spray.icon;
                        const isActive = activeSpray === spray.id;
                        const currentDuration = durations[spray.id];
                        const tankLevel = tankLevels[selectedField][spray.id];

                        return (
                            <motion.div
                                key={spray.id}
                                variants={itemVariants}
                                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all border-2 overflow-hidden"
                                style={{ borderColor: spray.color }}
                            >
                                {/* Header */}
                                <div className="p-5 pb-3">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${spray.color}15` }}
                                        >
                                            <Icon className="w-6 h-6" style={{ color: spray.color }} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-[#1B1B1B]">{spray.name}</h3>
                                            <p className="text-xs text-[#5F6368]">
                                                {getRecommended(spray.id, Math.round(tankLevel))}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tank Level — per field, per spray type */}
                                    <div className="flex items-center justify-center mb-4">
                                        <div className="relative w-24 h-24">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle
                                                    cx="48" cy="48" r="40"
                                                    fill="none"
                                                    stroke={spray.lightBg}
                                                    strokeWidth="8"
                                                />
                                                <motion.circle
                                                    cx="48" cy="48" r="40"
                                                    fill="none"
                                                    stroke={spray.color}
                                                    strokeWidth="8"
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${2 * Math.PI * 40}`}
                                                    animate={{
                                                        strokeDashoffset:
                                                            2 * Math.PI * 40 * (1 - tankLevel / 100),
                                                    }}
                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span
                                                    className="text-2xl font-bold font-mono"
                                                    style={{ color: spray.color }}
                                                >
                                                    {Math.round(tankLevel)}%
                                                </span>
                                                <span className="text-[10px] text-[#5F6368]">Tank</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Duration Slider */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-[#5F6368]">{t("duration")}</span>
                                            <span className="text-xs font-medium" style={{ color: spray.color }}>
                                                {currentDuration} min
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="30"
                                            value={currentDuration}
                                            onChange={(e) =>
                                                setDurations((prev) => ({
                                                    ...prev,
                                                    [spray.id]: Number(e.target.value),
                                                }))
                                            }
                                            className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                            style={{
                                                background: `linear-gradient(to right, ${spray.color} ${(currentDuration / 30) * 100}%, ${spray.lightBg} ${(currentDuration / 30) * 100}%)`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Spray Button */}
                                <div className="px-5 pb-5">
                                    <motion.button
                                        whileHover={!isActive ? { y: -2 } : {}}
                                        whileTap={!isActive ? { scale: 0.97 } : {}}
                                        onClick={() => startSpray(spray.id)}
                                        disabled={isActive || tankLevel <= 0}
                                        className={`w-full h-14 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                                            isActive || tankLevel <= 0
                                                ? "bg-[#5F6368] cursor-not-allowed"
                                                : `bg-gradient-to-r ${spray.gradient} shadow-lg hover:shadow-xl`
                                        }`}
                                        style={
                                            isActive || tankLevel <= 0
                                                ? {}
                                                : { boxShadow: `0 4px 16px ${spray.color}25` }
                                        }
                                    >
                                        {tankLevel <= 0 ? (
                                            <>
                                                <AlertCircle className="w-5 h-5" />
                                                <span>{t("tankEmpty")}</span>
                                            </>
                                        ) : isActive ? (
                                            <>
                                                <Pause className="w-5 h-5" />
                                                <span>{t("spraying")}... {sprayProgress}%</span>
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-5 h-5" />
                                                <span>{t("sprayNow")}</span>
                                            </>
                                        )}
                                    </motion.button>

                                    {/* Progress Bar */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3"
                                            >
                                                <div className="h-2 bg-[#E8F5E9] rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: spray.color }}
                                                        animate={{ width: `${sprayProgress}%` }}
                                                        transition={{ duration: 0.1 }}
                                                    />
                                                </div>
                                                {/* Droplet animation */}
                                                <div className="relative h-8 mt-2 overflow-hidden">
                                                    {Array.from({ length: 8 }).map((_, i) => (
                                                        <motion.div
                                                            key={i}
                                                            className="absolute w-1.5 h-1.5 rounded-full"
                                                            style={{
                                                                backgroundColor: spray.color,
                                                                left: `${10 + i * 12}%`,
                                                                opacity: 0.6,
                                                            }}
                                                            animate={{ y: [0, 30], opacity: [0.6, 0] }}
                                                            transition={{
                                                                duration: 1 + Math.random(),
                                                                repeat: Infinity,
                                                                delay: Math.random() * 2,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Schedule & Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Schedule */}
                    <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 shadow-md">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-[#1B5E20]" />
                            <h3 className="text-lg font-semibold text-[#1B1B1B]">{t("upcomingSchedule")}</h3>
                        </div>
                        <div className="relative pl-4">
                            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-[#C8E6C9]" />
                            <div className="space-y-4">
                                {scheduleItems.map((item, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative flex items-start gap-4"
                                    >
                                        <div className="w-3 h-3 rounded-full bg-[#1B5E20] mt-1.5 flex-shrink-0 relative z-10" />
                                        <div className="flex-1 p-3 bg-[#F1F8E9] rounded-lg hover:bg-[#E8F5E9] transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-[#1B1B1B]">
                                                        {item.time} — {item.action} ({item.field})
                                                    </p>
                                                </div>
                                                <span
                                                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                                        item.type === "auto"
                                                            ? "bg-[#E1F5FE] text-[#0277BD]"
                                                            : item.type === "manual"
                                                            ? "bg-[#F3E5F5] text-[#6A1B9A]"
                                                            : "bg-[#E8F5E9] text-[#1B5E20]"
                                                    }`}
                                                >
                                                    {item.type}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Recent Activity — live, newest first */}
                    <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-[#1B5E20]" />
                                <h3 className="text-lg font-semibold text-[#1B1B1B]">{t("recentActivity")}</h3>
                            </div>
                            <span className="text-xs bg-[#E8F5E9] text-[#1B5E20] px-2 py-0.5 rounded-full font-medium">
                                {activities.length} {t("entries")}
                            </span>
                        </div>
                        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                            <AnimatePresence initial={false}>
                                {activities.map((activity) => {
                                    const sprayColor =
                                        activity.action.toLowerCase().includes("water")
                                            ? "#0277BD"
                                            : activity.action.toLowerCase().includes("pesticide")
                                            ? "#E65100"
                                            : "#6A1B9A";
                                    return (
                                        <motion.div
                                            key={activity.id}
                                            initial={{ opacity: 0, y: -16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F1F8E9] transition-colors border border-transparent hover:border-[#C8E6C9]"
                                        >
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${sprayColor}15` }}
                                            >
                                                {activity.status === "completed" ? (
                                                    <CheckCircle2
                                                        className="w-4 h-4"
                                                        style={{ color: sprayColor }}
                                                    />
                                                ) : activity.status === "in_progress" ? (
                                                    <Clock className="w-4 h-4 text-[#00BCD4]" />
                                                ) : (
                                                    <AlertCircle className="w-4 h-4 text-[#C62828]" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[#1B1B1B]">
                                                    {activity.action}
                                                </p>
                                                <p className="text-xs text-[#5F6368]">
                                                    {activity.field} • {activity.time} • {activity.durationMin} min
                                                </p>
                                            </div>
                                            <span
                                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                                                    activity.status === "completed"
                                                        ? "bg-[#E8F5E9] text-[#2E7D32]"
                                                        : activity.status === "in_progress"
                                                        ? "bg-[#E1F5FE] text-[#0277BD] animate-pulse"
                                                        : "bg-[#FFEBEE] text-[#C62828]"
                                                }`}
                                            >
                                                {activity.status === "in_progress"
                                                    ? t("inProgress")
                                                    : activity.status === "completed"
                                                    ? t("completed")
                                                    : t("failed")}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
