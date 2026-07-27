import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Edit3,
    Trash2,
    Wheat,
    Camera,
    Upload,
    X,
    CheckCircle2,
    Package,
    Tag,
    Scale,
    Calendar,
    FileText,
    Leaf,
    ShoppingBag,
    AlertTriangle,
    Image as ImageIcon,
    ChevronDown,
    ToggleLeft,
    ToggleRight,
    Mic,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";
import VoiceAssistantModal from "../components/shared/VoiceAssistantModal";

type Category = "grains" | "vegetables" | "fruits" | "pulses" | "others";
type Unit = "kg" | "gram" | "quintal" | "dozen" | "litre" | "piece";

interface CropForm {
    name: string;
    category: Category;
    variety: string;
    price: string;
    unit: Unit;
    stock: string;
    isOrganic: boolean;
    isAvailable: boolean;
    harvestDate: string;
    description: string;
    image: string; // base64 or URL
}

const defaultForm: CropForm = {
    name: "",
    category: "vegetables",
    variety: "",
    price: "",
    unit: "kg",
    stock: "",
    isOrganic: false,
    isAvailable: true,
    harvestDate: "",
    description: "",
    image: "",
};

const categoryOptions: { value: Category; label: string; emoji: string }[] = [
    { value: "vegetables", label: "Vegetables", emoji: "🥦" },
    { value: "fruits",     label: "Fruits",     emoji: "🍎" },
    { value: "grains",     label: "Grains",     emoji: "🌾" },
    { value: "pulses",     label: "Pulses",     emoji: "🫘" },
    { value: "others",     label: "Others",     emoji: "🌿" },
];

const unitOptions: Unit[] = ["kg", "gram", "quintal", "dozen", "litre", "piece"];

const categoryColors: Record<Category, string> = {
    vegetables: "#2E7D32",
    fruits:     "#E65100",
    grains:     "#F9A825",
    pulses:     "#4527A0",
    others:     "#00695C",
};

export default function CropManagement() {
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<CropForm>(defaultForm);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showVoiceModal, setShowVoiceModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const { data: userCrops, refetch, isLoading } = trpc.crop.myCrops.useQuery();
    const createCrop = trpc.crop.create.useMutation();
    const updateCrop = trpc.crop.update.useMutation();
    const deleteCrop = trpc.crop.delete.useMutation();

    const openAddForm = () => {
        setEditingId(null);
        setFormData(defaultForm);
        setImagePreview("");
        setShowForm(true);
    };

    const openEditForm = (crop: any) => {
        setEditingId(crop.id);
        setFormData({
            name: crop.name || "",
            category: crop.category || "vegetables",
            variety: crop.variety || "",
            price: crop.price?.toString() || "",
            unit: (crop.unit as Unit) || "kg",
            stock: crop.stock?.toString() || "",
            isOrganic: crop.isOrganic || false,
            isAvailable: crop.isAvailable !== false,
            harvestDate: crop.harvestDate
                ? new Date(crop.harvestDate).toISOString().split("T")[0]
                : "",
            description: crop.description || "",
            image: crop.image || "",
        });
        setImagePreview(crop.image || "");
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(defaultForm);
        setImagePreview("");
    };

    const handleImageFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be under 10MB.");
            return;
        }
        setIsUploadingImage(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Compress: max 800px wide/tall, 80% JPEG quality
                const MAX = 800;
                let w = img.width;
                let h = img.height;
                if (w > MAX || h > MAX) {
                    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                    else       { w = Math.round(w * MAX / h); h = MAX; }
                }
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d")!;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL("image/jpeg", 0.8);
                setImagePreview(compressed);
                setFormData((prev) => ({ ...prev, image: compressed }));
                setIsUploadingImage(false);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleVoiceComplete = async (extractedData: any, img: string) => {
        try {
            // Ensure category is a valid enum value
            const validCategories = ["grains", "vegetables", "fruits", "pulses", "others"];
            let safeCategory = (extractedData.category || "").toLowerCase();
            if (!validCategories.includes(safeCategory)) {
                safeCategory = "others";
            }

            await createCrop.mutateAsync({
                name: extractedData.name || "Unknown Crop",
                category: safeCategory as any,
                variety: extractedData.variety || undefined,
                price: Number(extractedData.price) || 0,
                unit: extractedData.unit || "kg",
                stock: Number(extractedData.stock) || 0,
                image: img || undefined,
                isOrganic: extractedData.isOrganic || false,
                isAvailable: true,
            });
            toast.success("Crop added via Voice Assistant!");
            setShowVoiceModal(false);
            refetch();
        } catch (err: any) {
            toast.error(err.message || "Failed to save crop.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) { toast.error("Please enter a crop name."); return; }
        if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
            toast.error("Please enter a valid price."); return;
        }
        if (!formData.stock || isNaN(Number(formData.stock)) || Number(formData.stock) < 0) {
            toast.error("Please enter a valid stock quantity."); return;
        }

        try {
            if (editingId !== null) {
                await updateCrop.mutateAsync({
                    id: editingId,
                    name: formData.name.trim(),
                    category: formData.category,
                    variety: formData.variety.trim() || undefined,
                    price: Number(formData.price),
                    unit: formData.unit,
                    stock: Number(formData.stock),
                    image: formData.image || undefined,
                    isOrganic: formData.isOrganic,
                    isAvailable: formData.isAvailable,
                    harvestDate: formData.harvestDate || undefined,
                    description: formData.description.trim() || undefined,
                });
                toast.success("Crop updated successfully!");
            } else {
                await createCrop.mutateAsync({
                    name: formData.name.trim(),
                    category: formData.category,
                    variety: formData.variety.trim() || undefined,
                    price: Number(formData.price),
                    unit: formData.unit,
                    stock: Number(formData.stock),
                    image: formData.image || undefined,
                    isOrganic: formData.isOrganic,
                    isAvailable: formData.isAvailable,
                    harvestDate: formData.harvestDate || undefined,
                    description: formData.description.trim() || undefined,
                });
                toast.success("Crop added to marketplace!");
            }
            closeForm();
            refetch();
        } catch (err: any) {
            toast.error(err.message || "Failed to save crop.");
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteCrop.mutateAsync({ id });
            toast.success("Crop removed from marketplace.");
            setDeleteConfirmId(null);
            refetch();
        } catch (err: any) {
            toast.error(err.message || "Failed to delete crop.");
        }
    };

    const isSaving = createCrop.isPending || updateCrop.isPending;
    const isDeleting = deleteCrop.isPending;

    return (
        <div className="min-h-screen bg-[#F1F8E9] p-4 lg:p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#1B1B1B]">My Crops</h1>
                        <p className="text-sm text-[#5F6368] mt-1">
                            Manage your produce listed in the marketplace
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowVoiceModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#1B5E20] border-2 border-[#1B5E20] rounded-xl shadow-md hover:shadow-lg hover:bg-[#F8FBF8] transition-all font-semibold text-sm"
                        >
                            <Mic className="w-4 h-4" /> <span className="hidden sm:inline">Add with Voice</span>
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={openAddForm}
                            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white rounded-xl shadow-lg shadow-green-900/20 hover:shadow-xl transition-all font-semibold text-sm"
                        >
                            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Manually</span>
                        </motion.button>
                    </div>
                </div>

                {/* Stats bar */}
                {userCrops && userCrops.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E8F5E9] text-center">
                            <p className="text-xl font-bold text-[#1B5E20]">{userCrops.length}</p>
                            <p className="text-xs text-[#9E9E9E]">Total Crops</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E8F5E9] text-center">
                            <p className="text-xl font-bold text-[#4CAF50]">{userCrops.filter(c => c.isAvailable).length}</p>
                            <p className="text-xs text-[#9E9E9E]">Available</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E8F5E9] text-center">
                            <p className="text-xl font-bold text-[#2E7D32]">{userCrops.filter(c => c.isOrganic).length}</p>
                            <p className="text-xs text-[#9E9E9E]">Organic</p>
                        </div>
                    </div>
                )}

                {/* ADD / EDIT FORM */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.98 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl shadow-xl border border-[#E8F5E9] overflow-hidden"
                        >
                            {/* Form header */}
                            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1B5E20] to-[#2E7D32]">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                        {editingId ? <Edit3 className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                                    </div>
                                    <h2 className="text-white font-semibold">
                                        {editingId ? "Edit Crop Details" : "Add New Crop"}
                                    </h2>
                                </div>
                                <button onClick={closeForm} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* ── LEFT: Image Upload ── */}
                                    <div className="lg:col-span-1">
                                        <label className="text-xs font-semibold text-[#5F6368] uppercase tracking-wide mb-2 block">
                                            Crop Photo
                                        </label>
                                        {/* Clickable + drag-and-drop zone */}
                                        <div
                                            className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden cursor-pointer ${
                                                imagePreview ? "border-[#4CAF50]" : "border-[#C8E6C9] hover:border-[#4CAF50] hover:bg-[#F1F8E9]"
                                            }`}
                                            style={{ aspectRatio: "4/3" }}
                                            onClick={() => !imagePreview && fileInputRef.current?.click()}
                                            onDragOver={(e) => { e.preventDefault(); }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const f = e.dataTransfer.files?.[0];
                                                if (f) handleImageFile(f);
                                            }}
                                        >
                                            {imagePreview ? (
                                                <>
                                                    <img
                                                        src={imagePreview}
                                                        alt="Crop preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setImagePreview(""); setFormData(p => ({ ...p, image: "" })); }}
                                                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                    <div className="absolute bottom-2 left-2 bg-[#4CAF50] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Photo Added
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#F8FBF8]">
                                                    {isUploadingImage ? (
                                                        <div className="w-8 h-8 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <>
                                                            <ImageIcon className="w-10 h-10 text-[#C8E6C9]" />
                                                            <p className="text-xs text-[#9E9E9E] text-center px-4 leading-relaxed">
                                                                <span className="font-semibold text-[#4CAF50]">Click here</span> to upload<br />
                                                                or drag & drop a photo
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Photo buttons */}
                                        <div className="flex gap-2 mt-3">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => cameraInputRef.current?.click()}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1B5E20] text-white rounded-xl text-xs font-semibold shadow-md hover:bg-[#2E7D32] transition-colors"
                                            >
                                                <Camera className="w-4 h-4" />
                                                Camera
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] rounded-xl text-xs font-semibold hover:bg-[#C8E6C9] transition-colors"
                                            >
                                                <Upload className="w-4 h-4" />
                                                Gallery
                                            </motion.button>
                                        </div>

                                        {/* Hidden file inputs */}
                                        <input
                                            ref={cameraInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                                        />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
                                        />

                                        {/* Availability toggle */}
                                        <div className="mt-4 flex items-center justify-between p-3 bg-[#F8FBF8] rounded-xl border border-[#E8F5E9]">
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag className="w-4 h-4 text-[#5F6368]" />
                                                <span className="text-sm font-medium text-[#1B1B1B]">Available for Sale</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, isAvailable: !p.isAvailable }))}
                                                className="transition-colors"
                                            >
                                                {formData.isAvailable
                                                    ? <ToggleRight className="w-8 h-8 text-[#4CAF50]" />
                                                    : <ToggleLeft className="w-8 h-8 text-[#9E9E9E]" />
                                                }
                                            </button>
                                        </div>

                                        {/* Organic toggle */}
                                        <div className="mt-2 flex items-center justify-between p-3 bg-[#F8FBF8] rounded-xl border border-[#E8F5E9]">
                                            <div className="flex items-center gap-2">
                                                <Leaf className="w-4 h-4 text-[#5F6368]" />
                                                <span className="text-sm font-medium text-[#1B1B1B]">Organic Certified</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, isOrganic: !p.isOrganic }))}
                                                className="transition-colors"
                                            >
                                                {formData.isOrganic
                                                    ? <ToggleRight className="w-8 h-8 text-[#4CAF50]" />
                                                    : <ToggleLeft className="w-8 h-8 text-[#9E9E9E]" />
                                                }
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── RIGHT: Details ── */}
                                    <div className="lg:col-span-2 space-y-4">
                                        {/* Crop Name */}
                                        <FormField icon={<Package className="w-4 h-4" />} label="Crop Name *">
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                                className="w-full bg-transparent outline-none text-sm text-[#1B1B1B]"
                                                placeholder="e.g. Cherry Tomatoes"
                                            />
                                        </FormField>

                                        {/* Category */}
                                        <FormField icon={<Tag className="w-4 h-4" />} label="Category *">
                                            <div className="relative flex-1">
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value as Category }))}
                                                    className="w-full bg-transparent outline-none text-sm text-[#1B1B1B] appearance-none cursor-pointer"
                                                >
                                                    {categoryOptions.map(opt => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.emoji} {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                                            </div>
                                        </FormField>

                                        {/* Variety */}
                                        <FormField icon={<Leaf className="w-4 h-4" />} label="Variety / Type">
                                            <input
                                                type="text"
                                                value={formData.variety}
                                                onChange={(e) => setFormData(p => ({ ...p, variety: e.target.value }))}
                                                className="w-full bg-transparent outline-none text-sm text-[#1B1B1B]"
                                                placeholder="e.g. Hybrid, Desi, Roma"
                                            />
                                        </FormField>

                                        {/* Price & Unit (side by side) */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField icon={<span className="text-sm font-bold text-[#9E9E9E]">₹</span>} label="Price *">
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={formData.price}
                                                    onChange={(e) => setFormData(p => ({ ...p, price: e.target.value }))}
                                                    className="w-full bg-transparent outline-none text-sm text-[#1B1B1B]"
                                                    placeholder="40.00"
                                                />
                                            </FormField>
                                            <FormField icon={<Scale className="w-4 h-4" />} label="Unit *">
                                                <div className="relative flex-1">
                                                    <select
                                                        value={formData.unit}
                                                        onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value as Unit }))}
                                                        className="w-full bg-transparent outline-none text-sm text-[#1B1B1B] appearance-none cursor-pointer"
                                                    >
                                                        {unitOptions.map(u => (
                                                            <option key={u} value={u}>{u}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
                                                </div>
                                            </FormField>
                                        </div>

                                        {/* Stock & Harvest Date (side by side) */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <FormField icon={<Package className="w-4 h-4" />} label="Stock Quantity *">
                                                <input
                                                    required
                                                    type="number"
                                                    min="0"
                                                    value={formData.stock}
                                                    onChange={(e) => setFormData(p => ({ ...p, stock: e.target.value }))}
                                                    className="w-full bg-transparent outline-none text-sm text-[#1B1B1B]"
                                                    placeholder="100"
                                                />
                                            </FormField>
                                            <FormField icon={<Calendar className="w-4 h-4" />} label="Harvest Date">
                                                <input
                                                    type="date"
                                                    value={formData.harvestDate}
                                                    onChange={(e) => setFormData(p => ({ ...p, harvestDate: e.target.value }))}
                                                    className="w-full bg-transparent outline-none text-sm text-[#1B1B1B] cursor-pointer"
                                                />
                                            </FormField>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="text-xs font-semibold text-[#5F6368] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                                                <FileText className="w-4 h-4" /> Description
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                                rows={3}
                                                className="w-full px-4 py-3 border-2 border-[#E8F5E9] focus:border-[#4CAF50] focus:ring-4 focus:ring-[#4CAF50]/10 rounded-xl outline-none text-sm text-[#1B1B1B] bg-[#F8FBF8] resize-none transition-all"
                                                placeholder="Describe your crop — freshness, growing method, special qualities…"
                                            />
                                        </div>

                                        {/* Form actions */}
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={closeForm}
                                                className="px-5 py-2.5 text-sm text-[#5F6368] hover:text-[#1B1B1B] hover:bg-[#F1F8E9] rounded-xl transition-all font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <motion.button
                                                type="submit"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.97 }}
                                                disabled={isSaving}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white rounded-xl shadow-lg hover:shadow-xl disabled:opacity-60 font-semibold text-sm transition-all"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                        </svg>
                                                        Saving…
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        {editingId ? "Update Crop" : "List Crop"}
                                                    </>
                                                )}
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* CROP GRID */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl shadow-sm border border-[#E8F5E9] overflow-hidden animate-pulse">
                                <div className="h-40 bg-[#E8F5E9]" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-[#E8F5E9] rounded w-3/4" />
                                    <div className="h-3 bg-[#E8F5E9] rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : userCrops && userCrops.length > 0 ? (
                    <motion.div
                        layout
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
                    >
                        <AnimatePresence>
                            {userCrops.map((crop) => {
                                const catColor = categoryColors[crop.category as Category] || "#2E7D32";
                                const catOption = categoryOptions.find(c => c.value === crop.category);
                                return (
                                    <motion.div
                                        key={crop.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.08)" }}
                                        className="bg-white rounded-2xl shadow-sm border border-[#E8F5E9] overflow-hidden group transition-all"
                                    >
                                        {/* Image */}
                                        <div className="h-44 relative overflow-hidden" style={{ backgroundColor: catColor + "18" }}>
                                            {crop.image ? (
                                                <img
                                                    src={crop.image}
                                                    alt={crop.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                                                    style={{ background: `linear-gradient(135deg, ${catColor}22 0%, ${catColor}44 100%)` }}>
                                                    <span className="text-5xl select-none">{catOption?.emoji || "🌿"}</span>
                                                    <span className="text-xs font-semibold" style={{ color: catColor }}>No Photo</span>
                                                </div>
                                            )}
                                            {/* Badges */}
                                            <div className="absolute top-2 left-2 flex flex-col gap-1">
                                                {crop.isOrganic && (
                                                    <span className="bg-[#1B5E20] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Leaf className="w-2.5 h-2.5" /> ORGANIC
                                                    </span>
                                                )}
                                                {!crop.isAvailable && (
                                                    <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                                        UNAVAILABLE
                                                    </span>
                                                )}
                                            </div>
                                            {/* Category badge */}
                                            <div
                                                className="absolute top-2 right-2 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow"
                                                style={{ backgroundColor: catColor }}
                                            >
                                                {catOption?.emoji} {catOption?.label}
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="p-4">
                                            <h3 className="font-bold text-[#1B1B1B] text-base leading-tight">{crop.name}</h3>
                                            {crop.variety && (
                                                <p className="text-xs text-[#9E9E9E] mt-0.5">{crop.variety}</p>
                                            )}

                                            <div className="flex items-center justify-between mt-3">
                                                <div>
                                                    <span className="text-lg font-bold text-[#2E7D32]">₹{crop.price}</span>
                                                    <span className="text-xs text-[#9E9E9E]">/{crop.unit}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-semibold text-[#5F6368]">{crop.stock}</span>
                                                    <span className="text-xs text-[#9E9E9E]"> {crop.unit}</span>
                                                    <p className="text-[10px] text-[#9E9E9E]">in stock</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 mt-4">
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => openEditForm(crop)}
                                                    className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9] rounded-lg text-sm font-semibold hover:bg-[#C8E6C9] transition-colors"
                                                >
                                                    <Edit3 className="w-3.5 h-3.5" /> Edit
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={() => setDeleteConfirmId(crop.id)}
                                                    className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    !showForm && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="py-20 flex flex-col items-center justify-center text-center"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-[#E8F5E9] flex items-center justify-center mb-6 shadow-inner">
                                <Wheat className="w-10 h-10 text-[#C8E6C9]" />
                            </div>
                            <p className="text-xl font-bold text-[#1B1B1B]">No crops listed yet</p>
                            <p className="text-sm text-[#9E9E9E] mt-2 mb-6 max-w-xs">
                                Add your first crop to start selling in the marketplace. Take a photo directly from your phone!
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={openAddForm}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white rounded-xl shadow-lg font-semibold text-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Your First Crop
                            </motion.button>
                        </motion.div>
                    )
                )}
            </div>

            {/* ── Delete Confirmation Modal ── */}
            <AnimatePresence>
                {deleteConfirmId !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setDeleteConfirmId(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1B1B1B] text-center">Delete Crop?</h3>
                            <p className="text-sm text-[#5F6368] text-center mt-2 mb-6">
                                This will permanently remove the crop from the marketplace. This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 py-2.5 text-sm font-semibold text-[#5F6368] hover:text-[#1B1B1B] bg-[#F5F5F5] hover:bg-[#EEEEEE] rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleDelete(deleteConfirmId)}
                                    disabled={isDeleting}
                                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? (
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                    Delete
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Voice Assistant Modal */}
            <VoiceAssistantModal 
                isOpen={showVoiceModal} 
                onClose={() => setShowVoiceModal(false)} 
                onComplete={handleVoiceComplete} 
            />
        </div>
    );
}

// Helper component for form fields
function FormField({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-xs font-semibold text-[#5F6368] uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <span className="text-[#9E9E9E]">{icon}</span> {label}
            </label>
            <div className="flex items-center bg-[#F8FBF8] rounded-xl px-4 h-11 border-2 border-[#E8F5E9] focus-within:border-[#4CAF50] focus-within:ring-4 focus-within:ring-[#4CAF50]/10 transition-all gap-3">
                {children}
            </div>
        </div>
    );
}
