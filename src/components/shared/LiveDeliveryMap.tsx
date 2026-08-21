import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface LiveDeliveryMapProps {
    deliveries?: any[];
    warehouses?: any[];
    partnerLocation?: { lat: number; lng: number };
    center?: number[];
}

export default function LiveDeliveryMap({
    deliveries = [],
    warehouses = [],
    partnerLocation,
    center = [20.5937, 78.9629],
}: LiveDeliveryMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        import("leaflet").then((L) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
                iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
                shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            });

            const map = L.map(mapRef.current!, {
                center: center as [number, number],
                zoom: 6,
                zoomControl: true,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);

            mapInstanceRef.current = map;

            // Icons
            const warehouseIcon = L.divIcon({
                className: "",
                html: `<div style="background:#6A1B9A;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 12px rgba(106,27,154,0.4);display:flex;align-items:center;justify-content:center;">
                    <div style="transform:rotate(45deg);color:white;font-size:14px;">🏭</div>
                </div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36],
            });

            const deliveryIcon = L.divIcon({
                className: "",
                html: `<div style="background:#2E7D32;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 12px rgba(46,125,50,0.4);display:flex;align-items:center;justify-content:center;">
                    <div style="transform:rotate(45deg);color:white;font-size:14px;">📦</div>
                </div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36],
            });

            const partnerIcon = L.divIcon({
                className: "",
                html: `<div style="background:#01579B;width:42px;height:42px;border-radius:50%;border:3px solid white;box-shadow:0 4px 15px rgba(1,87,155,0.6);display:flex;align-items:center;justify-content:center;animation:pulse 2s infinite;">
                    <span style="font-size:20px;">🚚</span>
                </div>`,
                iconSize: [42, 42],
                iconAnchor: [21, 21],
                popupAnchor: [0, -21],
            });

            const latLngsToFit: [number, number][] = [];

            // Add warehouses
            if (warehouses && warehouses.length > 0) {
                warehouses.forEach((wh) => {
                    if (wh.lat && wh.lng) {
                        L.marker([wh.lat, wh.lng], { icon: warehouseIcon })
                            .bindPopup(`
                                <div style="font-family:sans-serif;min-width:180px;">
                                    <p style="font-weight:700;color:#6A1B9A;font-size:14px;margin:0 0 4px">${wh.name}</p>
                                    <p style="color:#666;font-size:12px;margin:0">${wh.city}, ${wh.state || ""}</p>
                                </div>
                            `)
                            .addTo(map);
                        latLngsToFit.push([wh.lat, wh.lng]);
                    }
                });
            }

            // Live partner location override if available
            if (partnerLocation) {
                L.marker([partnerLocation.lat, partnerLocation.lng], { icon: partnerIcon })
                    .bindPopup(`
                        <div style="font-family:sans-serif;min-width:180px;">
                            <p style="font-weight:700;color:#01579B;font-size:14px;margin:0 0 4px">Delivery Partner (You)</p>
                            <p style="color:#2E7D32;font-size:12px;margin:0 font-weight:600">● Live GPS Active</p>
                        </div>
                    `)
                    .addTo(map);
                latLngsToFit.push([partnerLocation.lat, partnerLocation.lng]);
            }

            // Add active deliveries and polylines
            if (deliveries && deliveries.length > 0) {
                deliveries.forEach((d) => {
                    const points: [number, number][] = [];

                    const pLat = partnerLocation?.lat || d.pickupLat;
                    const pLng = partnerLocation?.lng || d.pickupLng;

                    if (pLat && pLng) {
                        points.push([pLat, pLng]);
                        latLngsToFit.push([pLat, pLng]);
                        if (!partnerLocation) {
                            L.marker([pLat, pLng], { icon: partnerIcon })
                                .bindPopup(`
                                    <div style="font-family:sans-serif;min-width:180px;">
                                        <p style="font-weight:700;color:#01579B;font-size:14px;margin:0 0 4px">Delivery Partner (${d.partnerName || "Assigned Driver"})</p>
                                        <p style="color:#666;font-size:12px;margin:0">Leg ${d.legIndex || 1} of ${d.totalLegs || 1}</p>
                                    </div>
                                `)
                                .addTo(map);
                        }
                    }

                    if (d.deliveryLat && d.deliveryLng) {
                        points.push([d.deliveryLat, d.deliveryLng]);
                        latLngsToFit.push([d.deliveryLat, d.deliveryLng]);
                        L.marker([d.deliveryLat, d.deliveryLng], { icon: deliveryIcon })
                            .bindPopup(`
                                <div style="font-family:sans-serif;min-width:180px;">
                                    <p style="font-weight:700;color:#2E7D32;font-size:14px;margin:0 0 4px">Order #${d.orderNumber || d.orderId}</p>
                                    <p style="color:#666;font-size:12px;margin:0">Destination: ${d.deliveryAddress || "Customer Address"}</p>
                                </div>
                            `)
                            .addTo(map);
                    }

                    if (points.length >= 2) {
                        L.polyline(points, {
                            color: "#01579B",
                            weight: 4,
                            opacity: 0.7,
                            dashArray: "8, 8",
                        }).addTo(map);
                    }
                });
            }

            if (latLngsToFit.length > 0) {
                map.fitBounds(L.latLngBounds(latLngsToFit), { padding: [40, 40], maxZoom: 14 });
            }
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [deliveries, warehouses, partnerLocation, center]);

    return (
        <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-[#E8EDF5] z-0">
            <div ref={mapRef} className="w-full h-full" />
            <div className="absolute top-4 right-4 z-[400] bg-white p-3 rounded-xl shadow-lg border border-[#E8EDF5] space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#01579B]" />
                    <span className="text-xs font-semibold text-[#0D1B2A]">Delivery Partner</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#6A1B9A]" />
                    <span className="text-xs font-semibold text-[#0D1B2A]">Warehouse Hub</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#2E7D32]" />
                    <span className="text-xs font-semibold text-[#0D1B2A]">Customer Destination</span>
                </div>
            </div>
        </div>
    );
}
