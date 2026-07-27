import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Bell, Truck, Thermometer, Settings2 } from "lucide-react";

export default function AdminSettings() {
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        platformName: "KrishiSetu",
        contactEmail: "support@krishisetu.in",
        contactPhone: "+91 98765 43210",
        expressDeliveryFee: 30,
        standardDeliveryFee: 15,
        platformFee: 5,
        tempWarning: 35,
        tempCritical: 40,
        moistureWarning: 30,
        moistureCritical: 15,
        phWarning: 5.5,
        phCritical: 5.0,
        emailNotifications: true,
        smsNotifications: true,
        sensorAlerts: true,
        orderAlerts: true,
    });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const Section = ({ title, icon: Icon, color, children }: { title: string; icon: React.ElementType; color: string; children: React.ReactNode }) => (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#F1F8E9]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <h3 className="text-sm font-semibold text-[#1B1B1B]">{title}</h3>
            </div>
            {children}
        </motion.div>
    );

    const Field = ({ label, value, type = "text", onChange }: { label: string; value: string | number | boolean; type?: string; onChange: (v: string) => void }) => (
        <div className="flex items-center justify-between">
            <label className="text-sm text-[#5F6368]">{label}</label>
            {type === "toggle" ? (
                <button
                    onClick={() => onChange(String(!value))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-[#1B5E20]" : "bg-[#E0E0E0]"}`}
                >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? "left-6" : "left-1"}`} />
                </button>
            ) : (
                <input
                    type={type}
                    value={value as string | number}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-40 border border-[#C8E6C9] rounded-lg px-3 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-[#4CAF50]"
                />
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1B1B1B]">Settings</h1>
                    <p className="text-sm text-[#5F6368]">Configure platform-wide settings</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${saved ? "bg-[#2E7D32] text-white" : "bg-[#1B5E20] text-white hover:bg-[#2E7D32]"}`}
                >
                    <Save className="w-4 h-4" />
                    {saved ? "Saved!" : "Save Changes"}
                </motion.button>
            </div>

            <Section title="Platform Information" icon={Settings2} color="#1B5E20">
                <Field label="Platform Name" value={settings.platformName} onChange={(v) => setSettings((s) => ({ ...s, platformName: v }))} />
                <Field label="Contact Email" value={settings.contactEmail} onChange={(v) => setSettings((s) => ({ ...s, contactEmail: v }))} />
                <Field label="Support Phone" value={settings.contactPhone} onChange={(v) => setSettings((s) => ({ ...s, contactPhone: v }))} />
            </Section>

            <Section title="Delivery Fees (₹)" icon={Truck} color="#0277BD">
                <Field label="Express Delivery" value={settings.expressDeliveryFee} type="number" onChange={(v) => setSettings((s) => ({ ...s, expressDeliveryFee: Number(v) }))} />
                <Field label="Standard Delivery" value={settings.standardDeliveryFee} type="number" onChange={(v) => setSettings((s) => ({ ...s, standardDeliveryFee: Number(v) }))} />
                <Field label="Platform Fee" value={settings.platformFee} type="number" onChange={(v) => setSettings((s) => ({ ...s, platformFee: Number(v) }))} />
            </Section>

            <Section title="Sensor Alert Thresholds" icon={Thermometer} color="#EF6C00">
                <Field label="Temperature Warning (°C)" value={settings.tempWarning} type="number" onChange={(v) => setSettings((s) => ({ ...s, tempWarning: Number(v) }))} />
                <Field label="Temperature Critical (°C)" value={settings.tempCritical} type="number" onChange={(v) => setSettings((s) => ({ ...s, tempCritical: Number(v) }))} />
                <Field label="Soil Moisture Warning (%)" value={settings.moistureWarning} type="number" onChange={(v) => setSettings((s) => ({ ...s, moistureWarning: Number(v) }))} />
                <Field label="Soil Moisture Critical (%)" value={settings.moistureCritical} type="number" onChange={(v) => setSettings((s) => ({ ...s, moistureCritical: Number(v) }))} />
                <Field label="pH Warning" value={settings.phWarning} type="number" onChange={(v) => setSettings((s) => ({ ...s, phWarning: Number(v) }))} />
                <Field label="pH Critical" value={settings.phCritical} type="number" onChange={(v) => setSettings((s) => ({ ...s, phCritical: Number(v) }))} />
            </Section>

            <Section title="Notifications" icon={Bell} color="#6A1B9A">
                <Field label="Email Notifications" value={settings.emailNotifications} type="toggle" onChange={(v) => setSettings((s) => ({ ...s, emailNotifications: v === "true" }))} />
                <Field label="SMS Notifications" value={settings.smsNotifications} type="toggle" onChange={(v) => setSettings((s) => ({ ...s, smsNotifications: v === "true" }))} />
                <Field label="Sensor Alerts" value={settings.sensorAlerts} type="toggle" onChange={(v) => setSettings((s) => ({ ...s, sensorAlerts: v === "true" }))} />
                <Field label="Order Alerts" value={settings.orderAlerts} type="toggle" onChange={(v) => setSettings((s) => ({ ...s, orderAlerts: v === "true" }))} />
            </Section>

        </div>
    );
}
