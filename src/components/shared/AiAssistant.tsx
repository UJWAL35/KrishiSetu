import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import { trpc } from "@/providers/trpc";

interface Message {
    id: string;
    text: string;
    sender: "user" | "ai";
    timestamp: Date;
}

export default function AiAssistant({ role = "general" }: { role?: "farmer" | "admin" | "consumer" | "general" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: `Hi there! I'm your SmartFarm AI Assistant. How can I help you today?`,
            sender: "ai",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatMutation = trpc.ai.chat.useMutation();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, chatMutation.isPending]);

    const handleSend = async () => {
        if (!input.trim() || chatMutation.isPending) return;

        const userText = input.trim();
        const userMsg: Message = {
            id: Date.now().toString(),
            text: userText,
            sender: "user",
            timestamp: new Date(),
        };

        // We only send the message history (excluding the first greeting and the current message)
        // Gemini expects role to be "user" or "model"
        const historyForGemini = messages
            .filter((m) => m.id !== "1") // Skip the initial hardcoded greeting if you want, or map it to 'model'
            .map((m) => ({
                role: m.sender === "user" ? ("user" as const) : ("model" as const),
                parts: [{ text: m.text }],
            }));

        setMessages((prev) => [...prev, userMsg]);
        setInput("");

        try {
            const result = await chatMutation.mutateAsync({
                history: historyForGemini,
                message: userText,
                userRole: role,
            });

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: result.response,
                sender: "ai",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error("Failed to get AI response", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: "Sorry, I'm having trouble connecting to the server. Please try again later.",
                sender: "ai",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between text-white shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                    <Sparkles className="w-5 h-5 text-emerald-50" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg leading-tight">FarmAI</h3>
                                    <p className="text-xs text-emerald-100 opacity-90">Powered by Gemini</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                            {messages.map((msg) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={msg.id}
                                    className={`flex gap-3 max-w-[85%] ${
                                        msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                                    }`}
                                >
                                    <div
                                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${
                                            msg.sender === "user"
                                                ? "bg-emerald-600 text-white"
                                                : "bg-teal-100 text-teal-700"
                                        }`}
                                    >
                                        {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div
                                        className={`p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap ${
                                            msg.sender === "user"
                                                ? "bg-emerald-600 text-white rounded-tr-none"
                                                : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            {chatMutation.isPending && (
                                <div className="flex gap-3 max-w-[85%] mr-auto">
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend();
                                }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type your message..."
                                    disabled={chatMutation.isPending}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-50"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || chatMutation.isPending}
                                    className="w-10 h-10 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-all relative group"
            >
                <MessageSquare className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
                <div className="absolute right-full mr-4 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                    Ask AI Assistant
                </div>
            </motion.button>
        </div>
    );
}
