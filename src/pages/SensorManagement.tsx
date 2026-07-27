import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Thermometer, Droplets, FlaskConical, Wind,
    AlertTriangle, CheckCircle2, WifiOff, X,
    Phone, Mail, MessageCircle, Send, Clock, ChevronDown,
    Wrench, RefreshCw,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useLanguage } from "@/context/LanguageContext";

type IssueType = "damaged" | "offline" | "wrong_readings" | "calibration";
type Urgency = "low" | "medium" | "high" | "critical";
type RequestStatus = "open" | "in_progress" | "resolved";

interface ServiceRequest {
    id: string;
    field: string;
    sensorType: string;
    issueType: IssueType;
    description: string;
    urgency: Urgency;
    status: RequestStatus;
    createdAt: string;
}

const sensorIcons: Record<string, React.ElementType> = {
    temperature: Thermometer,
    soil_moisture: Droplets,
    ph: FlaskConical,
    humidity: Wind,
};

const sensorLabels: Record<string, string> = {
    temperature: "Temperature",
    soil_moisture: "Soil Moisture",
    ph: "pH Level",
    humidity: "Humidity",
};

const statusColors = {
    optimal: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]", dot: "bg-[#4CAF50]" },
    warning: { bg: "bg-[#FFF8E1]", text: "text-[#F9A825]", dot: "bg-[#F9A825]" },
    critical: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]", dot: "bg-[#C62828]" },
};

const urgencyColors: Record<Urgency, string> = {
    low: "bg-[#E8F5E9] text-[#2E7D32]",
    medium: "bg-[#FFF8E1] text-[#F9A825]",
    high: "bg-[#FFF3E0] text-[#EF6C00]",
    critical: "bg-[#FFEBEE] text-[#C62828]",
};

const requestStatusColors: Record<RequestStatus, string> = {
    open: "bg-[#FFF8E1] text-[#F9A825]",
    in_progress: "bg-[#E3F2FD] text-[#0277BD]",
    resolved: "bg-[#E8F5E9] text-[#2E7D32]",
};

const REQUESTS_KEY = "sf_sensor_requests";

export default function SensorManagement() {
    const { data: sensorData } = trpc.sensor.getAll.useQuery(undefined, { refetchInterval: 5000 });
    const { data: issuesData, refetch: refetchIssues } = trpc.sensor.getIssues.useQuery();
    const reportIssueMutation = trpc.sensor.reportIssue.useMutation();

    const [activeTab, setActiveTab] = useState<"sensors" | "requests" | "contact">("sensors");
    const [reportModal, setReportModal] = useState<{ field: string; type: string } | null>(null);
    const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "", sent: false });
    const { t } = useLanguage();

    // Report form state
    const [issueType, setIssueType] = useState<IssueType>("damaged");
    const [urgency, setUrgency] = useState<Urgency>("medium");
    const [description, setDescription] = useState("");

    const handleSubmitRequest = async () => {
        if (!reportModal) return;
        
        try {
            await reportIssueMutation.mutateAsync({
                field: reportModal.field,
                sensorType: reportModal.type,
                issueType,
                urgency,
                description,
            });
            
            refetchIssues();
            setReportModal(null);
            setDescription("");
            setIssueType("damaged");
            setUrgency("medium");
            setActiveTab("requests");
        } catch (e) {
            console.error(e);
        }
    };

    const handleSendContact = () => {
        setContactForm((p) => ({ ...p, sent: true }));
        setTimeout(() => setContactForm({ name: "", phone: "", message: "", sent: false }), 3000);
    };

    return (
        <div className="min-h-screen bg-[#F1F8E9]">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-[#C8E6C9] px-6 py-4">
                <h1 className="text-xl font-bold text-[#1B1B1B]">{t("sensorManagement")}</h1>
                <p className="text-sm text-[#9E9E9E]">{t("monitorSensorHealth")}</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4">
                {([
                    { key: "sensors", label: t("mySensors") },
                    { key: "requests", label: `${t("serviceRequests")} (${issuesData?.length || 0})` },
                    { key: "contact", label: t("contactCompany") },
                ] as const).map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`px-5 py-2.5 rounded-t-xl text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-white text-[#1B5E20] shadow-sm border border-b-0 border-[#C8E6C9]" : "text-[#9E9E9E] hover:text-[#5F6368]"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="px-6 pb-8 bg-white border border-[#C8E6C9] mx-6 rounded-b-xl rounded-tr-xl shadow-sm min-h-[60vh]">

                {/* ─── My Sensors Tab ─── */}
                {activeTab === "sensors" && (
                    <div className="py-4 space-y-6">
                        {sensorData ? Object.entries(sensorData).map(([field, sensors]) => (
                            <div key={field}>
                                <h2 className="text-base font-semibold text-[#1B1B1B] mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#4CAF50]" /> {field}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {Object.entries(sensors).map(([type, sensor]) => {
                                        const Icon = sensorIcons[type] || Thermometer;
                                        const sc = statusColors[sensor.status] ?? statusColors.optimal;
                                        return (
                                            <motion.div key={type} whileHover={{ y: -2 }}
                                                className={`rounded-xl p-4 border ${sc.bg} border-opacity-50 relative`}
                                                style={{ borderColor: sensor.status === "optimal" ? "#C8E6C9" : sensor.status === "warning" ? "#FFE082" : "#FFCDD2" }}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Icon className={`w-4 h-4 ${sc.text}`} />
                                                        <span className="text-xs font-medium text-[#5F6368]">{sensorLabels[type]}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                        {sensor.status}
                                                    </div>
                                                </div>
                                                <p className={`text-2xl font-bold mt-2 ${sc.text}`}>
                                                    {sensor.value.toFixed(1)}<span className="text-sm font-normal ml-0.5">{sensor.unit}</span>
                                                </p>
                                                <button
                                                    onClick={() => setReportModal({ field, type })}
                                                    className="mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border border-[#C62828] text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
                                                >
                                                    <AlertTriangle className="w-3 h-3" /> {t("reportIssue")}
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-12 text-[#9E9E9E]">{t("loading")}</div>
                        )}
                    </div>
                )}

                {/* ─── Service Requests Tab ─── */}
                {activeTab === "requests" && (
                    <div className="py-4 space-y-3">
                        {!issuesData || issuesData.length === 0 ? (
                            <div className="text-center py-16 text-[#9E9E9E]">
                                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-[#C8E6C9]" />
                                <p className="font-medium">{t("noServiceRequests")}</p>
                                <p className="text-sm mt-1">{t("reportFromMySensors")}</p>
                            </div>
                        ) : issuesData.map((req, i) => (
                            <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                className="border border-[#E8F5E9] rounded-xl p-4 bg-[#FAFAFA]">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-sm text-[#1B1B1B]">{req.field} — {sensorLabels[req.sensorType] ?? req.sensorType}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${urgencyColors[req.urgency as Urgency]}`}>{req.urgency}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${requestStatusColors[req.status as RequestStatus]}`}>{req.status.replace("_", " ")}</span>
                                        </div>
                                        <p className="text-xs text-[#5F6368] capitalize mt-0.5">{req.issueType.replace("_", " ")}</p>
                                        {req.description && <p className="text-xs text-[#9E9E9E] mt-1">{req.description}</p>}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-[#9E9E9E] flex-shrink-0">
                                        <Clock className="w-3 h-3" />
                                        {new Date(req.createdAt).toLocaleDateString("en-IN")}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* ─── Contact Company Tab ─── */}
                {activeTab === "contact" && (
                    <div className="py-4 max-w-lg space-y-5">
                        {/* Company Info */}
                        <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] text-white rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                    <Wrench className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">AgriSense Solutions</h3>
                                    <p className="text-white/70 text-sm">Official Sensor Partner</p>
                                </div>
                            </div>
                            <div className="space-y-2 mt-4">
                                <a href="tel:18001234567" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors px-4 py-3 rounded-xl">
                                    <Phone className="w-4 h-4" />
                                    <div>
                                        <p className="text-sm font-semibold">1800-123-4567</p>
                                        <p className="text-xs text-white/60">Toll Free • Mon–Sat 8am–8pm</p>
                                    </div>
                                </a>
                                <a href="https://wa.me/911800123456" target="_blank" rel="noreferrer"
                                    className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors px-4 py-3 rounded-xl">
                                    <MessageCircle className="w-4 h-4" />
                                    <div>
                                        <p className="text-sm font-semibold">WhatsApp Support</p>
                                        <p className="text-xs text-white/60">Quick response within 30 mins</p>
                                    </div>
                                </a>
                                <a href="mailto:support@agrisense.in"
                                    className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors px-4 py-3 rounded-xl">
                                    <Mail className="w-4 h-4" />
                                    <div>
                                        <p className="text-sm font-semibold">support@agrisense.in</p>
                                        <p className="text-xs text-white/60">Response within 24 hours</p>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Send Message Form */}
                        <div className="border border-[#C8E6C9] rounded-2xl p-5 space-y-4">
                            <h3 className="font-semibold text-[#1B1B1B]">{t("sendDetailedMsg")}</h3>
                            <div>
                                <label className="text-xs font-medium text-[#5F6368] block mb-1">{t("yourName")}</label>
                                <input value={contactForm.name} onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                                    className="w-full border border-[#C8E6C9] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4CAF50]" placeholder={t("yourName")} />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[#5F6368] block mb-1">{t("phoneNumber")}</label>
                                <input value={contactForm.phone} onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
                                    className="w-full border border-[#C8E6C9] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4CAF50]" placeholder="+91 XXXXXXXXXX" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[#5F6368] block mb-1">{t("describeIssue")}</label>
                                <textarea value={contactForm.message} onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))} rows={4}
                                    className="w-full border border-[#C8E6C9] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4CAF50] resize-none"
                                    placeholder={t("describeIssue")} />
                            </div>
                            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSendContact}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors ${contactForm.sent ? "bg-[#2E7D32] text-white" : "bg-[#1B5E20] text-white hover:bg-[#2E7D32]"}`}>
                                {contactForm.sent ? <><CheckCircle2 className="w-4 h-4" />{t("messageSent")}</> : <><Send className="w-4 h-4" />{t("sendMessage")}</>}
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>

            {/* Report Issue Modal */}
            <AnimatePresence>
                {reportModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50" onClick={() => setReportModal(null)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-bold text-[#1B1B1B]">{t("reportIssue")}</h2>
                                        <p className="text-xs text-[#9E9E9E] mt-0.5">{reportModal.field} — {sensorLabels[reportModal.type]}</p>
                                    </div>
                                    <button onClick={() => setReportModal(null)} className="p-1.5 hover:bg-[#F1F8E9] rounded-lg"><X className="w-4 h-4" /></button>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[#5F6368] block mb-2">{t("issueType")}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(["damaged", "offline", "wrong_readings", "calibration"] as IssueType[]).map((t) => (
                                            <button key={t} onClick={() => setIssueType(t)}
                                                className={`py-2 px-3 rounded-xl text-xs font-medium capitalize border-2 transition-colors ${issueType === t ? "border-[#C62828] bg-[#FFEBEE] text-[#C62828]" : "border-[#E0E0E0] text-[#5F6368] hover:border-[#C62828]"}`}>
                                                {t.replace("_", " ")}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[#5F6368] block mb-2">{t("urgencyLevel")}</label>
                                    <div className="flex gap-2">
                                        {(["low", "medium", "high", "critical"] as Urgency[]).map((u) => (
                                            <button key={u} onClick={() => setUrgency(u)}
                                                className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize border-2 transition-colors ${urgency === u ? `border-current ${urgencyColors[u]}` : "border-[#E0E0E0] text-[#9E9E9E]"}`}>
                                                {u}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-[#5F6368] block mb-1">{t("descriptionOptional")}</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                                        className="w-full border border-[#C8E6C9] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4CAF50] resize-none"
                                        placeholder={t("describeIssue")} />
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setReportModal(null)} className="flex-1 py-2.5 border border-[#C8E6C9] rounded-xl text-sm font-medium text-[#5F6368]">{t("cancel")}</button>
                                    <button onClick={handleSubmitRequest} className="flex-1 py-2.5 bg-[#C62828] text-white rounded-xl text-sm font-semibold hover:bg-[#B71C1C] transition-colors">
                                        {t("submitRequest")}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
