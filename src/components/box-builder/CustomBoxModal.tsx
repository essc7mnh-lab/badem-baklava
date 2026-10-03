"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  PackagePlus,
  CheckCircle2,
  Loader2,
  Info,
  RotateCcw,
  Search,
  Sparkles
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase/supabase";
import { BoxTier } from "@/types/custom-box";

interface ProductItem {
  id: string | number;
  title_ar?: string;
  title_en?: string;
  title?: string;
  name?: string;
  name_ar?: string; 
  name_en?: string; 
  base_price?: number;
  price?: number;
  image_url?: string;
  image?: string;
  category?: string;
  category_ar?: string;
}

interface BoxSettings {
  pricing_mode: "dynamic" | "fixed";
  packaging_fee: number;
  is_enabled: boolean;
}

export const CustomBoxModal: React.FC = () => {
  const { isMenuOpen, setIsMenuOpen } = useUser();
  const { addToCart, setIsCartOpen } = useCart();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const defaultTiers: BoxTier[] = useMemo(
    () => [
      { id: "box_500g", name_ar: "بوكس ملكي (نصف كيلو)", name_en: "Royal Box (500g)", capacity: 4, price: 45 },
      { id: "box_1000g", name_ar: "بوكس ديوان (1 كيلو)", name_en: "Diwan Box (1kg)", capacity: 8, price: 85 },
      { id: "box_1500g", name_ar: "بوكس كبار الشخصيات (1.5 كيلو)", name_en: "VIP Luxury Box (1.5kg)", capacity: 12, price: 125 },
    ],
    []
  );

  const [tiers, setTiers] = useState<BoxTier[]>(defaultTiers);
  const [selectedTier, setSelectedTier] = useState<BoxTier>(defaultTiers[0]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [boxSelections, setBoxSelections] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [boxSettings, setBoxSettings] = useState<BoxSettings>({
    pricing_mode: "dynamic",
    packaging_fee: 0,
    is_enabled: true,
  });

  // قفل تمرير الصفحة عند فتح النافذة ودعم زر Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, setIsMenuOpen]);

  // جلب البيانات والإعدادات
  useEffect(() => {
    if (!isMenuOpen) return;

    let isMounted = true;

    const fetchBuilderData = async () => {
      setIsLoading(true);
      try {
        const [
          { data: settingsData },
          { data: tiersData },
          { data: prodsData, error: prodsErr },
        ] = await Promise.all([
          supabase.from("box_builder_settings").select("*").eq("id", "default").maybeSingle(),
          supabase.from("custom_box_tiers").select("*").eq("is_active", true).order("price"),
          supabase.from("products").select("*"),
        ]);

        if (isMounted) {
          if (settingsData) {
            setBoxSettings({
              pricing_mode: settingsData.pricing_mode || "dynamic",
              packaging_fee: Number(settingsData.packaging_fee) || 0,
              is_enabled: settingsData.is_enabled ?? true,
            });
          }

          if (tiersData && tiersData.length > 0) {
            setTiers(tiersData);
            setSelectedTier(tiersData[0]);
          }

          if (prodsErr) {
            console.error("Error loading products:", prodsErr);
          } else if (prodsData && prodsData.length > 0) {
            setAvailableProducts(prodsData);
          }
        }
      } catch (err) {
        console.error("Failed to load box builder data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBuilderData();

    return () => {
      isMounted = false;
    };
  }, [isMenuOpen]);

  // استخراج سعر القطعة
  const getProductPrice = useCallback((prod?: ProductItem): number => {
    return Number(prod?.base_price || prod?.price || 0);
  }, []);

  // استخراج اسم الصنف
  const getProductName = useCallback(
    (prod?: ProductItem): string => {
      if (isAr) {
        return prod?.title_ar || prod?.name_ar || prod?.title || prod?.name || "صنف فاخر";
      }
      return prod?.title_en || prod?.name_en || prod?.title || prod?.name || prod?.title_ar || "Luxury Sweet";
    },
    [isAr]
  );

  // العمليات الحسابية المحمية بـ useMemo
  const currentCount = useMemo(() => {
    return Object.values(boxSelections).reduce((sum, count) => sum + count, 0);
  }, [boxSelections]);

  const remainingSlots = Math.max(0, selectedTier.capacity - currentCount);
  const isReady = currentCount === selectedTier.capacity;

  const itemsTotalPrice = useMemo(() => {
    return Object.entries(boxSelections).reduce((sum, [id, qty]) => {
      const prod = availableProducts.find((p) => String(p.id) === String(id));
      return sum + getProductPrice(prod) * qty;
    }, 0);
  }, [boxSelections, availableProducts, getProductPrice]);

  const finalCalculatedPrice = useMemo(() => {
    if (boxSettings.pricing_mode === "dynamic") {
      return itemsTotalPrice + boxSettings.packaging_fee;
    }
    return Number(selectedTier.price);
  }, [boxSettings, itemsTotalPrice, selectedTier]);

  // تصفية المنتجات حسب البحث
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts;
    const query = searchQuery.toLowerCase().trim();
    return availableProducts.filter((prod) => {
      const name = getProductName(prod).toLowerCase();
      return name.includes(query);
    });
  }, [availableProducts, searchQuery, getProductName]);

  // إعداد مصفوفة المعاينة البصرية لحجرات البوكس
  const slotVisualItems = useMemo(() => {
    const slots: Array<{ id: string; name: string; image: string } | null> = [];
    Object.entries(boxSelections).forEach(([id, qty]) => {
      const prod = availableProducts.find((p) => String(p.id) === String(id));
      for (let i = 0; i < qty; i++) {
        slots.push({
          id,
          name: getProductName(prod),
          image: prod?.image_url || prod?.image || "/hero-baklava.png",
        });
      }
    });

    while (slots.length < selectedTier.capacity) {
      slots.push(null);
    }
    return slots;
  }, [boxSelections, availableProducts, selectedTier.capacity, getProductName]);

  const handleAdd = (id: string | number) => {
    const strId = String(id);
    if (remainingSlots <= 0) return;
    setBoxSelections((prev) => ({ ...prev, [strId]: (prev[strId] || 0) + 1 }));
  };

  const handleRemove = (id: string | number) => {
    const strId = String(id);
    if (!boxSelections[strId]) return;
    setBoxSelections((prev) => {
      const updated = { ...prev };
      if (updated[strId] === 1) delete updated[strId];
      else updated[strId] -= 1;
      return updated;
    });
  };

  const handleResetSelections = () => {
    setBoxSelections({});
  };

  const handleAddToCartSecure = () => {
    if (!isReady) return;

    const structuredItems = Object.entries(boxSelections).map(([productId, quantity]) => {
      const prod = availableProducts.find((p) => String(p.id) === String(productId));
      return {
        productId,
        productName: getProductName(prod),
        unitPrice: getProductPrice(prod),
        quantity,
      };
    });

    const summaryText = structuredItems.map((it) => `${it.quantity}× ${it.productName}`).join(" + ");

    const customBoxPayload = {
      id: `box-${selectedTier.id}-${Date.now()}`,
      type: "custom_box",
      tierId: selectedTier.id,
      title: isAr ? selectedTier.name_ar : selectedTier.name_en,
      title_ar: selectedTier.name_ar,
      title_en: selectedTier.name_en,
      price: finalCalculatedPrice,
      quantity: 1,
      image_url: availableProducts[0]?.image_url || availableProducts[0]?.image || "/hero-baklava.png",
      portion: `تشكيلة: ${summaryText}`,
      portionNote: `بوكس مخصص (${selectedTier.capacity} قطع)${
        boxSettings.pricing_mode === "dynamic" && boxSettings.packaging_fee > 0
          ? ` + تغليف ${boxSettings.packaging_fee} ر.س`
          : ""
      }`,
      items: structuredItems,
      summaryText,
    };

    addToCart(customBoxPayload as unknown as Parameters<typeof addToCart>[0]);
    setIsMenuOpen(false);
    setIsCartOpen(true);
    setBoxSelections({});
  };

  if (!isMenuOpen || !selectedTier) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200 select-none">
      {/* خلفية الإغلاق */}
      <div className="absolute inset-0" onClick={() => setIsMenuOpen(false)} />

      <div className="relative w-full max-w-2xl bg-[#FAF5ED] rounded-t-3xl sm:rounded-3xl border border-[#4A0E17]/20 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10 animate-in slide-in-from-bottom duration-300">
        
        {/* الترويسة الملكية */}
        <div className="p-4 sm:p-5 border-b border-[#C59B27]/30 bg-[#4A0E17] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C59B27]/20 border border-[#C59B27]/40 text-[#E5C058] flex items-center justify-center shadow-inner">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wide">
                  {isAr ? "صانع البوكسات  المخصص" : "Royal Custom Box Studio"}
                </h2>
                <span className="text-[10px] bg-[#E5C058]/20 text-[#E5C058] border border-[#E5C058]/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>طازج يومياً</span>
                </span>
              </div>
              <p className="text-[10.5px] text-stone-300 font-medium">
                {isAr
                  ? "اختر تشكيلتك الفاخرة حبة بحبة حسب ذوقك الرفيع"
                  : "Curate your exclusive selection piece by piece"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* محتوى الاختيار والتشكيل */}
        <div className="p-4 sm:p-5 overflow-y-auto no-scrollbar space-y-4 sm:space-y-5">
          
          {/* 1. اختيار حجم وسعة البوكس */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#4A0E17] flex items-center gap-1.5">
                <span>1.</span>
                <span>{isAr ? "اختر حجم وسعة البوكس:" : "Select Box Size:"}</span>
              </label>
              {currentCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetSelections}
                  className="text-[11px] font-bold text-stone-500 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isAr ? "تفريغ البوكس" : "Reset"}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {tiers.map((t) => {
                const isSelected = selectedTier.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      if (selectedTier.id !== t.id) {
                        setSelectedTier(t);
                        setBoxSelections({});
                      }
                    }}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "bg-[#4A0E17] text-white border-[#4A0E17] shadow-md scale-[1.02]"
                        : "bg-white border-stone-200/90 text-stone-800 hover:border-[#4A0E17]/40"
                    }`}
                  >
                    <span className="text-[11px] sm:text-xs font-black block leading-tight">
                      {isAr ? t.name_ar : t.name_en}
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-black block mt-1 ${
                        isSelected ? "text-[#E5C058]" : "text-[#4A0E17]"
                      }`}
                    >
                      {boxSettings.pricing_mode === "dynamic"
                        ? isAr
                          ? `سعة ${t.capacity} قطع`
                          : `${t.capacity} pcs`
                        : `${t.price} ر.س`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
{/* 2. مؤشر امتلاء البوكس والأصناف المختارة بشكل مدمج وفاخر */}
          <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-2.5">
            
            {/* الترويسة والعداد */}
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-stone-800 flex items-center gap-1.5">
                <span>{isAr ? "سعة البوكس:" : "Box Capacity:"}</span>
                <span className="font-mono text-[#4A0E17] bg-[#FAF5ED] px-2 py-0.5 rounded-md border border-stone-200/60">
                  {currentCount} من {selectedTier.capacity} قطع
                </span>
              </span>

              <span
                className={`text-[11px] font-black ${
                  isReady ? "text-emerald-700 flex items-center gap-1" : "text-[#4A0E17]"
                }`}
              >
                {isReady ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isAr ? "البوكس مكتمل ✨" : "Box Complete ✨"}</span>
                  </>
                ) : isAr ? (
                  `متبقي ${remainingSlots} قطع`
                ) : (
                  `${remainingSlots} slots left`
                )}
              </span>
            </div>

            {/* شريط الحجرات المدمج - يوضح كل حبة بلون ذهبي أنيق */}
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${selectedTier.capacity}, minmax(0, 1fr))` }}>
              {Array.from({ length: selectedTier.capacity }).map((_, index) => {
                const isFilled = index < currentCount;
                return (
                  <div
                    key={index}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isFilled
                        ? "bg-gradient-to-r from-[#C59B27] to-[#4A0E17] shadow-xs"
                        : "bg-stone-200/80"
                    }`}
                  />
                );
              })}
            </div>

            {/* كبسولات الأصناف المضافة فقط (بدون صور ضخمة أو تكرار) */}
            {currentCount > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-100">
                <span className="text-[10px] text-stone-400 font-bold ml-1">
                  {isAr ? "المختار:" : "Selected:"}
                </span>

                {Object.entries(boxSelections).map(([id, qty]) => {
                  const prod = availableProducts.find((p) => String(p.id) === String(id));
                  const name = getProductName(prod);
                  return (
                    <div
                      key={id}
                      className="inline-flex items-center gap-1.5 bg-[#FAF5ED] border border-[#4A0E17]/15 text-[#4A0E17] text-[10.5px] font-bold px-2.5 py-1 rounded-xl shadow-2xs animate-in zoom-in-95 duration-150"
                    >
                      <span className="font-mono font-black text-amber-800">{qty}×</span>
                      <span className="truncate max-w-[120px]">{name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(id)}
                        className="text-stone-400 hover:text-rose-600 transition cursor-pointer pr-0.5"
                        title={isAr ? "حذف حبة" : "Remove one"}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* 3. قائمة الأصناف والحلويات مع شريط البحث */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black text-[#4A0E17] flex items-center gap-1.5">
                <span>2.</span>
                <span>{isAr ? "حدد أصنافك وتشكيلتك المفضلة:" : "Select your sweets:"}</span>
              </label>

              {boxSettings.pricing_mode === "dynamic" && (
                <span className="text-[10px] text-stone-500 font-bold flex items-center gap-1 bg-[#FAF5ED] px-2 py-1 rounded-lg border border-stone-200/60 w-fit">
                  <Info className="w-3 h-3 text-[#C59B27]" />
                  <span>{isAr ? "يحسب السعر بمجموع القطع المختارة" : "Price calculates per selected item"}</span>
                </span>
              )}
            </div>

            {/* شريط البحث المباشر */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? "ابحث عن نوع بقلاوة معين (برمة، شوكولاتة، أصابع...)" : "Search sweets..."}
                className="w-full bg-white border border-stone-200 rounded-xl pr-8 pl-3 py-2 text-xs font-bold text-stone-800 placeholder:text-stone-400 focus:outline-hidden focus:border-[#4A0E17] transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* عرض المنتجات */}
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#4A0E17]" />
                <span className="text-xs font-bold">{isAr ? "جاري تحميل الأصناف الطازجة..." : "Loading sweets..."}</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-stone-200 text-center text-xs text-stone-500 font-bold">
                {isAr ? "لم نجد أصنافاً مطابقة للبحث." : "No matching sweets found."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[36vh] overflow-y-auto no-scrollbar pr-0.5">
                {filteredProducts.map((prod) => {
                  const count = boxSelections[String(prod.id)] || 0;
                  const name = getProductName(prod);
                  const price = getProductPrice(prod);
                  const img = prod.image_url || prod.image || "/hero-baklava.png";

                  return (
                    <div
                      key={prod.id}
                      className={`p-2.5 bg-white rounded-2xl border flex items-center justify-between gap-2 shadow-2xs transition-all ${
                        count > 0 ? "border-[#4A0E17]/40 bg-[#FAF5ED]/30" : "border-stone-200/80 hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-black/5 shrink-0 bg-stone-100">
                          <Image
                            src={img}
                            alt={name}
                            fill
                            sizes="44px"
                            quality={80}
                            loading="lazy"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-stone-900 truncate block">{name}</span>
                          {boxSettings.pricing_mode === "dynamic" && (
                            <span className="text-[10.5px] text-[#C59B27] font-black block">
                              {price.toFixed(2)} ر.س
                            </span>
                          )}
                        </div>
                      </div>

                      {/* أزرار الإضافة والتنقيص */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRemove(prod.id)}
                          disabled={count === 0}
                          className="w-7 h-7 rounded-lg bg-stone-100 disabled:opacity-25 flex items-center justify-center text-stone-700 cursor-pointer hover:bg-stone-200 active:scale-95 transition"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-4 text-center font-mono font-black text-xs text-[#4A0E17]">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdd(prod.id)}
                          disabled={remainingSlots === 0}
                          className="w-7 h-7 rounded-lg bg-[#4A0E17] disabled:opacity-25 text-white flex items-center justify-center cursor-pointer shadow-2xs hover:bg-[#34050D] active:scale-95 transition"
                          aria-label="Increase"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ذيل النافذة: تفصيل السعر التراكمي وزر الإضافة للسلة */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-4 shadow-md">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-stone-400 font-bold">{isAr ? "المبلغ الإجمالي" : "Total Price"}</span>
              {boxSettings.pricing_mode === "dynamic" && (
                <span className="text-[9px] text-emerald-700 font-black bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                  {boxSettings.packaging_fee > 0
                    ? `+ ${boxSettings.packaging_fee} ر.س تغليف`
                    : isAr
                    ? "التغليف  مجاناً"
                    : "Free packaging"}
                </span>
              )}
            </div>
            <span className="text-lg font-black text-[#4A0E17]">
              {finalCalculatedPrice.toFixed(2)} ر.س
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddToCartSecure}
            disabled={!isReady}
            className={`flex-1 py-3.5 px-5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
              isReady
                ? "bg-[#4A0E17] hover:bg-[#34050D] text-white active:scale-98 shadow-[#4A0E17]/20"
                : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
            }`}
          >
            {isReady ? <CheckCircle2 className="w-4 h-4 text-[#E5C058]" /> : <ShoppingBag className="w-4 h-4" />}
            <span>
              {isReady
                ? isAr
                  ? "إضافة البوكس المخصص للسلة 🛒"
                  : "Add Custom Box to Cart 🛒"
                : isAr
                ? `أكمل ${remainingSlots} قطع لإضافة البوكس`
                : `Select ${remainingSlots} more pieces`}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};