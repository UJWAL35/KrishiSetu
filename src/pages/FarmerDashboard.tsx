import { useState } from "react";
import { motion } from "framer-motion";
import {
    Thermometer,
    Droplets,
    FlaskConical,
    Cloud,
    Zap,
    MapPin,
    ChevronDown,
    Activity,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    BarChart2,
    Radar as RadarIcon,
    Clock,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    Radar,
    BarChart,
    Bar,
    Legend,
    CartesianGrid,
} from "recharts";

const sensorConfig: Record<string, { color: string; icon: React.ElementType; unit: string; min: number; max: number; optimal: { min: number; max: number } }> = {
    temperature:  { color: "#00BCD4", icon: Thermometer, unit: "°C", min: 0,  max: 50,  optimal: { min: 18, max: 35 } },
    soil_moisture:{ color: "#0277BD", icon: Droplets,    unit: "%",  min: 0,  max: 100, optimal: { min: 30, max: 85 } },
    ph:           { color: "#4CAF50", icon: FlaskConical, unit: "",  min: 0,  max: 14,  optimal: { min: 5.5, max: 8.0 } },
    humidity:     { color: "#F9A825", icon: Cloud,        unit: "%",  min: 0,  max: 100, optimal: { min: 30, max: 80 } },
};

const statusColors = {
    optimal:  "#2E7D32",
    warning:  "#EF6C00",
    critical: "#C62828",
};

const fields = ["Field A", "Field B", "Field C", "Field D"];

type InsightTab = "line" | "radar" | "bar";

export default function FarmerDashboard() {
    const [selectedField, setSelectedField] = useState("Field A");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [insightTab, setInsightTab] = useState<InsightTab>("line");
    const { t } = useLanguage();

    const { data: sensorData } = trpc.sensor.getAll.useQuery(undefined, {
        refetchInterval: 5000,
    });

    const fieldData = sensorData?.[selectedField];

    // Compute trend: compare last value to 3rd-to-last
    function getTrend(history?: { time: string; value: number }[]): "up" | "down" | "stable" {
        if (!history || history.length < 3) return "stable";
        const latest = history[history.length - 1].value;
        const prev   = history[history.length - 3].value;
        const diff   = latest - prev;
        if (Math.abs(diff) < 0.5) return "stable";
        return diff > 0 ? "up" : "down";
    }

    // Generate 24h simulated history when real history is empty
    function getOrSimulateHistory(type: string, currentValue: number, realHistory?: { time: string; value: number }[]) {
        if (realHistory && realHistory.length > 0) return realHistory;
        // Simulate 24 hourly points with small variance around current value
        const config = sensorConfig[type];
        if (!config) return [];
        const amplitude = (config.max - config.min) * 0.05; // 5% of range
        return Array.from({ length: 24 }, (_, i) => {
            const noise = (Math.sin(i * 0.8) + Math.cos(i * 0.3)) * amplitude;
            const value = Math.min(config.max, Math.max(config.min, parseFloat((currentValue + noise).toFixed(1))));
            const date = new Date();
            date.setHours(date.getHours() - (23 - i));
            return { time: date.toISOString(), value };
        });
    }

    // Build line chart data — always has 24 points (real or simulated)
    const lineChartData = (() => {
        if (!fieldData) return [];
        const tempHistory = getOrSimulateHistory("temperature", fieldData.temperature?.value ?? 28, fieldData.temperature?.history);
        return tempHistory.map((h, i) => {
            const hour = new Date(h.time).getHours();
            const point: Record<string, number | string> = { time: `${hour}:00` };
            Object.entries(fieldData).forEach(([type, sensor]) => {
                const hist = getOrSimulateHistory(type, sensor?.value ?? 0, sensor?.history);
                if (hist[i]) point[type] = hist[i].value;
            });
            return point;
        });
    })();

    // Build radar chart data: each sensor as a spoke, value as % of range
    const radarData = Object.entries(sensorConfig).map(([type, config]) => {
        const val = fieldData?.[type]?.value ?? 0;
        const pct = ((val - config.min) / (config.max - config.min)) * 100;
        const optMinPct = ((config.optimal.min - config.min) / (config.max - config.min)) * 100;
        const optMaxPct = ((config.optimal.max - config.min) / (config.max - config.min)) * 100;
        return {
            sensor: type.replace("_", " "),
            actual: Math.round(pct),
            optimalMin: Math.round(optMinPct),
            optimalMax: Math.round(optMaxPct),
        };
    });

    // Build bar chart data: all fields side by side for each sensor type
    const barData = Object.entries(sensorConfig).map(([type]) => {
        const row: Record<string, any> = { sensor: type.replace("_", " ") };
        for (const field of fields) {
            row[field] = sensorData?.[field]?.[type]?.value ?? 0;
        }
        return row;
    });

    // Build alert timeline from all fields and types
    const alertTimeline: { field: string; type: string; status: string; value: number; unit: string; time: string }[] = [];
    if (sensorData) {
        for (const field of fields) {
            for (const type of Object.keys(sensorConfig)) {
                const sensor = sensorData[field]?.[type];
                if (sensor && (sensor.status === "warning" || sensor.status === "critical")) {
                    alertTimeline.push({
                        field,
                        type,
                        status: sensor.status,
                        value: sensor.value,
                        unit: sensorConfig[type]?.unit ?? "",
                        time: "Latest",
                    });
                }
            }
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden:  { opacity: 0, y: 20 },
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
                <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1B1B1B]">{t("farmDashboard")}</h1>
                        <p className="text-sm text-[#5F6368] mt-1">{t("monitorFarm")}</p>
                    </div>

                    {/* Farm Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm border border-[#C8E6C9] hover:shadow-md transition-all"
                        >
                            <MapPin className="w-4 h-4 text-[#1B5E20]" />
                            <span className="text-sm font-medium">{selectedField} — Green Acres Farm</span>
                            <ChevronDown className={`w-4 h-4 text-[#5F6368] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                        </button>
                        {dropdownOpen && (
                            <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-lg border border-[#C8E6C9] overflow-hidden z-10">
                                {fields.map((field) => (
                                    <button
                                        key={field}
                                        onClick={() => { setSelectedField(field); setDropdownOpen(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-[#E8F5E9] transition-colors ${field === selectedField ? "bg-[#E8F5E9] text-[#1B5E20] font-medium" : "text-[#5F6368]"}`}
                                    >
                                        {field}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Farm Map Visualization */}
                <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden shadow-lg bg-white">
                    <div className="relative h-[350px] lg:h-[450px]">
                        <img src="/farm-map.jpg" alt="Farm Map" className="w-full h-full object-cover" />
                        {/* Sensor Overlays */}
                        {fieldData && Object.entries(fieldData).map(([type, sensor]) => {
                            const config = sensorConfig[type];
                            if (!config) return null;
                            const positions: Record<string, Record<string, { top: string; left: string }>> = {
                                "Field A": { temperature: { top: "30%", left: "25%" }, soil_moisture: { top: "65%", left: "20%" }, ph: { top: "20%", left: "70%" }, humidity: { top: "45%", left: "50%" } },
                                "Field B": { temperature: { top: "35%", left: "75%" }, soil_moisture: { top: "70%", left: "80%" }, ph: { top: "25%", left: "30%" }, humidity: { top: "50%", left: "55%" } },
                                "Field C": { temperature: { top: "75%", left: "25%" }, soil_moisture: { top: "80%", left: "45%" }, ph: { top: "60%", left: "15%" }, humidity: { top: "85%", left: "70%" } },
                                "Field D": { temperature: { top: "40%", left: "80%" }, soil_moisture: { top: "60%", left: "75%" }, ph: { top: "30%", left: "55%" }, humidity: { top: "50%", left: "85%" } },
                            };
                            const pos = positions[selectedField]?.[type];
                            if (!pos) return null;

                            return (
                                <div key={type} className="absolute group cursor-pointer" style={{ top: pos.top, left: pos.left }}>
                                    <div className="absolute inset-0 rounded-full sensor-pulse" style={{ border: `2px solid ${config.color}` }} />
                                    <div className="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110" style={{ backgroundColor: config.color }}>
                                        {(() => { const IconComponent = config.icon; return <IconComponent className="w-4 h-4 text-white" />; })()}
                                    </div>
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                        <p className="text-xs font-medium capitalize">{type.replace("_", " ")}</p>
                                        <p className="text-lg font-bold font-mono" style={{ color: config.color }}>{sensor?.value || 0}{config.unit}</p>
                                        <p className="text-[10px]" style={{ color: statusColors[sensor?.status as keyof typeof statusColors] || "#9E9E9E" }}>{sensor?.status?.toUpperCase() || "UNKNOWN"}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {/* Legend */}
                        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                {Object.entries(sensorConfig).map(([type, config]) => (
                                    <div key={type} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                                        <span className="text-[10px] text-[#5F6368] capitalize">{type.replace("_", " ")}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Sensor Cards with Trends */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {fieldData && Object.entries(fieldData).map(([type, sensor]) => {
                        const config = sensorConfig[type];
                        if (!config) return null;
                        const Icon = config.icon;
                        const percentage = ((sensor.value - config.min) / (config.max - config.min)) * 100;
                        const trend = getTrend(sensor?.history);

                        return (
                            <motion.div
                                key={type}
                                variants={itemVariants}
                                whileHover={{ y: -3 }}
                                className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all border-l-4"
                                style={{ borderLeftColor: config.color }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${config.color}15` }}>
                                            <Icon className="w-5 h-5" style={{ color: config.color }} />
                                        </div>
                                        <span className="text-sm text-[#5F6368] capitalize font-medium">{type.replace("_", " ")}</span>
                                    </div>
                                    {/* Trend indicator */}
                                    <div className={`flex items-center gap-0.5 text-xs font-semibold ${
                                        trend === "up" ? "text-red-500" : trend === "down" ? "text-blue-500" : "text-[#9E9E9E]"
                                    }`}>
                                        {trend === "up" ? <TrendingUp className="w-4 h-4" /> : trend === "down" ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                                    </div>
                                </div>

                                <div className="flex items-end gap-2 mb-3">
                                    <span className="text-3xl font-bold font-mono text-[#1B1B1B]">{sensor.value}</span>
                                    <span className="text-sm text-[#5F6368] mb-1">{config.unit}</span>
                                </div>

                                <div className="flex items-center justify-between mb-3">
                                    <span
                                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                                        style={{
                                            backgroundColor: `${statusColors[sensor.status as keyof typeof statusColors] || "#9E9E9E"}15`,
                                            color: statusColors[sensor.status as keyof typeof statusColors] || "#9E9E9E",
                                        }}
                                    >
                                        {sensor.status?.toUpperCase() || "UNKNOWN"}
                                    </span>
                                    <span className="text-[10px] text-[#9E9E9E]">Updated live</span>
                                </div>

                                <div className="h-2 bg-[#E8F5E9] rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: config.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-[#9E9E9E]">{config.min}{config.unit}</span>
                                    <span className="text-[10px] text-[#9E9E9E]">{config.max}{config.unit}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* ── SENSOR INSIGHTS SECTION ── */}
                <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-md overflow-hidden">
                    {/* Tab header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F8E9]">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#4CAF50]" />
                            <h3 className="text-lg font-semibold text-[#1B1B1B]">Sensor Insights</h3>
                            <span className="text-xs text-[#4CAF50] bg-[#E8F5E9] px-2 py-0.5 rounded-full font-semibold">Live</span>
                        </div>
                        {/* Tab switcher */}
                        <div className="flex items-center gap-1 bg-[#F1F8E9] rounded-xl p-1">
                            {[
                                { id: "line" as InsightTab, icon: Activity,  label: "History" },
                                { id: "radar" as InsightTab, icon: RadarIcon, label: "Radar"  },
                                { id: "bar" as InsightTab,  icon: BarChart2,  label: "Fields"  },
                            ].map(({ id, icon: Icon, label }) => (
                                <button
                                    key={id}
                                    onClick={() => setInsightTab(id)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        insightTab === id
                                            ? "bg-white text-[#1B5E20] shadow-sm"
                                            : "text-[#9E9E9E] hover:text-[#5F6368]"
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6">
                        {/* ── Line Chart: Sensor History ── */}
                        {insightTab === "line" && (
                            <div>
                                <p className="text-sm text-[#5F6368] mb-4">
                                    24h sensor history — {selectedField}
                                    {fieldData?.temperature?.history?.length === 0 && (
                                        <span className="ml-2 text-[10px] text-[#9E9E9E] bg-[#F1F8E9] px-2 py-0.5 rounded-full">simulated</span>
                                    )}
                                </p>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={lineChartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F8E9" />
                                            <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9E9E9E" }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: "#9E9E9E" }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: "#fff", border: "1px solid #C8E6C9", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                                                labelStyle={{ fontWeight: 600, color: "#1B1B1B" }}
                                            />
                                            <Legend iconType="circle" iconSize={8} />
                                            {Object.entries(sensorConfig).map(([type, config]) => (
                                                <Line
                                                    key={type}
                                                    type="monotone"
                                                    dataKey={type}
                                                    stroke={config.color}
                                                    strokeWidth={2.5}
                                                    dot={false}
                                                    activeDot={{ r: 5, strokeWidth: 0 }}
                                                    name={type.replace("_", " ").toUpperCase()}
                                                />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}


                        {/* ── Radar Chart: Current vs Optimal ── */}
                        {insightTab === "radar" && (
                            <div>
                                <p className="text-sm text-[#5F6368] mb-4">Current readings vs optimal range (as % of sensor range) — {selectedField}</p>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="#E8F5E9" />
                                            <PolarAngleAxis
                                                dataKey="sensor"
                                                tick={{ fontSize: 11, fill: "#5F6368" }}
                                            />
                                            <Radar
                                                name="Optimal Min"
                                                dataKey="optimalMin"
                                                stroke="#C8E6C9"
                                                fill="#4CAF50"
                                                fillOpacity={0.15}
                                                dot={false}
                                            />
                                            <Radar
                                                name="Optimal Max"
                                                dataKey="optimalMax"
                                                stroke="#4CAF50"
                                                fill="#4CAF50"
                                                fillOpacity={0.1}
                                                dot={false}
                                            />
                                            <Radar
                                                name="Actual"
                                                dataKey="actual"
                                                stroke="#1B5E20"
                                                fill="#1B5E20"
                                                fillOpacity={0.35}
                                                dot={{ fill: "#1B5E20", r: 4 }}
                                            />
                                            <Legend
                                                iconType="circle"
                                                iconSize={8}
                                                formatter={(value) => <span style={{ fontSize: 11, color: "#5F6368" }}>{value}</span>}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: "#fff", border: "1px solid #C8E6C9", borderRadius: "10px" }}
                                                formatter={(val: any) => [`${val}%`, ""]}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {radarData.map((d) => {
                                        const inRange = d.actual >= d.optimalMin && d.actual <= d.optimalMax;
                                        return (
                                            <div key={d.sensor} className={`rounded-xl p-3 border-2 ${inRange ? "border-[#4CAF50] bg-[#E8F5E9]" : "border-orange-200 bg-orange-50"}`}>
                                                <p className="text-xs font-semibold capitalize text-[#1B1B1B]">{d.sensor}</p>
                                                <p className={`text-lg font-bold mt-0.5 ${inRange ? "text-[#2E7D32]" : "text-orange-500"}`}>{d.actual}%</p>
                                                <p className="text-[10px] text-[#9E9E9E]">Optimal: {d.optimalMin}–{d.optimalMax}%</p>
                                                <p className={`text-[10px] font-semibold ${inRange ? "text-[#4CAF50]" : "text-orange-400"}`}>
                                                    {inRange ? "✓ In Range" : "⚠ Out of Range"}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── Bar Chart: All Fields Comparison ── */}
                        {insightTab === "bar" && (
                            <div>
                                <p className="text-sm text-[#5F6368] mb-4">Compare sensor readings across all fields</p>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={barData} barCategoryGap="25%" barGap={3}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#F1F8E9" vertical={false} />
                                            <XAxis dataKey="sensor" tick={{ fontSize: 11, fill: "#9E9E9E" }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: "#9E9E9E" }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: "#fff", border: "1px solid #C8E6C9", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                                                labelStyle={{ fontWeight: 600, color: "#1B1B1B" }}
                                            />
                                            <Legend iconType="circle" iconSize={8} />
                                            <Bar dataKey="Field A" fill="#1B5E20" radius={[4,4,0,0]} />
                                            <Bar dataKey="Field B" fill="#4CAF50" radius={[4,4,0,0]} />
                                            <Bar dataKey="Field C" fill="#8BC34A" radius={[4,4,0,0]} />
                                            <Bar dataKey="Field D" fill="#00BCD4" radius={[4,4,0,0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* ── Alert Timeline ── */}
                {alertTimeline.length > 0 && (
                    <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-md p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            <h3 className="text-lg font-semibold text-[#1B1B1B]">Active Alerts</h3>
                            <span className="text-xs text-white bg-orange-500 px-2 py-0.5 rounded-full font-bold">
                                {alertTimeline.length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {alertTimeline.map((alert, idx) => {
                                const config = sensorConfig[alert.type];
                                const Icon = config?.icon || Activity;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`flex items-center gap-4 p-4 rounded-xl border-l-4 ${
                                            alert.status === "critical"
                                                ? "bg-red-50 border-red-500"
                                                : "bg-orange-50 border-orange-400"
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.status === "critical" ? "bg-red-100" : "bg-orange-100"}`}>
                                            <Icon className={`w-5 h-5 ${alert.status === "critical" ? "text-red-500" : "text-orange-400"}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-[#1B1B1B]">
                                                {alert.field} — <span className="capitalize">{alert.type.replace("_", " ")}</span>
                                            </p>
                                            <p className="text-xs text-[#5F6368]">
                                                Current: <strong>{alert.value}{alert.unit}</strong> · Status: <strong>{alert.status}</strong>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-[#9E9E9E]">
                                            <Clock className="w-3 h-3" />
                                            {alert.time}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* Quick Actions */}
                <motion.div variants={itemVariants} className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-[#F9A825]" />
                        <h3 className="text-lg font-semibold text-[#1B1B1B]">{t("quickActions")}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <QuickActionButton color="#0277BD" gradient="from-[#0277BD] to-[#01579B]" icon={Droplets}    label={t("waterSpray")}     description={t("irrigateAllFields")} onClick={() => toast.success("Water spray started.")} />
                        <QuickActionButton color="#E65100" gradient="from-[#E65100] to-[#BF360C]" icon={Zap}         label={t("pesticideSpray")} description={t("protectCrops")}      onClick={() => toast.success("Pesticide spray started.")} />
                        <QuickActionButton color="#6A1B9A" gradient="from-[#6A1B9A] to-[#4A148C]" icon={FlaskConical} label={t("fertilizerSpray")}description={t("nourishSoil")}       onClick={() => toast.success("Fertilizer spray started.")} />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}

function QuickActionButton({ color, gradient, icon: Icon, label, description, onClick }: {
    color: string; gradient: string; icon: React.ElementType;
    label: string; description: string; onClick: () => void;
}) {
    return (
        <motion.button
            whileHover={{ y: -2, boxShadow: `0 8px 24px ${color}25` }}
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className={`flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r ${gradient} text-white text-left transition-all`}
        >
            <Icon className="w-7 h-7 flex-shrink-0" />
            <div>
                <p className="font-semibold">{label}</p>
                <p className="text-xs text-white/70">{description}</p>
            </div>
        </motion.button>
    );
}
