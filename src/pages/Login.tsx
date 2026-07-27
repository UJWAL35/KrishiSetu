import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";
import {
    Wheat,
    Shield,
    ShoppingBag,
    ArrowRight,
    Sprout,
    AlertCircle,
    Phone,
    User,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    Truck,
} from "lucide-react";
import { trpc } from "@/providers/trpc";

type Role = "farmer" | "consumer" | "admin" | "delivery_partner";

export const AUTH_KEY = "sf_auth_role";

const roles: { id: Role; label: string; icon: React.ElementType; color: string; gradient: string; hint: string }[] = [
    { id: "farmer",           label: "Farmer",           icon: Sprout,      color: "#1B5E20", gradient: "from-[#1B5E20] to-[#2E7D32]", hint: "Monitor farm & sell crops" },
    { id: "consumer",         label: "Consumer",         icon: ShoppingBag, color: "#E65100", gradient: "from-[#E65100] to-[#BF360C]", hint: "Buy fresh from local farms" },
    { id: "admin",            label: "Admin",            icon: Shield,      color: "#4527A0", gradient: "from-[#4527A0] to-[#311B92]", hint: "Manage the platform" },
    { id: "delivery_partner", label: "Delivery Partner", icon: Truck,       color: "#01579B", gradient: "from-[#01579B] to-[#0277BD]", hint: "Deliver farm-fresh produce" },
];

function navigateAfterLogin(role: string, isProfileComplete: boolean | null | undefined, navigate: ReturnType<typeof useNavigate>, userId?: number, userName?: string) {
    localStorage.setItem(AUTH_KEY, role);
    if (userId) localStorage.setItem("sf_user_id", String(userId));
    if (userName) localStorage.setItem("sf_user_name", userName);
    if (role === "farmer") {
        if (!isProfileComplete) navigate("/farmer/profile-setup");
        else navigate("/farmer/dashboard");
    } else if (role === "admin") {
        navigate("/admin");
    } else if (role === "delivery_partner") {
        navigate("/delivery/dashboard");
    } else {
        navigate("/marketplace");
    }
}

export default function Login() {
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [step, setStep] = useState<"role" | "credentials">("role");

    // Farmer/consumer fields
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    // Admin fields
    const [adminPhone, setAdminPhone] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [error, setError] = useState("");
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [avatar, setAvatar] = useState("/avatars/m1.png");

    const nameRef = useRef<HTMLInputElement>(null);

    const loginMutation = trpc.auth.login.useMutation();
    const registerMutation = trpc.auth.register.useMutation();
    const adminLoginMutation = trpc.auth.adminLogin.useMutation();

    const handleRoleSelect = (role: Role) => {
        setSelectedRole(role);
        setPhone("");
        setAdminPhone("");
        setName("");
        setPassword("");
        setError("");
        setStep("credentials");
        setTimeout(() => nameRef.current?.focus(), 100);
    };

    const handleLogin = async () => {
        if (!selectedRole) return;
        setError("");

        try {
            if (selectedRole === "admin") {
                if (adminPhone.length < 10 || !password.trim()) {
                    setError("Please enter your phone number and password.");
                    return;
                }
                const res = await adminLoginMutation.mutateAsync({
                    phone: adminPhone,
                    password: password,
                });
                if (res.success && res.user) {
                    navigateAfterLogin(res.user.role, res.user.isProfileComplete, navigate, res.user.id, res.user.name);
                }
            } else {
                if (isLoginMode) {
                    if (phone.length < 10) {
                        setError("Please provide a valid 10-digit phone number.");
                        return;
                    }
                    const res = await loginMutation.mutateAsync({
                        phone: phone,
                        role: selectedRole,
                    });
                    if (res.success && res.user) {
                        navigateAfterLogin(res.user.role, res.user.isProfileComplete, navigate, res.user.id, res.user.name);
                    }
                } else {
                    if (phone.length < 10 || !name.trim()) {
                        setError("Please provide both name and a valid 10-digit phone number.");
                        return;
                    }
                    const res = await registerMutation.mutateAsync({
                        name: name.trim(),
                        phone: phone,
                        role: selectedRole,
                        avatar: selectedRole === "farmer" ? avatar : undefined,
                    });
                    if (res.success && res.user) {
                        navigateAfterLogin(res.user.role, res.user.isProfileComplete, navigate, res.user.id, res.user.name);
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during login.");
        }
    };

    const isPending = loginMutation.isPending || registerMutation.isPending || adminLoginMutation.isPending;
    const roleConfig = selectedRole ? roles.find((r) => r.id === selectedRole)! : roles[0];

    const avatars = [
        { id: "/avatars/m1.png", label: "Farmer 1" },
        { id: "/avatars/m2.png", label: "Farmer 2" },
        { id: "/avatars/f1.png", label: "Farmer 3" },
        { id: "/avatars/f2.png", label: "Farmer 4" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F1F8E9] to-[#DCEDC8] relative overflow-hidden flex items-center justify-center">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#4CAF50]/10 blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-[#1B5E20]/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#8BC34A]/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
                {/* Decorative farm silhouette hills */}
                <div className="absolute bottom-0 left-[-10%] right-[-10%] h-[35%] rounded-[100%] bg-[#4CAF50]/10 hills-drift" />
                <div className="absolute bottom-0 left-[10%] right-[-20%] h-[25%] rounded-[100%] bg-[#388E3C]/15 hills-drift" style={{ animationDelay: "-10s" }} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                {/* Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-green-900/10 border border-white/60 overflow-hidden">
                    {/* Top gradient bar */}
                    {selectedRole && (
                        <motion.div
                            layoutId="gradient-bar"
                            className={`h-1.5 bg-gradient-to-r ${roleConfig.gradient} w-full`}
                        />
                    )}
                    {!selectedRole && <div className="h-1.5 bg-gradient-to-r from-[#1B5E20] via-[#4CAF50] to-[#8BC34A] w-full" />}

                    <div className="p-8">
                        {/* Logo */}
                        <motion.div layout className="text-center mb-8">
                            <motion.div
                                layout
                                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1B5E20] to-[#4CAF50] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-900/20"
                            >
                                <Wheat className="w-8 h-8 text-white" />
                            </motion.div>
                            <h1 className="text-2xl font-bold text-[#1B1B1B] tracking-tight">KrishiSetu</h1>
                            <p className="text-sm text-[#5F6368] mt-1">
                                {step === "role" ? "Select your role to continue" : `Sign in as ${roleConfig.label}`}
                            </p>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            {/* ── Step 1: Role Selection ─── */}
                            {step === "role" && (
                                <motion.div
                                    key="role"
                                    initial={{ opacity: 0, x: -24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 24 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-3"
                                >
                                    {roles.map((role, idx) => {
                                        const Icon = role.icon;
                                        return (
                                            <motion.button
                                                key={role.id}
                                                id={`role-btn-${role.id}`}
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.08 }}
                                                whileHover={{ scale: 1.02, x: 4 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => handleRoleSelect(role.id)}
                                                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-[#E8F5E9] hover:border-[#4CAF50]/40 bg-white hover:bg-[#F1F8E9] transition-all text-left group shadow-sm hover:shadow-md"
                                            >
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${role.gradient} shadow-md`}
                                                >
                                                    <Icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-[#1B1B1B] group-hover:text-[#1B5E20]">
                                                        {role.label}
                                                    </p>
                                                    <p className="text-xs text-[#9E9E9E]">{role.hint}</p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-[#C8E6C9] group-hover:text-[#4CAF50] transition-colors group-hover:translate-x-1 transition-transform" />
                                            </motion.button>
                                        );
                                    })}

                                    <p className="text-center text-xs text-[#9E9E9E] mt-4 pt-2">
                                        Choose how you want to join the network
                                    </p>
                                </motion.div>
                            )}

                            {/* ── Step 2: Credentials ─── */}
                            {step === "credentials" && selectedRole && (
                                <motion.div
                                    key="credentials"
                                    initial={{ opacity: 0, x: 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -24 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    {/* Role badge */}
                                    <div
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r ${roleConfig.gradient} text-white shadow-md`}
                                    >
                                        <roleConfig.icon className="w-4 h-4" />
                                        <span>Continuing as {roleConfig.label}</span>
                                    </div>

                                    {/* ── FARMER / CONSUMER FIELDS ── */}
                                    {selectedRole !== "admin" && (
                                        <>
                                            {/* Name (Only in Register Mode) */}
                                            {!isLoginMode && (
                                                <div>
                                                    <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block uppercase tracking-wide">
                                                        Full Name
                                                    </label>
                                                    <div className="flex items-center bg-[#F8FBF8] rounded-xl px-4 h-12 border-2 border-[#E8F5E9] focus-within:border-[#4CAF50] focus-within:ring-4 focus-within:ring-[#4CAF50]/10 transition-all gap-3">
                                                        <User className="w-4 h-4 text-[#9E9E9E]" />
                                                        <input
                                                            ref={nameRef}
                                                            id="input-name"
                                                            type="text"
                                                            placeholder="Enter your full name"
                                                            value={name}
                                                            onChange={(e) => { setName(e.target.value); setError(""); }}
                                                            className="flex-1 bg-transparent outline-none text-sm text-[#1B1B1B]"
                                                            autoComplete="name"
                                                        />
                                                        {name.trim().length > 1 && (
                                                            <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" />
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Phone */}
                                            <div>
                                                <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block uppercase tracking-wide">
                                                    Phone Number
                                                </label>
                                                <div className="flex items-center bg-[#F8FBF8] rounded-xl px-4 h-12 border-2 border-[#E8F5E9] focus-within:border-[#4CAF50] focus-within:ring-4 focus-within:ring-[#4CAF50]/10 transition-all gap-3">
                                                    <Phone className="w-4 h-4 text-[#9E9E9E]" />
                                                    <span className="text-sm text-[#5F6368] font-medium">+91</span>
                                                    <span className="text-[#E0E0E0]">|</span>
                                                    <input
                                                        id="input-phone"
                                                        type="tel"
                                                        placeholder="10-digit phone number"
                                                        value={phone}
                                                        onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                                                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                                                        className="flex-1 bg-transparent outline-none text-sm text-[#1B1B1B]"
                                                        maxLength={10}
                                                        autoComplete="tel"
                                                    />
                                                    {phone.length === 10 && (
                                                        <CheckCircle2 className="w-4 h-4 text-[#4CAF50]" />
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Avatar Selection (Farmer Register Only) */}
                                            {!isLoginMode && selectedRole === "farmer" && (
                                                <div>
                                                    <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block uppercase tracking-wide">
                                                        Select Avatar
                                                    </label>
                                                    <div className="grid grid-cols-4 gap-3">
                                                        {avatars.map(av => (
                                                            <button
                                                                key={av.id}
                                                                type="button"
                                                                onClick={() => setAvatar(av.id)}
                                                                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                                                                    avatar === av.id ? "border-[#4CAF50] scale-105 shadow-md shadow-green-900/20" : "border-transparent opacity-60 hover:opacity-100"
                                                                }`}
                                                            >
                                                                <img src={av.id} alt={av.label} className="w-full h-auto aspect-square object-cover" />
                                                                {avatar === av.id && (
                                                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                                                        <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Toggle Mode */}
                                            <div className="text-center mt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsLoginMode(!isLoginMode)}
                                                    className="text-xs font-medium text-[#1B5E20] hover:text-[#4CAF50] transition-colors"
                                                >
                                                    {isLoginMode ? "New here? Register instead" : "Already have an account? Log in"}
                                                </button>
                                            </div>
                                        </>
                                    )}

                                    {/* ── ADMIN FIELDS ── */}
                                    {selectedRole === "admin" && (
                                        <>
                                            {/* Admin Phone */}
                                            <div>
                                                <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block uppercase tracking-wide">
                                                    Admin Phone
                                                </label>
                                                <div className="flex items-center bg-[#F8FBF8] rounded-xl px-4 h-12 border-2 border-[#E8F5E9] focus-within:border-[#4527A0] focus-within:ring-4 focus-within:ring-[#4527A0]/10 transition-all gap-3">
                                                    <Phone className="w-4 h-4 text-[#9E9E9E]" />
                                                    <span className="text-sm text-[#5F6368] font-medium">+91</span>
                                                    <span className="text-[#E0E0E0]">|</span>
                                                    <input
                                                        ref={nameRef}
                                                        id="input-admin-phone"
                                                        type="tel"
                                                        placeholder="Admin phone number"
                                                        value={adminPhone}
                                                        onChange={(e) => { setAdminPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                                                        className="flex-1 bg-transparent outline-none text-sm text-[#1B1B1B]"
                                                        maxLength={10}
                                                        autoComplete="tel"
                                                    />
                                                    {adminPhone.length === 10 && (
                                                        <CheckCircle2 className="w-4 h-4 text-[#4527A0]" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Admin Password */}
                                            <div>
                                                <label className="text-xs font-semibold text-[#5F6368] mb-1.5 block uppercase tracking-wide">
                                                    Password
                                                </label>
                                                <div className="flex items-center bg-[#F8FBF8] rounded-xl px-4 h-12 border-2 border-[#E8F5E9] focus-within:border-[#4527A0] focus-within:ring-4 focus-within:ring-[#4527A0]/10 transition-all gap-3">
                                                    <Lock className="w-4 h-4 text-[#9E9E9E]" />
                                                    <input
                                                        id="input-password"
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter admin password"
                                                        value={password}
                                                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                                                        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                                                        className="flex-1 bg-transparent outline-none text-sm text-[#1B1B1B]"
                                                        autoComplete="current-password"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="text-[#9E9E9E] hover:text-[#5F6368] transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-[#9E9E9E] mt-1 ml-1">
                                                    Default: phone 9999999999 / password Admin@123
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Error message */}
                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                                            >
                                                <AlertCircle className="w-4 h-4 shrink-0" />
                                                {error}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Login button */}
                                    <motion.button
                                        id="btn-login"
                                        onClick={handleLogin}
                                        disabled={isPending}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`w-full h-12 rounded-xl font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm tracking-wide shadow-lg bg-gradient-to-r ${roleConfig.gradient}`}
                                    >
                                        {isPending ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Signing in…
                                            </>
                                        ) : (
                                            <>
                                                Continue <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </motion.button>

                                    {/* Back */}
                                    <button
                                        id="btn-back-role"
                                        onClick={() => { setStep("role"); setError(""); setSelectedRole(null); }}
                                        className="w-full text-center text-sm text-[#9E9E9E] hover:text-[#5F6368] transition-colors py-1"
                                    >
                                        ← Change role
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-[#9E9E9E] mt-6">
                    KrishiSetu © 2024 · Connecting farms to tables
                </p>
            </motion.div>
        </div>
    );
}
