import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Camera, CheckCircle2, Globe, Loader2, Volume2, AlertTriangle } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { toast } from "sonner";

interface VoiceAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: any, image: string) => void;
}

const languages = [
    { code: "English", label: "English", bcp47: "en-US" },
    { code: "Hindi", label: "हिन्दी (Hindi)", bcp47: "hi-IN" },
    { code: "Marathi", label: "मराठी (Marathi)", bcp47: "mr-IN" },
    { code: "Kannada", label: "ಕನ್ನಡ (Kannada)", bcp47: "kn-IN" },
    { code: "Telugu", label: "తెలుగు (Telugu)", bcp47: "te-IN" },
    { code: "Tamil", label: "தமிழ் (Tamil)", bcp47: "ta-IN" }
];

export default function VoiceAssistantModal({ isOpen, onClose, onComplete }: VoiceAssistantModalProps) {
    const [step, setStep] = useState<"language" | "photo" | "chat">("language");
    const [language, setLanguage] = useState(languages[0]);
    const [image, setImage] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [messages, setMessages] = useState<{ role: "ai" | "user" | "error", text: string }[]>([]);
    const [extractedData, setExtractedData] = useState<any>({});

    // Refs mirror the latest state so async callbacks (speech recognition,
    // speech synthesis onend, mutation resolution) never act on stale closures.
    const messagesRef = useRef(messages);
    const extractedDataRef = useRef(extractedData);
    const languageRef = useRef(language);
    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { extractedDataRef.current = extractedData; }, [extractedData]);
    useEffect(() => { languageRef.current = language; }, [language]);

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const extractMutation = trpc.ai.extractCropInfo.useMutation();

    // tRPC/React Query v4 exposes `isLoading`, v5 exposes `isPending`. Support both
    // so the "Processing..." indicator doesn't silently disappear on your setup.
    const isProcessing =
        (extractMutation as any).isPending ?? (extractMutation as any).isLoading ?? false;

    useEffect(() => {
        if (isOpen) {
            setStep("language");
            setImage("");
            setMessages([]);
            setExtractedData({});
            setIsListening(false);
            window.speechSynthesis?.cancel();
        } else {
            window.speechSynthesis?.cancel();
        }
    }, [isOpen]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const MAX = 800;
                let w = img.width;
                let h = img.height;
                if (w > MAX || h > MAX) {
                    if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
                    else { w = Math.round(w * MAX / h); h = MAX; }
                }
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d")!;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, 0, 0, w, h);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                setImage(dataUrl);
                setStep("chat");

                triggerAI("I have uploaded a photo. Please ask me about the crop.", {});
            };
            img.onerror = () => {
                toast.error("Could not read that image. Please try a different photo.");
            };
            img.src = event.target?.result as string;
        };
        reader.onerror = () => {
            toast.error("Could not read the selected file.");
        };
        reader.readAsDataURL(file);
    };

    const speak = (text: string, langBcp47: string, onEndCallback?: () => void) => {
        if (!window.speechSynthesis) {
            // No TTS available in this browser — still let the conversation continue.
            onEndCallback?.();
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance; // Prevent GC from dropping onend
        utterance.lang = langBcp47;
        utterance.rate = 0.9;
        utterance.onend = () => {
            onEndCallback?.();
        };
        // Chrome sometimes fails to speak (and never fires onend) if called
        // before voices finish loading. Fall back to advancing the flow anyway
        // after a timeout so the user isn't stuck waiting on a silent utterance.
        const fallbackTimer = setTimeout(() => {
            onEndCallback?.();
        }, Math.max(4000, text.length * 90));
        utterance.onend = () => {
            clearTimeout(fallbackTimer);
            onEndCallback?.();
        };
        utterance.onerror = () => {
            clearTimeout(fallbackTimer);
            onEndCallback?.();
        };
        window.speechSynthesis.speak(utterance);
    };

    const triggerAI = async (userMessage: string, currentData: any) => {
        try {
            const res = await extractMutation.mutateAsync({
                message: userMessage,
                currentState: currentData,
                language: languageRef.current.code,
                history: messagesRef.current,
            });

            if (!res) {
                throw new Error("Empty response from server");
            }

            setExtractedData(res.extractedData ?? currentData);

            if (res.nextQuestion) {
                setMessages(prev => [...prev, { role: "ai", text: res.nextQuestion }]);
                speak(res.nextQuestion, languageRef.current.bcp47, () => {
                    startListening();
                });
            } else if (!res.isComplete) {
                // Backend responded but gave us nothing to say and didn't mark
                // completion — surface this instead of going silent.
                console.warn("AI response had no nextQuestion and isComplete=false:", res);
                setMessages(prev => [...prev, {
                    role: "error",
                    text: "I didn't get a follow-up question from the server. Check the ai.extractCropInfo response shape."
                }]);
            }

            if (res.isComplete) {
                toast.success("Crop details successfully gathered!");
                setTimeout(() => {
                    onComplete(res.extractedData || currentData, image);
                }, 2000);
            }
        } catch (error: any) {
            console.error("AI Error:", error);
            const detail = error?.message || "Unknown error";
            toast.error(`Failed to process voice: ${detail}`);
            setMessages(prev => [...prev, {
                role: "error",
                text: `Something went wrong talking to the assistant: ${detail}`
            }]);
        }
    };

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error("Voice recognition is not supported in this browser. Please use Chrome or Edge, over HTTPS.");
            return;
        }
        if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
            toast.error("Voice input needs HTTPS (or localhost) to work in most browsers.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = languageRef.current.bcp47;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            window.speechSynthesis?.cancel();
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setMessages(prev => [...prev, { role: "user", text: transcript }]);
            triggerAI(transcript, extractedDataRef.current);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            if (event.error === "no-speech") {
                toast.error("Didn't catch that — please try speaking again.");
            } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                toast.error("Microphone access was blocked. Please allow mic permission for this site.");
            } else {
                toast.error("Could not hear you properly. Please try again.");
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        try {
            recognition.start();
        } catch (err) {
            console.error("Failed to start recognition:", err);
            toast.error("Could not start the microphone. Please try again.");
            setIsListening(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20 }}
                        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-[#1B5E20] to-[#4CAF50] text-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                                    <Mic className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Voice Assistant</h2>
                                    <p className="text-xs text-white/80">List your crop hands-free</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-[#F8FBF8]">
                            {step === "language" && (
                                <div className="space-y-4">
                                    <div className="text-center mb-6">
                                        <Globe className="w-12 h-12 text-[#4CAF50] mx-auto mb-3 opacity-80" />
                                        <h3 className="text-lg font-semibold text-[#1B1B1B]">Choose your language</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => { setLanguage(lang); languageRef.current = lang; setStep("photo"); }}
                                                className="p-4 rounded-2xl border-2 border-[#E8F5E9] hover:border-[#4CAF50] bg-white text-center transition-all hover:shadow-md group"
                                            >
                                                <span className="block text-[#1B1B1B] font-medium group-hover:text-[#1B5E20]">{lang.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === "photo" && (
                                <div className="flex flex-col items-center justify-center py-8 text-center h-full space-y-6">
                                    <div className="w-20 h-20 bg-[#E8F5E9] rounded-full flex items-center justify-center">
                                        <Camera className="w-10 h-10 text-[#4CAF50]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-[#1B1B1B] mb-2">Show me the crop</h3>
                                        <p className="text-[#5F6368] text-sm max-w-xs mx-auto">
                                            Take a picture or upload an image of the crop you want to list.
                                        </p>
                                    </div>

                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handlePhotoUpload}
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-8 py-4 bg-[#1B5E20] hover:bg-[#2E7D32] text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                                    >
                                        <Camera className="w-5 h-5" /> Open Camera
                                    </button>
                                </div>
                            )}

                            {step === "chat" && (
                                <div className="flex flex-col h-full">
                                    <div className="flex-1 space-y-4 mb-6">
                                        {image && (
                                            <div className="flex justify-end mb-6">
                                                <div className="relative rounded-2xl overflow-hidden border-4 border-white shadow-sm w-32 h-32">
                                                    <img src={image} alt="Crop" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                                                    <CheckCircle2 className="absolute bottom-2 right-2 w-5 h-5 text-white drop-shadow-md" />
                                                </div>
                                            </div>
                                        )}

                                        {messages.map((msg, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                            >
                                                <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === "user"
                                                        ? "bg-[#1B5E20] text-white shadow-md rounded-tr-none"
                                                        : msg.role === "error"
                                                            ? "bg-red-50 border border-red-200 text-red-700 rounded-tl-none"
                                                            : "bg-white border border-[#E8F5E9] shadow-sm text-[#1B1B1B] rounded-tl-none"
                                                    }`}>
                                                    {msg.role === "ai" && <Volume2 className="w-4 h-4 text-[#4CAF50] mb-1 opacity-70" />}
                                                    {msg.role === "error" && <AlertTriangle className="w-4 h-4 text-red-500 mb-1" />}
                                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {isProcessing && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                                <div className="bg-white border border-[#E8F5E9] p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 text-[#4CAF50] animate-spin" />
                                                    <span className="text-xs text-[#5F6368]">Processing...</span>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex justify-center sticky bottom-0 bg-[#F8FBF8] pb-2">
                                        <button
                                            onClick={startListening}
                                            disabled={isListening || isProcessing}
                                            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all disabled:opacity-60 ${isListening
                                                    ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110"
                                                    : "bg-[#1B5E20] text-white shadow-lg hover:shadow-xl hover:scale-105 hover:bg-[#2E7D32]"
                                                }`}
                                        >
                                            {isListening && (
                                                <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20"></span>
                                            )}
                                            {isListening ? <Mic className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
                                        </button>
                                    </div>
                                    <p className="text-center text-[10px] text-[#9E9E9E] mt-3">
                                        {isListening ? "Listening... speak now" : "Tap the microphone to speak"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
