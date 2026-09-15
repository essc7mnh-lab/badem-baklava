"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Heart, Clock } from "lucide-react";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useToast } from "@/context/ToastContext";
import { royalSound } from "@/lib/sound";

interface ExtendedProduct extends Product {
  is_available?: boolean;
  isOutOfStock?: boolean;
  is_out_of_stock?: boolean;
}

interface ProductCardProps {
  product: ExtendedProduct;
  onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetail }) => {
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useWishlist();
  const { showToast } = useToast();

  const [imageLoaded, setImageLoaded] = useState(false);

  const title = language === "ar" ? product.titleAr : product.titleEn;
  const currencySymbol = language === "ar" ? "ر.س " : "SAR ";
  const favorited = isFavorite(product.id);

  // التحقق من حالة نفاذ الكمية
  const isSoldOut = Boolean(
    product.is_available === false ||
    product.isOutOfStock === true ||
    product.is_out_of_stock === true
  );

  // حساب نسبة الخصم الحقيقية إذا وجدت
  const discountPercent =
    product.hasDiscount && product.originalPrice && product.originalPrice > product.basePrice
      ? Math.round(((product.originalPrice - product.basePrice) / product.originalPrice) * 100)
      : null;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = toggleFavorite(product.id);
    if (added) {
      showToast(
        language === "ar" ? `تمت إضافة "${title}" إلى المفضلة ❤️` : `Added "${title}" to wishlist ❤️`,
        "favorite"
      );
    } else {
      showToast(
        language === "ar" ? `تمت الإزالة من المفضلة` : `Removed from wishlist`,
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
        price: product.basePrice,
        image: product.image,
        portionNote: language === "ar" ? "ربع كيلو (250g)" : "250g",
      },
      e
    );
    showToast(
      language === "ar" ? `تمت إضافة "${title}" إلى السلة 🛍️` : `Added "${title}" to cart 🛍️`,
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

        {/* شارة نفدت الكمية العائمة على الصورة من الخارج */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1.5px] z-10 flex items-center justify-center p-2">
            <span className="bg-[#4A0E17]/95 text-amber-200 border border-[#C59B27]/40 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#E5C058] animate-pulse" />
              <span>{language === "ar" ? "نفدت الكمية" : "Sold Out"}</span>
            </span>
          </div>
        )}

        {/* صورة المنتج */}
        <Image
          src={product.image || "/hero-baklava.png"}
          alt={title || "صنف فاخر"}
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
            {product.basePrice.toFixed(2)} <span className="text-[10px] font-bold">{currencySymbol}</span>
          </span>
          
          {product.originalPrice && product.originalPrice > product.basePrice && (
            <span className="text-[10px] text-stone-400 line-through font-medium">
              {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* زر الإضافة أو شارة التعطيل عند نفاذ الكمية */}
        {isSoldOut ? (
          <button
            type="button"
            disabled
            className="w-7 h-7 rounded-full bg-stone-200/90 text-stone-400 flex items-center justify-center border border-stone-300/80 cursor-not-allowed"
            title={language === "ar" ? "نفدت الكمية مؤقتاً" : "Out of stock"}
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