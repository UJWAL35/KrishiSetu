import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Sprout, MapPin, Image as ImageIcon } from "lucide-react";
import { AUTH_KEY } from "./Login";

export default function ProfileSetup() {
    const navigate = useNavigate();
    const { data: user, isLoading: isUserLoading } = trpc.auth.me.useQuery();
    const completeProfile = trpc.farmer.completeProfile.useMutation();

    const [farmName, setFarmName] = useState("");
    const [farmAddress, setFarmAddress] = useState("");
    const [farmSize, setFarmSize] = useState("");
    const [soilType, setSoilType] = useState("");
    const [isOrganic, setIsOrganic] = useState(false);
    
    // GPS Simulation
    const [lat, setLat] = useState<number | "">("");
    const [lng, setLng] = useState<number | "">("");

    if (isUserLoading) return <div className="min-h-screen bg-[#F1F8E9] flex items-center justify-center"><div className="w-8 h-8 animate-spin border-4 border-[#4CAF50] border-t-transparent rounded-full" /></div>;

    if (!user || user.role !== "farmer") {
        navigate("/login");
        return null;
    }

    if (user.isProfileComplete) {
        navigate("/farmer/dashboard");
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!farmName || !farmAddress) return;

        try {
            await completeProfile.mutateAsync({
                farmName,
                farmAddress,
                farmSize,
                soilType,
                isOrganic,
                lat: Number(lat) || 0,
                lng: Number(lng) || 0,
            });
            // Update auth state in app logic or just redirect
            navigate("/farmer/dashboard");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F8E9] py-12 px-4 sm:px-6 lg:px-8 flex justify-center">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-[#E8F5E9] text-[#2E7D32] rounded-full flex items-center justify-center mb-4">
                        <Sprout className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-[#1B1B1B]">Complete Your Profile</h2>
                    <p className="text-sm text-[#5F6368] mt-1">Set up your farm details to get started.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#1B1B1B] mb-1">Farm Name *</label>
                        <input
                            required
                            type="text"
                            value={farmName}
                            onChange={e => setFarmName(e.target.value)}
                            className="w-full px-4 py-2 border border-[#C8E6C9] rounded-xl focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] outline-none"
                            placeholder="Green Acres"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-[#1B1B1B] mb-1">Farm Address *</label>
                        <input
                            required
                            type="text"
                            value={farmAddress}
                            onChange={e => setFarmAddress(e.target.value)}
                            className="w-full px-4 py-2 border border-[#C8E6C9] rounded-xl focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] outline-none"
                            placeholder="123 Village Road"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#1B1B1B] mb-1">Farm Size</label>
                            <input
                                type="text"
                                value={farmSize}
                                onChange={e => setFarmSize(e.target.value)}
                                className="w-full px-4 py-2 border border-[#C8E6C9] rounded-xl focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] outline-none"
                                placeholder="e.g. 5 Acres"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#1B1B1B] mb-1">Soil Type</label>
                            <input
                                type="text"
                                value={soilType}
                                onChange={e => setSoilType(e.target.value)}
                                className="w-full px-4 py-2 border border-[#C8E6C9] rounded-xl focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] outline-none"
                                placeholder="e.g. Loamy"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            id="organic"
                            checked={isOrganic}
                            onChange={e => setIsOrganic(e.target.checked)}
                            className="w-4 h-4 text-[#2E7D32] rounded border-[#C8E6C9]"
                        />
                        <label htmlFor="organic" className="text-sm text-[#1B1B1B]">100% Organic Farming</label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#1B1B1B] mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                value={lat}
                                onChange={e => setLat(e.target.value ? Number(e.target.value) : "")}
                                className="w-full px-4 py-2 border border-[#C8E6C9] rounded-xl focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] outline-none"
                                placeholder="19.076"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#1B1B1B] mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                value={lng}
                                onChange={e => setLng(e.target.value ? Number(e.target.value) : "")}
                                className="w-full px-4 py-2 border border-[#C8E6C9] rounded-xl focus:ring-2 focus:ring-[#4CAF50]/20 focus:border-[#4CAF50] outline-none"
                                placeholder="72.877"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 border border-[#C8E6C9] rounded-xl text-[#5F6368] hover:bg-[#F1F8E9] hover:text-[#2E7D32] transition-colors"
                        onClick={() => {
                            setLat(19.076);
                            setLng(72.877);
                        }}
                    >
                        <MapPin className="w-4 h-4" />
                        Detect Current Location
                    </button>

                    <button
                        type="submit"
                        disabled={completeProfile.isPending}
                        className="w-full py-3 bg-[#1B5E20] text-white rounded-xl font-semibold hover:bg-[#2E7D32] transition-colors disabled:opacity-50 mt-6"
                    >
                        {completeProfile.isPending ? "Saving..." : "Complete Setup"}
                    </button>
                </form>
            </div>
        </div>
    );
}
