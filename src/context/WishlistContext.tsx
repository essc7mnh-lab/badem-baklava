"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

interface WishlistContextType {
  favorites: string[];
  toggleFavorite: (productId: string | number) => boolean;
  isFavorite: (productId: string | number) => boolean;
  favoritesCount: number;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "badem_wishlist";

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. استرجاع المفضلة بشكل غير متزامن لتفادي تعليق التصيير وتصفير التنبيهات
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setFavorites(parsed.map((id) => String(id)));
            }
          }
        }
      } catch (e) {
        console.warn("Failed to load wishlist from localStorage:", e);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // 2. مزامنة المفضلة تلقائياً عند أي تعديل (بعد اكتمال القراءة الأولى)
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(favorites));
      } catch (e) {
        console.warn("Failed to save wishlist to localStorage:", e);
      }
    }
  }, [favorites, isLoaded]);

  // Set داخلي لعمليات البحث الفورية O(1)
  const favoritesLookup = useMemo(() => new Set(favorites), [favorites]);

  const isFavorite = useCallback(
    (productId: string | number): boolean => {
      if (!productId) return false;
      return favoritesLookup.has(String(productId));
    },
    [favoritesLookup]
  );

  const toggleFavorite = useCallback(
    (productId: string | number): boolean => {
      if (!productId) return false;
      const targetId = String(productId);
      const willBeAdded = !favoritesLookup.has(targetId);

      setFavorites((prev) => {
        if (willBeAdded) {
          return [...prev, targetId];
        }
        return prev.filter((id) => id !== targetId);
      });

      return willBeAdded;
    },
    [favoritesLookup]
  );

  const clearWishlist = useCallback(() => {
    setFavorites([]);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
      } catch {
        // حماية مساحة التخزين
      }
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      favorites,
      toggleFavorite,
      isFavorite,
      favoritesCount: favorites.length,
      clearWishlist,
    }),
    [favorites, toggleFavorite, isFavorite, clearWishlist]
  );

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};