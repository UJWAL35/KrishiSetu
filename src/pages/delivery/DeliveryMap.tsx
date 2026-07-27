import { useEffect, useState } from "react";
import { trpc } from "@/providers/trpc";
import LiveDeliveryMap from "@/components/shared/LiveDeliveryMap";
import { Navigation, RefreshCw, Truck } from "lucide-react";

export default function DeliveryMap() {
    const { data: warehouses } = trpc.delivery.getWarehouses.useQuery();
    const { data: myDeliveries, refetch } = trpc.delivery.myDeliveries.useQuery();
    const updateLocationMutation = trpc.delivery.updatePartnerLocation.useMutation();

    const [partnerLoc, setPartnerLoc] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setPartnerLoc(loc);
                    updateLocationMutation.mutate({ lat: loc.lat, lng: loc.lng });
                },
                (err) => console.log("Geolocation watch error", err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    const activeDeliveries = myDeliveries?.filter((d) =>
        ["assigned", "picked_up", "at_warehouse", "out_for_delivery"].includes(d.status)
    ) || [];

    return (
        <div className="p-4 lg:p-8 space-y-6 bg-[#F0F7FF] min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D1B2A]">Live Delivery Map</h1>
                    <p className="text-sm text-[#5F6368]">Real-time tracking for active delivery legs & warehouses</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#01579B] rounded-xl shadow-sm border border-[#E8EDF5] hover:bg-[#E3F2FD] transition-colors text-sm font-medium"
                >
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#E8EDF5] space-y-4">
                <div className="flex items-center justify-between text-xs text-[#5F6368] px-2">
                    <span className="flex items-center gap-1.5 font-semibold text-[#01579B]">
                        <Truck className="w-4 h-4" /> Active Legs: {activeDeliveries.length}
                    </span>
                    {partnerLoc && (
                        <span className="flex items-center gap-1 text-[#2E7D32]">
                            <Navigation className="w-3.5 h-3.5 animate-pulse" /> Live Location Active ({partnerLoc.lat.toFixed(4)}, {partnerLoc.lng.toFixed(4)})
                        </span>
                    )}
                </div>

                <LiveDeliveryMap
                    deliveries={activeDeliveries}
                    warehouses={warehouses || []}
                    partnerLocation={partnerLoc || undefined}
                />
            </div>
        </div>
    );
}
