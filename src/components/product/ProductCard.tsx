"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Plus, Heart, Clock } from "lucide-react";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { royalSound } from "@/lib/sound";

interface WeightPricesData {
  quarter?: number | string;
  half?: number | string;
  kilo?: number | string;
}

interface ExtendedProduct extends Product {
  is_available?: boolean;
  isOutOfStock?: boolean;
  is_out_of_stock?: boolean;
  base_price?: number | string;
  price?: number | string;
  original_price?: number | string;
  compare_at_price?: number | string;
  weight_prices?: WeightPricesData | string | null;
  weightPrices?: WeightPricesData | string | null;
  has_weights?: boolean;
  hasWeights?: boolean;
  title_ar?: string;
  title_en?: string;
  image_url?: string;
}

interface ProductCardProps {
  product: ExtendedProduct;
  onOpenDetail: (product: ExtendedProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetail }) => {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const { showToast } = useToast();

  const [imageLoaded, setImageLoaded] = useState(false);

  const isAr = language === "ar";
  const title = isAr
    ? product.titleAr || product.title_ar || "صنف فاخر"
    : product.titleEn || product.title_en || "Signature Item";
  const currencySymbol = isAr ? "ر.س " : "SAR ";
  const favorited = isFavorite(product.id);
  const productImage = product.image || product.image_url || "/hero-baklava.png";

  // التحقق مما إذا كان الصنف يعتمد نظام الأوزان
  const hasWeights = product.has_weights !== false && product.hasWeights !== false;

  // التحقق من حالة نفاذ الكمية
  const isSoldOut = Boolean(
    product.is_available === false ||
    product.isOutOfStock === true ||
    product.is_out_of_stock === true
  );

  // استخراج أسعار الأوزان إن وجدت لضمان تطابق سعر الكرت مع النافذة
  const parsedWeights = useMemo<WeightPricesData | null>(() => {
    const raw = product.weight_prices ?? product.weightPrices;
    if (!raw) return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as WeightPricesData;
      } catch {
        return null;
      }
    }
    return raw as WeightPricesData;
  }, [product.weight_prices, product.weightPrices]);

  // السعر الفعلي المعروض (يأخذ سعر الربع كيلو من weight_prices إن وُجد، وإلا يأخذ basePrice)
  const effectiveBasePrice = useMemo<number>(() => {
    const qPrice = Number(parsedWeights?.quarter);
    if (hasWeights && Number.isFinite(qPrice) && qPrice > 0) {
      return qPrice;
    }
    const base = Number(product.basePrice ?? product.base_price ?? product.price ?? 0);
    return Number.isFinite(base) && base > 0 ? base : 45;
  }, [parsedWeights, hasWeights, product.basePrice, product.base_price, product.price]);

  // السعر الأصلي (المشطوب) قبل الخصم
  const effectiveOriginalPrice = useMemo<number>(() => {
    const orig = Number(
      product.originalPrice ?? product.original_price ?? product.compare_at_price ?? 0
    );
    return Number.isFinite(orig) && orig > 0 ? orig : 0;
  }, [product.originalPrice, product.original_price, product.compare_at_price]);

  // حساب نسبة الخصم الحقيقية إذا وجدت
  const discountPercent =
    effectiveOriginalPrice > effectiveBasePrice && effectiveBasePrice > 0
      ? Math.round(((effectiveOriginalPrice - effectiveBasePrice) / effectiveOriginalPrice) * 100)
      : null;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleFavorite(product.id);
    if (added) {
      showToast(
        isAr ? `تمت إضافة "${title}" إلى المفضلة ❤️` : `Added "${title}" to wishlist ❤️`,
        "favorite"
      );
    } else {
      showToast(
        isAr ? `تمت الإزالة من المفضلة` : `Removed from wishlist`,
        "info"
      );
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();

    // منع الإضافة نهائياً في حال نفاذ الكمية
    if (isSoldOut) return;

    royalSound.playSuccessChime();
    addToCart(
      {
        id: product.id,
        title,
        price: effectiveBasePrice,
        image: productImage,
        portionNote: hasWeights ? (isAr ? "ربع كيلو (250g)" : "250g Quarter") : "",
      },
      e
    );
    showToast(
      isAr ? `تمت إضافة "${title}" إلى السلة 🛍️` : `Added "${title}" to cart 🛍️`,
      "success"
    );
  };

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className="bg-[#FAF5ED] rounded-3xl p-3 border border-[#4A0E17]/10 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer group relative"
    >
      {/* إطار صورة المنتج الذكي مع شارة الخصم وزر المفضلة */}
      <div className="relative overflow-hidden rounded-2xl bg-white aspect-square w-full">
        
        {/* تأثير وميض خافت أثناء تحميل الصورة */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-stone-100 animate-pulse" />
        )}

        {/* زر المفضلة */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute top-2 left-2 rtl:left-2 rtl:right-auto ltr:right-2 ltr:left-auto z-20 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-md transition transform active:scale-75 hover:scale-110 cursor-pointer"
          title="إضافة للمفضلة"
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              favorited ? "text-rose-500 fill-rose-500" : "text-stone-400 hover:text-rose-500"
            }`}
          />
        </button>

        {/* شارة الخصم */}
        {discountPercent && !isSoldOut && (
          <div className="absolute top-2 right-2 rtl:right-2 rtl:left-auto ltr:left-2 ltr:right-auto z-20 bg-[#4A0E17] text-[#E5C058] text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
            خصم {discountPercent}%
          </div>
        )}

        {/* شارة نفذت الكمية العائمة على الصورة من الخارج */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1.5px] z-10 flex items-center justify-center p-2">
            <span className="bg-[#4A0E17]/95 text-amber-200 border border-[#C59B27]/40 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#E5C058] animate-pulse" />
              <span>{isAr ? "نفذت الكمية" : "Sold Out"}</span>
            </span>
          </div>
        )}

        {/* صورة المنتج */}
        <Image
          src={productImage}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 300px"
          quality={80}
          loading="eager"
          onLoad={() => setImageLoaded(true)}
          className={`object-cover rounded-2xl group-hover:scale-105 transition-all duration-500 ${
            imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"
          } ${isSoldOut ? "grayscale-35 opacity-90" : ""}`}
        />
      </div>

      {/* تفاصيل الاسم */}
      <div className="pt-3 pb-1 space-y-1">
        <h4 className="font-bold text-xs sm:text-sm text-[#2D2321] group-hover:text-[#4A0E17] transition line-clamp-2 leading-tight">
          {title}
        </h4>
      </div>

      {/* الأسعار وزر الإضافة */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs sm:text-sm font-black text-[#4A0E17]">
            {effectiveBasePrice.toFixed(2)} <span className="text-[10px] font-bold">{currencySymbol}</span>
          </span>
          
          {effectiveOriginalPrice > effectiveBasePrice && (
            <span className="text-[10px] text-stone-400 line-through font-medium">
              {effectiveOriginalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* زر الإضافة أو شارة التعطيل عند نفاذ الكمية */}
        {isSoldOut ? (
          <button
            type="button"
            disabled
            className="w-7 h-7 rounded-full bg-stone-200/90 text-stone-400 flex items-center justify-center border border-stone-300/80 cursor-not-allowed"
            title={isAr ? "نفذت الكمية مؤقتاً" : "Out of stock"}
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleQuickAdd}
            className="w-7 h-7 rounded-full bg-[#4A0E17] hover:bg-[#36070E] text-white flex items-center justify-center shadow-md transition transform active:scale-90 hover:scale-110 cursor-pointer"
            title="إضافة للسلة"
          >
            <Plus className="w-4 h-4 font-bold" />
          </button>
        )}
      </div>
    </div>
  );
};
