import { Link } from "react-router";
import { Home, Wheat, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F1F8E9] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-md"
            >
                <div className="w-24 h-24 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-6">
                    <Wheat className="w-12 h-12 text-[#1B5E20]" />
                </div>
                <h1 className="text-6xl font-bold text-[#1B5E20] mb-2">404</h1>
                <h2 className="text-xl font-semibold text-[#1B1B1B] mb-2">Page Not Found</h2>
                <p className="text-[#5F6368] mb-6">
                    The page you are looking for does not exist or has been moved.
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-6 py-3 border border-[#C8E6C9] text-[#5F6368] rounded-full hover:bg-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <Link
                        to="/"
                        className="flex items-center gap-2 px-6 py-3 bg-[#1B5E20] text-white rounded-full hover:bg-[#2E7D32] transition-colors"
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
