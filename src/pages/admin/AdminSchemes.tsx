import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, ExternalLink, FileText, Calendar, Tag, AlertCircle } from "lucide-react";
import { trpc } from "@/providers/trpc";

const categoryColors: Record<string, { bg: string; text: string }> = {
    financial: { bg: "bg-[#E8F5E9]", text: "text-[#1B5E20]" },
    equipment: { bg: "bg-[#F3E5F5]", text: "text-[#6A1B9A]" },
    insurance: { bg: "bg-[#FFF3E0]", text: "text-[#EF6C00]" },
    training: { bg: "bg-[#E3F2FD]", text: "text-[#0277BD]" },
    subsidy: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]" },
};

export default function AdminSchemes() {
    const { data: schemes } = trpc.scheme.list.useQuery({});
    const [activeTab, setActiveTab] = useState<"active" | "all">("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);

    const now = new Date();
    const displayed = (schemes ?? []).filter((s) => {
        if (activeTab === "active") return new Date(s.deadline) >= now;
        return true;
    });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1B1B1B]">Government Schemes</h1>
                    <p className="text-sm text-[#5F6368]">Manage agricultural schemes available on the platform</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1B5E20] text-white rounded-xl text-sm font-medium hover:bg-[#2E7D32] transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Scheme
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {(["all", "active"] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-[#1B5E20] text-white" : "bg-white text-[#5F6368] border border-[#C8E6C9]"}`}>
                        {tab === "all" ? `All (${schemes?.length ?? 0})` : `Active`}
                    </button>
                ))}
            </div>

            {/* Schemes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayed.map((scheme, i) => {
                    const col = categoryColors[scheme.category] ?? { bg: "bg-[#F1F8E9]", text: "text-[#1B5E20]" };
                    const expired = new Date(scheme.deadline) < now;
                    return (
                        <motion.div key={scheme.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-xl shadow-sm border border-[#E8F5E9] overflow-hidden hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3 p-4">
                                <div className="w-10 h-10 rounded-lg flex-shrink-0" style={{ backgroundColor: `${scheme.color}20` }}>
                                    <div className="w-full h-full rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5" style={{ color: scheme.color }} />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-semibold text-sm text-[#1B1B1B]">{scheme.title}</h3>
                                            {scheme.isNew && <span className="text-[10px] bg-[#E8F5E9] text-[#1B5E20] px-2 py-0.5 rounded-full font-medium">NEW</span>}
                                        </div>
                                        {expired
                                            ? <span className="text-[10px] bg-[#FFEBEE] text-[#C62828] px-2 py-1 rounded-full whitespace-nowrap">Expired</span>
                                            : <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-2 py-1 rounded-full whitespace-nowrap">Active</span>}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${col.bg} ${col.text}`}>{scheme.category}</span>
                                        <span className="flex items-center gap-1 text-[10px] text-[#9E9E9E]"><Tag className="w-3 h-3" />{scheme.benefit}</span>
                                        <span className="flex items-center gap-1 text-[10px] text-[#9E9E9E]"><Calendar className="w-3 h-3" />Deadline: {scheme.deadline}</span>
                                    </div>
                                    <p className="text-xs text-[#5F6368] mt-2 line-clamp-2">{scheme.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-3 border-t border-[#F1F8E9] bg-[#FAFAFA]">
                                <a href={scheme.applicationLink} target="_blank" rel="noreferrer"
                                    className="flex items-center gap-1 text-xs text-[#0277BD] hover:underline">
                                    <ExternalLink className="w-3 h-3" /> Apply Link
                                </a>
                                <span className="text-[#E0E0E0]">·</span>
                                <span className="text-xs text-[#9E9E9E]">{scheme.documents.length} docs required</span>
                                <div className="ml-auto flex gap-2">
                                    <button className="text-xs px-3 py-1 bg-[#E8F5E9] text-[#1B5E20] rounded-lg hover:bg-[#C8E6C9] transition-colors">Edit</button>
                                    <button className="text-xs px-3 py-1 bg-[#FFEBEE] text-[#C62828] rounded-lg hover:bg-[#FFCDD2] transition-colors">Remove</button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Add Scheme Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 z-50" onClick={() => setShowAddModal(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-[#1B1B1B]">Add New Scheme</h2>
                                    <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-[#F1F8E9] rounded-lg"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="space-y-3">
                                    {["Title", "Benefit", "Eligibility", "Deadline", "Application Link"].map((field) => (
                                        <div key={field}>
                                            <label className="text-xs font-medium text-[#5F6368] block mb-1">{field}</label>
                                            <input type={field === "Deadline" ? "date" : "text"}
                                                className="w-full border border-[#C8E6C9] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4CAF50]" />
                                        </div>
                                    ))}
                                    <div>
                                        <label className="text-xs font-medium text-[#5F6368] block mb-1">Category</label>
                                        <select className="w-full border border-[#C8E6C9] rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#4CAF50]">
                                            {["financial", "equipment", "insurance", "training", "subsidy"].map((c) => (
                                                <option key={c} value={c} className="capitalize">{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-[#C8E6C9] rounded-xl text-sm font-medium text-[#5F6368] hover:bg-[#F1F8E9]">Cancel</button>
                                    <button className="flex-1 py-2.5 bg-[#1B5E20] text-white rounded-xl text-sm font-medium hover:bg-[#2E7D32]">Add Scheme</button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
