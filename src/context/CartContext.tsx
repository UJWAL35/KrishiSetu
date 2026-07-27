import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
    cropId: number;
    name: string;
    variety: string;
    image: string;
    price: number;
    unit: string;
    farmerName: string;
    farmerAvatar: string;
    farmerId: number;
    farmName: string;
    farmId: number;
    isOrganic: boolean;
    quantity: number; // in kg / units
}

export interface PurchaseRecord {
    id: string;
    items: CartItem[];
    deliveryType: string;
    deliveryFee: number;
    platformFee: number;
    total: number;
    date: string;
    orderNumber: string;
}

export interface ReviewRecord {
    id: string;
    cropId: number;
    cropName: string;
    cropImage: string;
    farmerName: string;
    orderId: string;
    orderNumber: string;
    rating: number;
    comment: string;
    date: string;
    helpful: number;
    markedHelpfulBy: string[]; // session IDs (use random UUID)
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (item: Omit<CartItem, "quantity">) => void;
    removeFromCart: (cropId: number) => void;
    updateQuantity: (cropId: number, quantity: number) => void;
    clearCart: () => void;
    cartCount: number;
    cartTotal: number;
    purchaseHistory: PurchaseRecord[];
    savePurchase: (record: Omit<PurchaseRecord, "id" | "orderNumber">) => void;
    reviews: ReviewRecord[];
    addReview: (review: Omit<ReviewRecord, "id" | "date" | "helpful" | "markedHelpfulBy">) => void;
    markHelpful: (reviewId: string, sessionId: string) => void;
    getReviewsForCrop: (cropId: number) => ReviewRecord[];
    hasReviewedOrder: (orderId: string, cropId: number) => boolean;
    getAverageRating: (cropId: number) => number | null;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_KEY = "sf_cart";
const HISTORY_KEY = "sf_purchase_history";
const REVIEWS_KEY = "sf_reviews";

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>(() => {
        try {
            const stored = localStorage.getItem(CART_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>(() => {
        try {
            const stored = localStorage.getItem(HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [reviews, setReviews] = useState<ReviewRecord[]>(() => {
        try {
            const stored = localStorage.getItem(REVIEWS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(purchaseHistory));
    }, [purchaseHistory]);

    useEffect(() => {
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    }, [reviews]);

    const addToCart = (item: Omit<CartItem, "quantity">) => {
        setCartItems((prev) => {
            const existing = prev.find((i) => i.cropId === item.cropId);
            if (existing) {
                return prev.map((i) =>
                    i.cropId === item.cropId ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (cropId: number) => {
        setCartItems((prev) => prev.filter((i) => i.cropId !== cropId));
    };

    const updateQuantity = (cropId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(cropId);
            return;
        }
        setCartItems((prev) =>
            prev.map((i) => (i.cropId === cropId ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => setCartItems([]);

    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const savePurchase = (record: Omit<PurchaseRecord, "id" | "orderNumber">) => {
        const newRecord: PurchaseRecord = {
            ...record,
            id: Date.now().toString(),
            orderNumber: `KS-${Date.now().toString().slice(-6)}`,
        };
        setPurchaseHistory((prev) => [newRecord, ...prev]);
    };

    const addReview = (review: Omit<ReviewRecord, "id" | "date" | "helpful" | "markedHelpfulBy">) => {
        const newReview: ReviewRecord = {
            ...review,
            id: Date.now().toString(),
            date: new Date().toISOString(),
            helpful: 0,
            markedHelpfulBy: [],
        };
        setReviews((prev) => [newReview, ...prev]);
    };

    const markHelpful = (reviewId: string, sessionId: string) => {
        setReviews((prev) =>
            prev.map((r) => {
                if (r.id !== reviewId) return r;
                if (r.markedHelpfulBy.includes(sessionId)) return r;
                return { ...r, helpful: r.helpful + 1, markedHelpfulBy: [...r.markedHelpfulBy, sessionId] };
            })
        );
    };

    const getReviewsForCrop = (cropId: number) =>
        reviews.filter((r) => r.cropId === cropId);

    const hasReviewedOrder = (orderId: string, cropId: number) =>
        reviews.some((r) => r.orderId === orderId && r.cropId === cropId);

    const getAverageRating = (cropId: number): number | null => {
        const cropReviews = getReviewsForCrop(cropId);
        if (cropReviews.length === 0) return null;
        const sum = cropReviews.reduce((acc, r) => acc + r.rating, 0);
        return Math.round((sum / cropReviews.length) * 10) / 10;
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartCount,
                cartTotal,
                purchaseHistory,
                savePurchase,
                reviews,
                addReview,
                markHelpful,
                getReviewsForCrop,
                hasReviewedOrder,
                getAverageRating,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

const cartDefaults: CartContextType = {
    cartItems: [],
    addToCart: () => {},
    removeFromCart: () => {},
    updateQuantity: () => {},
    clearCart: () => {},
    cartCount: 0,
    cartTotal: 0,
    purchaseHistory: [],
    savePurchase: () => {},
    reviews: [],
    addReview: () => {},
    markHelpful: () => {},
    getReviewsForCrop: () => [],
    hasReviewedOrder: () => false,
    getAverageRating: () => null,
};

export function useCart() {
    const ctx = useContext(CartContext);
    // Return safe defaults when used outside CartProvider (e.g. farmer/admin layouts)
    return ctx ?? cartDefaults;
}
