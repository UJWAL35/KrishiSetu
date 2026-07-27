import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Star, MapPin, CheckCircle, XCircle, Filter, Users, Leaf, BadgeCheck } from "lucide-react";
import { trpc } from "@/providers/trpc";

export default function AdminFarmers() {
    const { data: farmers } = trpc.farmer.list.useQuery({});
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "verified" | "organic">("all");

    const filtered = (farmers ?? []).filter((f) => {
        const matchesSearch =
            f.name.toLowerCase().includes(search.toLowerCase()) ||
            f.farmName.toLowerCase().includes(search.toLowerCase()) ||
            f.location.toLowerCase().includes(search.toLowerCase());
        if (filter === "verified") return matchesSearch && f.isVerified;
        if (filter === "organic") return matchesSearch && f.isOrganic;
        return matchesSearch;
    });

    const stats = [
        { label: "Total Farmers", value: farmers?.length ?? 0, icon: Users, color: "#1B5E20" },
        { label: "Verified", value: farmers?.filter((f) => f.isVerified).length ?? 0, icon: BadgeCheck, color: "#0277BD" },
        { label: "Organic", value: farmers?.filter((f) => f.isOrganic).length ?? 0, icon: Leaf, color: "#2E7D32" },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1B1B1B]">Farmers</h1>
                <p className="text-sm text-[#5F6368]">Manage all registered farmers on the platform</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                                <Icon className="w-5 h-5" style={{ color: s.color }} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-[#1B1B1B]">{s.value}</p>
                                <p className="text-xs text-[#9E9E9E]">{s.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center bg-white rounded-xl px-4 py-2.5 shadow-sm border border-[#C8E6C9]">
                    <Search className="w-4 h-4 text-[#9E9E9E] mr-2" />
                    <input
                        type="text"
                        placeholder="Search farmers, farms, locations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#5F6368]" />
                    {(["all", "verified", "organic"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? "bg-[#1B5E20] text-white" : "bg-white text-[#5F6368] border border-[#C8E6C9] hover:border-[#4CAF50]"}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Farmers Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-[#F1F8E9] text-xs text-[#9E9E9E] uppercase">
                                <th className="px-4 py-3 text-left font-medium">Farmer</th>
                                <th className="px-4 py-3 text-left font-medium">Farm</th>
                                <th className="px-4 py-3 text-left font-medium">Location</th>
                                <th className="px-4 py-3 text-left font-medium">Crops</th>
                                <th className="px-4 py-3 text-left font-medium">Rating</th>
                                <th className="px-4 py-3 text-left font-medium">Status</th>
                                <th className="px-4 py-3 text-left font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((farmer, i) => (
                                <motion.tr
                                    key={farmer.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    className="border-b border-[#F1F8E9] hover:bg-[#FAFAFA] transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={farmer.avatar} alt={farmer.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-[#1B1B1B]">{farmer.name}</p>
                                                <p className="text-xs text-[#9E9E9E]">ID #{farmer.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-sm text-[#1B1B1B]">{farmer.farmName}</p>
                                        {farmer.isOrganic && (
                                            <span className="text-[10px] bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full">Organic</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-sm text-[#5F6368]">
                                            <MapPin className="w-3.5 h-3.5 text-[#C62828]" />
                                            {farmer.location}
                                        </div>
                                        <p className="text-xs text-[#9E9E9E]">{farmer.distance} km from city</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {farmer.crops.map((c) => (
                                                <span key={c} className="text-[10px] bg-[#F1F8E9] text-[#1B5E20] px-2 py-0.5 rounded-full border border-[#C8E6C9]">{c}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 text-[#F9A825] fill-[#F9A825]" />
                                            <span className="text-sm font-medium">{farmer.rating}</span>
                                            <span className="text-xs text-[#9E9E9E]">({farmer.reviewCount})</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {farmer.isVerified ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-[#2E7D32] bg-[#E8F5E9] px-2 py-1 rounded-full w-fit">
                                                <CheckCircle className="w-3 h-3" /> Verified
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs font-medium text-[#F9A825] bg-[#FFF8E1] px-2 py-1 rounded-full w-fit">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button className="text-xs px-3 py-1.5 bg-[#E8F5E9] text-[#1B5E20] rounded-lg hover:bg-[#C8E6C9] transition-colors font-medium">
                                                View
                                            </button>
                                            <button className="text-xs px-3 py-1.5 bg-[#FFEBEE] text-[#C62828] rounded-lg hover:bg-[#FFCDD2] transition-colors font-medium">
                                                Suspend
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-[#9E9E9E]">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No farmers found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
