"use client";

import React, { useState, useEffect, useId, useMemo } from "react";
import Image from "next/image";
import {
  X,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  Star,
  MessageSquare,
  CheckCircle,
  Loader2,
  Send,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Product } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase/supabase";

// واجهة متكاملة تجمع صيغ الفرونت إند وقاعدة البيانات معاً لمنع أخطاء TypeScript
export interface ExtendedProduct extends Product {
  images?: string[];
  image_urls?: string[];
  image_url?: string;
  is_available?: boolean; 
  is_out_of_stock?: boolean;
  isOutOfStock?: boolean;
  base_price?: number | string;
  price?: number | string;
  title_ar?: string;
  title_en?: string;
  description_ar?: string | null;
  description_en?: string | null;
}

interface IngredientModalProps {
  product: ExtendedProduct | null;
  onClose: () => void;
}

interface ReviewItem {
  id: string;
  customer_name: string;
  customer_phone?: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface IngredientObject {
  icon?: string;
  nameAr?: string;
  name_ar?: string;
  nameEn?: string;
  name_en?: string;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({ product, onClose }) => {
  const { language, t } = useLanguage();
  const isAr = language === "ar";
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();
  const { userName, userPhone } = useUser();
  const reviewInputId = useId();

  // مؤشر الصورة الحالية
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [multiplier, setMultiplier] = useState(1);
  const [selectedWeightLabel, setSelectedWeightLabel] = useState(
    isAr ? "ربع كيلو (250g)" : "250g Quarter"
  );
  const [userRating, setUserRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // استخراج قائمة الصور
  const imagesList = useMemo<string[]>(() => {
    if (!product) return ["/hero-baklava.png"];

    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.filter(Boolean);
    }
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls.filter(Boolean);
    }
    const single = product.image || product.image_url;
    return single ? [single] : ["/hero-baklava.png"];
  }, [product]);

  const isSoldOut = Boolean(
  product?.is_available === false ||
  product?.isOutOfStock === true ||
  product?.is_out_of_stock === true
);

  // إعادة ضبط الحالة بشكل غير متزامن لتفادي أخطاء React
  useEffect(() => {
    if (!product?.id) return;

    const resetTimer = setTimeout(() => {
      setCurrentImageIndex(0);
      setMultiplier(1);
      setSelectedWeightLabel(isAr ? "ربع كيلو (250g)" : "250g Quarter");
      setUserRating(5);
      setNewComment("");
      setReviewerName("");
    }, 0);

    return () => clearTimeout(resetTimer);
  }, [product?.id, isAr]);

  // إغلاق النافذة بزر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // جلب تقييمات المنتج
  useEffect(() => {
    if (!product?.id) return;
    let isMounted = true;

    const fetchProductReviews = async () => {
      setLoadingReviews(true);
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", product.id)
          .order("created_at", { ascending: false });

        if (isMounted && data && !error) {
          setReviewsList(data as ReviewItem[]);
        }
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        if (isMounted) setLoadingReviews(false);
      }
    };

    const timer = setTimeout(() => {
      void fetchProductReviews();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [product?.id]);

  if (!product) return null;

  const basePrice = Number(product.basePrice ?? product.base_price ?? product.price ?? 0);
  const currentPrice = basePrice * multiplier;
  const productTitleAr = product.titleAr || product.title_ar || "صنف فاخر";
  const productTitleEn = product.titleEn || product.title_en || "Signature Item";
  const productDescAr = product.descriptionAr || product.description_ar;
  const productDescEn = product.descriptionEn || product.description_en;
  const productIngredients: IngredientObject[] = Array.isArray(product.ingredients)
    ? (product.ingredients as IngredientObject[])
    : [];

  const averageRating =
    reviewsList.length > 0
      ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1)
      : "5.0";

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  const handleSelectPortion = (mult: number, labelAr: string, labelEn: string) => {
    setMultiplier(mult);
    setSelectedWeightLabel(isAr ? labelAr : labelEn);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    if (isSoldOut) return;

    addToCart(
      {
        id: product.id,
        title: isAr ? productTitleAr : productTitleEn,
        price: currentPrice,
        image: imagesList[0] || "/hero-baklava.png",
        portionNote: selectedWeightLabel,
      },
      e
    );
    showToast(isAr ? "تمت إضافة الصنف إلى السلة بنجاح! ✨" : "Added to cart successfully!", "success");
    onClose();
    setIsCartOpen(true);
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !product?.id) return;

    const finalName = reviewerName.trim() || userName.trim();
    const finalPhone = userPhone?.trim() || "";

    if (!finalName || !finalPhone) {
      showToast(
        isAr
          ? "يرجى تسجيل اسمك ورقم هاتفك (من ملفك الشخصي) للمشاركة بالتقييم"
          : "Please update your profile name and phone first",
        "error"
      );
      return;
    }

    setSubmittingReview(true);
    try {
      const { data: existingReviews, error: countError } = await supabase
        .from("reviews")
        .select("id")
        .eq("product_id", product.id)
        .eq("customer_phone", finalPhone);

      if (countError) throw countError;

      if (existingReviews && existingReviews.length >= 2) {
        showToast(
          isAr
            ? "عذراً، لقد وصلت الحد الأقصى المسموح (تعليقين اثنين) لهذا المنتج."
            : "Sorry, you have reached the maximum limit of 2 reviews for this product.",
          "error"
        );
        setSubmittingReview(false);
        return;
      }

      const { data, error } = await supabase
        .from("reviews")
        .insert([
          {
            product_id: product.id,
            customer_name: finalName,
            customer_phone: finalPhone,
            rating: userRating,
            comment: newComment.trim(),
          },
        ])
        .select()
        .single();

      if (data && !error) {
        setReviewsList((prev) => [data as ReviewItem, ...prev]);
        setNewComment("");
        setReviewerName("");
        showToast(
          isAr
            ? "شكراً لتقييمك! تم حفظ ونشر رأيك بنجاح 🌟"
            : "Thank you! Review posted successfully 🌟",
          "success"
        );
      } else {
        throw error;
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      showToast(isAr ? "تعذر إرسال التقييم، يرجى المحاولة لاحقاً" : "Failed to post review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? productTitleAr : productTitleEn}
    >
      {/* خلفية الإغلاق */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close modal overlay"
      />

      <div className="bg-[#FAF5ED] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[92vh] flex flex-col relative z-10 text-[#2D2321] animate-in zoom-in-95 duration-200">
        
        {/* الترويسة الملكية */}
        <div className="relative bg-[#4A0E17] text-white text-center pt-6 pb-4 px-4 border-b border-[#C59B27]/30 shadow-xs">
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? "إغلاق" : "Close"}
            className="absolute top-4 left-4 rtl:left-4 rtl:right-auto ltr:right-4 ltr:left-auto z-20 w-9 h-9 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5 font-bold" />
          </button>

          <span className="block text-[9.5px] tracking-[0.25em] text-[#E5C058] font-black uppercase font-brand">
            BADEM SIGNATURE RECIPE
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 drop-shadow-xs">
            {isAr ? productTitleAr : productTitleEn}
          </h2>
          <p className="text-xs sm:text-sm tracking-[0.2em] font-brand font-bold text-stone-300 uppercase mt-0.5">
            {productTitleEn}
          </p>
        </div>

        {/* المحتوى الداخلي */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5 flex-1 overscroll-contain">
          
          {/* 1. تفكيك المكونات الطبيعية */}
          {productIngredients.length > 0 && (
            <section className="space-y-2" aria-label="Ingredients">
              <div className="text-center text-xs text-[#4A0E17] font-bold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C59B27]" />
                <span>{isAr ? "تفكيك المكونات الطبيعية 100%" : "100% Pure Natural Ingredients"}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {productIngredients.map((ing, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-2.5 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col items-center justify-center"
                  >
                    <span className="text-2xl mb-1">{ing.icon || "✨"}</span>
                    <span className="text-[10px] font-bold text-stone-700 leading-tight">
                      {isAr ? ing.nameAr || ing.name_ar : ing.nameEn || ing.name_en}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. بطاقة الصورة الكبيرة المتجاوبة مع السلايدر */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-2xs border border-stone-200/90 flex flex-col items-center">
            
            <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden shadow-sm border border-stone-200/60 bg-[#F7F2EB] group">
              <Image
                src={imagesList[currentImageIndex] || "/hero-baklava.png"}
                alt={`${isAr ? productTitleAr : productTitleEn} - ${currentImageIndex + 1}`}
                fill
                priority
                quality={90}
                sizes="(max-width: 640px) 100vw, 550px"
                className={`object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
                  isSoldOut ? "grayscale-35 opacity-90" : ""
                }`}
              />

              {/* 🌟 شارة نفدت الكمية الملكية العائمة */}
              {isSoldOut && (
                <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] z-10 flex items-center justify-center p-4">
                  <div className="bg-[#4A0E17]/95 border border-[#C59B27]/60 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-center animate-in zoom-in-95">
                    <Clock className="w-4 h-4 text-[#E5C058] shrink-0 animate-pulse" />
                    <div>
                      <span className="text-xs sm:text-sm font-black text-amber-200 block">
                        {isAr ? "نفدت الكمية مؤقتاً" : "Temporarily Sold Out"}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-stone-200 font-medium">
                        {isAr ? "نخبز دفعة طازجة قادمة قريباً من الفرن ✨" : "A fresh batch is baking soon in the oven"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* أسهم التنقل بين الصور */}
              {imagesList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    aria-label="Previous Image"
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-[#4A0E17] text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-md active:scale-90"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    aria-label="Next Image"
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-[#4A0E17] text-white backdrop-blur-md flex items-center justify-center border border-white/20 transition-all cursor-pointer shadow-md active:scale-90"
                  >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>

                  {/* شريط النقاط السفلية */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10 shadow-xs">
                    {imagesList.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImageIndex(idx);
                        }}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`transition-all rounded-full cursor-pointer ${
                          currentImageIndex === idx
                            ? "w-4 h-1.5 bg-[#E5C058]"
                            : "w-1.5 h-1.5 bg-white/60 hover:bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {(productDescAr || productDescEn) && (
              <p className="text-xs text-stone-600 text-center mt-3 leading-relaxed px-2 font-medium">
                {isAr ? productDescAr : productDescEn}
              </p>
            )}
          </div>

          {/* 3. خيارات الوزن والتغليف */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-[#4A0E17]">
              {isAr ? "اختر الوزن والتغليف الملكي:" : "Select Portion & Packaging:"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPortion(1, "ربع كيلو (250g)", "250g Quarter")}
                className={`p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                  multiplier === 1
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] shadow-xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{t("portionQuarter")}</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">8 - 10 قطع</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPortion(1.85, "نصف كيلو (500g)", "500g Half")}
                className={`p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                  multiplier === 1.85
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] shadow-xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{t("portionHalf")}</span>
                <span className="text-[10px] text-stone-400 block mt-0.5">16 - 20 قطعة</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPortion(3.5, "1 كجم فاخر (صندوق خشبي)", "1 Kg Royal Box")}
                className={`p-3 rounded-2xl text-center transition-all border cursor-pointer ${
                  multiplier === 3.5
                    ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 text-[#4A0E17] shadow-xs"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                <span className="block text-xs font-black">{t("portionKilo")}</span>
                <span className="text-[10px] text-[#C59B27] font-black block mt-0.5">بوكس إهداء فاخر</span>
              </button>
            </div>
          </div>

          {/* 4. تجارب وتقييمات العملاء */}
          <div className="bg-white rounded-3xl p-5 border border-stone-200/90 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-[#C59B27]" />
                  </div>
                  <h4 className="text-xs font-black text-stone-900">
                    {isAr ? "تقييمات وتجارب العملاء الملكية" : "Royal Customer Reviews"}
                  </h4>
                </div>
                <p className="text-[10px] text-stone-400 mt-0.5">
                  {isAr ? "آراء حقيقية من عملائنا الذواقين" : "Genuine feedback from our valued connoisseurs"}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#FAF5ED] px-3.5 py-2 rounded-2xl border border-stone-200/60">
                <div className="flex items-center text-amber-500 gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-black text-[#4A0E17] font-mono">
                  {averageRating} <span className="text-[10px] font-normal text-stone-400">/ 5.0</span>
                </span>
              </div>
            </div>

            {loadingReviews ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-stone-400">
                <Loader2 className="w-5 h-5 animate-spin text-[#4A0E17]" />
                <span className="text-[11px] font-bold">
                  {isAr ? "جاري تحميل آراء الذواقين..." : "Loading reviews..."}
                </span>
              </div>
            ) : reviewsList.length === 0 ? (
              <div className="text-center py-8 bg-[#FAF5ED]/40 rounded-2xl border border-dashed border-stone-200 space-y-1.5">
                <Star className="w-8 h-8 mx-auto text-[#C59B27]/50 stroke-1" />
                <p className="text-xs font-bold text-stone-700">
                  {isAr ? "كن أول من يقيم هذا الصنف الملكي!" : "Be the first to review this royal item!"}
                </p>
                <p className="text-[10px] text-stone-400">
                  {isAr ? "شاركنا انطباعك بعد التذوق أدناه." : "Share your experience below."}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar overscroll-contain pr-1">
                {reviewsList.map((rev) => (
                  <div 
                    key={rev.id} 
                    className="bg-[#FAF5ED]/60 p-3.5 rounded-2xl border border-stone-200/80 space-y-2 transition hover:bg-[#FAF5ED]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#4A0E17] text-[#E5C058] flex items-center justify-center font-black text-[10px]">
                          {(rev.customer_name || "ع")[0]}
                        </div>
                        <span className="text-xs font-black text-stone-800">{rev.customer_name}</span>
                        <span 
                          title={isAr ? "مشتري مؤكد" : "Verified Buyer"} 
                          className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200/60"
                        >
                          <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{isAr ? "مشتري مؤكد" : "Verified"}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString(isAr ? "ar-SA" : "en-US") : ""}
                      </span>
                    </div>

                    <div className="flex gap-0.5">
                      {Array.from({ length: Number(rev.rating) || 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>

                    <p className="text-xs text-stone-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-stone-100 font-medium">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* نموذج إضافة تقييم جديد */}
            <form onSubmit={handleAddReview} className="space-y-3 pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between bg-[#FAF5ED] p-3 rounded-2xl border border-stone-200/60">
                <span className="text-xs font-black text-[#4A0E17]">
                  {isAr ? "تقييمك الشخصي للصنف:" : "Your personal rating:"}
                </span>
                <div className="flex gap-1.5" role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      aria-label={`${star} Stars`}
                      className="p-1 cursor-pointer hover:scale-125 active:scale-95 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          star <= userRating ? "text-amber-400 fill-amber-400 drop-shadow-xs" : "text-stone-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {!userName && (
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder={isAr ? "اسمك الكريم (اختياري)..." : "Your name (optional)..."}
                  className="w-full bg-[#FAF5ED] border border-stone-200 rounded-2xl px-3.5 py-2.5 text-xs focus:outline-hidden focus:border-[#4A0E17] font-bold"
                />
              )}

              <div className="flex gap-2">
                <label htmlFor={reviewInputId} className="sr-only">
                  {isAr ? "اكتب انطباعك وتجربتك بالتذوق" : "Write your review"}
                </label>
                <input
                  id={reviewInputId}
                  type="text"
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isAr ? "اكتب انطباعك وتجربتك بالتذوق..." : "Write your tasting review here..."}
                  className="flex-1 bg-[#FAF5ED] border border-stone-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-hidden focus:border-[#4A0E17] font-medium"
                />
                <button
                  type="submit"
                  disabled={submittingReview || !newComment.trim()}
                  className="bg-[#4A0E17] hover:bg-[#36070E] active:scale-95 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-md shrink-0"
                >
                  {submittingReview ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#C59B27]" />
                  ) : (
                    <Send className="w-4 h-4 text-[#C59B27]" />
                  )}
                  <span>{submittingReview ? (isAr ? "جاري..." : "Posting...") : isAr ? "نشر التقييم" : "Post Review"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* 5. تنبيه مسببات الحساسية */}
          <div className="flex items-start gap-2.5 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              {isAr
                ? "تنبيه مسببات الحساسية: يحتوي هذا الصنف على الفستق الحلبي، المكسرات، ومشتقات القمح والحليب والسمن البقري الطبيعي."
                : "Allergen Warning: Contains tree nuts, wheat, dairy, and natural ghee."}
            </span>
          </div>

        </div>

        {/* شريط الإضافة للسلة النهائي */}
        <div className="p-4 bg-[#4A0E17] text-white border-t border-[#C59B27]/30 flex items-center justify-between gap-4 shadow-lg">
          <div>
            <span className="block text-[10px] text-stone-300 font-bold uppercase tracking-wider">
              {t("total")}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white">{currentPrice.toFixed(2)}</span>
              <span className="text-xs font-bold text-[#E5C058]">{t("currency")}</span>
            </div>
          </div>

          {isSoldOut ? (
            <div
              className="flex-1 bg-stone-800/90 text-amber-200/80 border border-amber-500/30 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-inner select-none cursor-not-allowed opacity-90 text-xs sm:text-sm"
              title={isAr ? "هذا الصنف غير متوفر حالياً" : "Currently out of stock"}
            >
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{isAr ? "نفدت الكمية الملكية (انتظرونا قريباً)" : "Sold Out (Coming Soon)"}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 bg-[#C59B27] hover:bg-[#E5C058] active:scale-95 text-[#4A0E17] font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 font-bold" />
              <span>{t("addToCart")}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};