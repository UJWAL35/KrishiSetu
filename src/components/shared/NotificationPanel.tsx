import { useEffect, useRef } from "react";
import { X, Bell, Package, AlertTriangle, Info, Truck } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

interface NotificationPanelProps {
    onClose: () => void;
}

const typeConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    scheme: { color: "#7B1FA2", icon: Bell, label: "Scheme" },
    order: { color: "#1B5E20", icon: Package, label: "Order" },
    delivery: { color: "#01579B", icon: Truck, label: "Delivery" },
    system: { color: "#E65100", icon: Info, label: "System" },
    sensor_alert: { color: "#EF6C00", icon: AlertTriangle, label: "Alert" },
    general: { color: "#00BCD4", icon: Info, label: "Info" },
};

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const utils = trpc.useUtils();

    const { user } = useAuth();
    const userId = user?.id;

    const { data: notifications } = trpc.notification.list.useQuery(
        userId ? { userId } : {}
    );
    const markRead = trpc.notification.markAsRead.useMutation({
        onSuccess: () => utils.notification.invalidate(),
    });
    const markAllRead = trpc.notification.markAllRead.useMutation({
        onSuccess: () => utils.notification.invalidate(),
    });

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={panelRef}
            className="absolute right-4 top-16 w-96 max-h-[480px] bg-white rounded-xl shadow-2xl border border-[#C8E6C9] overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#C8E6C9]">
                <h3 className="font-semibold text-[#1B1B1B]">Notifications</h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => markAllRead.mutate(userId ? { userId } : {})}
                        className="text-xs text-[#1B5E20] hover:underline"
                    >
                        Mark all read
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[#F1F8E9] rounded-full transition-colors"
                    >
                        <X className="w-4 h-4 text-[#5F6368]" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[400px]">
                {notifications?.length === 0 && (
                    <div className="p-8 text-center text-[#9E9E9E]">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                    </div>
                )}
                {notifications?.map((notif) => {
                    const config = typeConfig[notif.type] || typeConfig.general;
                    const Icon = config.icon;
                    return (
                        <div
                            key={notif.id}
                            onClick={() => !notif.isRead && markRead.mutate({ id: notif.id })}
                            className={`flex gap-3 p-3 border-l-4 cursor-pointer hover:bg-[#F1F8E9] transition-colors ${notif.isRead ? "bg-white" : "bg-[#E8F5E9]"
                                }`}
                            style={{ borderLeftColor: config.color }}
                        >
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                style={{ backgroundColor: `${config.color}15` }}
                            >
                                <Icon className="w-4 h-4" style={{ color: config.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm ${notif.isRead ? "text-[#5F6368]" : "text-[#1B1B1B] font-medium"}`}>
                                    {notif.title}
                                </p>
                                <p className="text-xs text-[#9E9E9E] mt-0.5 line-clamp-3">{notif.message}</p>
                                <p className="text-[10px] text-[#9E9E9E] mt-1">
                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                            {!notif.isRead && (
                                <div className="w-2 h-2 rounded-full bg-[#1B5E20] flex-shrink-0 mt-2" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
