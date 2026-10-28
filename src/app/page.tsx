"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Search, Gift, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { PromoCarousel } from "@/components/banner/PromoCarousel";
import { BrandStoryMarquee } from "@/components/banner/BrandStoryMarquee";
import { ProductCard } from "@/components/product/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { Product } from "@/types";
import { supabase } from "@/lib/supabase/supabase";

// 🚀 تحميل النوافذ المنبثقة بشكل ديناميكي (Lazy Loading) لتسريع الفتح الأولي بنسبة 50%
const IngredientModal = dynamic(
  () => import("@/components/product/IngredientModal").then((mod) => mod.IngredientModal),
  { ssr: false }
);
const CartDrawer = dynamic(
  () => import("@/components/cart/CartDrawer").then((mod) => mod.CartDrawer),
  { ssr: false }
);
const CheckoutSystem = dynamic(
  () => import("@/components/checkout/CheckoutSystem").then((mod) => mod.CheckoutSystem),
  { ssr: false }
);
const ProfileModal = dynamic(
  () => import("@/components/profile/ProfileModal").then((mod) => mod.ProfileModal),
  { ssr: false }
);
const RewardsModal = dynamic(
  () => import("@/components/rewards/RewardsModal").then((mod) => mod.RewardsModal),
  { ssr: false }
);
const NotificationModal = dynamic(
  () => import("@/components/notifications/NotificationModal").then((mod) => mod.NotificationModal),
  { ssr: false }
);
const CustomBoxModal = dynamic(
  () => import("@/components/box-builder/CustomBoxModal").then((mod) => mod.CustomBoxModal),
  { ssr: false }
);

interface CategoryItem {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  image_url: string;
  sort_order?: number;
}

interface RawSupabaseProduct {
  id: string;
  title_ar: string;
  title_en: string;
  category_slug: string;
  base_price: string | number;
  original_price?: string | number | null;
  has_discount?: boolean | null;
  image_url: string;
  images?: string[];
  is_available?: boolean;
  description_ar?: string | null;
  description_en?: string | null;
  ingredients?: Product["ingredients"];
  has_weights?: boolean | null;
}

// ⚡ كاش محلي ذكي فائق السرعة
const CACHE_KEYS = {
  PRODUCTS: "badem_cached_products_v2",
  CATEGORIES: "badem_cached_categories_v2",
  TIMESTAMP: "badem_cache_timestamp_v2",
};
const CACHE_DURATION_MS = 3 * 60 * 1000; // تحديث صامت كل 3 دقائق

export default function Home() {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const { setIsRewardsOpen } = useUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // حالات البيانات
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 جلب البيانات مع دعم التخزين المؤقت وفك تعارض الـ Render
  useEffect(() => {
    let isMounted = true;

    // 1. استرجاع الكاش لفتح الصفحة فوراً بـ 0 ثانية
    const cacheTimer = setTimeout(() => {
      try {
        const cachedProd = localStorage.getItem(CACHE_KEYS.PRODUCTS);
        const cachedCat = localStorage.getItem(CACHE_KEYS.CATEGORIES);

        if (cachedProd && cachedCat && isMounted) {
          setProductsData(JSON.parse(cachedProd));
          setCategories(JSON.parse(cachedCat));
          setIsLoading(false);
        }
      } catch {
        // تجاوز صامت
      }
    }, 0);

    // 2. مزامنة البيانات في الخلفية بهدوء
    const fetchData = async () => {
      try {
        // إذا كان الكاش حديثاً، لا نرسل استعلاماً لقاعدة البيانات لتوفير الموارد
        const cachedTime = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
        const cachedProd = localStorage.getItem(CACHE_KEYS.PRODUCTS);
        if (cachedTime && cachedProd && Date.now() - Number(cachedTime) < CACHE_DURATION_MS) {
          return;
        }

        const [{ data: prodData, error: prodError }, { data: catData }] = await Promise.all([
          supabase.from("products").select("*").order("created_at", { ascending: false }),
          supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        ]);

        if (isMounted) {
          let formattedList: Product[] = [];

          if (prodData && !prodError) {
            const rawList = prodData as unknown as RawSupabaseProduct[];
            formattedList = rawList.map((d) => ({
              id: d.id,
              titleAr: d.title_ar,
              titleEn: d.title_en,
              category: d.category_slug,
              basePrice:
                typeof d.base_price === "number"
                  ? d.base_price
                  : parseFloat(d.base_price) || 0,
              originalPrice: d.original_price
                ? typeof d.original_price === "number"
                  ? d.original_price
                  : parseFloat(d.original_price)
                : undefined,
              hasDiscount: Boolean(d.has_discount),
              image: d.image_url,
              images: Array.isArray(d.images) && d.images.length > 0 ? d.images : [d.image_url],
              is_available: d.is_available ?? true,
              isOutOfStock: d.is_available === false,
              descriptionAr: d.description_ar || "",
              descriptionEn: d.description_en || "",
              ingredients: (d.ingredients || []) as NonNullable<Product["ingredients"]>,
              has_weights: d.has_weights ?? true,
            }));

            setProductsData(formattedList);
          }

          let formattedCats: CategoryItem[] = [];
          if (catData && catData.length > 0) {
            formattedCats = catData as CategoryItem[];
            setCategories(formattedCats);
          }

          // حفظ البيانات في الكاش السريع
          try {
            if (formattedList.length > 0) {
              localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(formattedList));
            }
            if (formattedCats.length > 0) {
              localStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(formattedCats));
            }
            localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
          } catch {
            // تجاوز صامت
          }
        }
      } catch (err) {
        console.error("Error loading store data:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      clearTimeout(cacheTimer);
    };
  }, []);

  // 🎯 فلترة وترتيب المنتجات حسب أولوية الأقسام (O(1) Map)
  const filteredProducts = useMemo(() => {
    const categoryOrderMap = new Map<string, number>();
    categories.forEach((cat, index) => {
      categoryOrderMap.set(cat.slug, cat.sort_order ?? index);
    });

    const cleanSearch = searchQuery.toLowerCase().trim().slice(0, 100);

    const filtered = productsData.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchSearch =
        !cleanSearch ||
        p.titleAr?.toLowerCase().includes(cleanSearch) ||
        p.titleEn?.toLowerCase().includes(cleanSearch);
      return matchCat && matchSearch;
    });

    // عند اختيار "الكل"، تعرض منتجات الأقسام حسب تسلسلها
    if (selectedCategory === "All") {
      return [...filtered].sort((a, b) => {
        const orderA = categoryOrderMap.get(a.category) ?? 9999;
        const orderB = categoryOrderMap.get(b.category) ?? 9999;
        return orderA - orderB;
      });
    }

    return filtered;
  }, [productsData, categories, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F4ECE1] text-[#2D2321] pb-3 md:pb-0 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="w-full max-w-md md:max-w-6xl mx-auto px-3 sm:px-4 py-4 space-y-6 flex-1">
        <h1 className="sr-only">متجر بادم للبقلاوة الفاخرة</h1>

        {/* شريط البحث التفاعلي الفوري (Live Search مع قائمة منسدلة) */}
        <div className="relative w-full z-30">
          <input
            type="text"
            maxLength={100}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? "ابحث عن البقلاوة، أصابع الفستق، أو بوكسات الهدايا..."
                : "Search baklava, pistachio rolls, gift boxes..."
            }
            className="w-full bg-[#FAF5ED] border border-[#4A0E17]/20 rounded-2xl py-3 pr-11 pl-10 rtl:pr-11 rtl:pl-10 ltr:pl-11 ltr:pr-10 text-xs md:text-sm font-medium focus:outline-hidden focus:border-[#4A0E17] shadow-xs placeholder:text-stone-400 transition"
          />
          <Search className="w-4 h-4 md:w-5 md:h-5 text-stone-400 absolute top-1/2 -translate-y-1/2 right-3.5 rtl:right-3.5 ltr:left-3.5 pointer-events-none" />
          
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 -translate-y-1/2 left-3.5 rtl:left-3.5 rtl:right-auto ltr:right-3.5 ltr:left-auto text-stone-400 hover:text-stone-600 text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          )}

          {/* 🔍 القائمة المنسدلة الذكية لنتائج البحث الفورية */}
          {searchQuery.trim().length >= 1 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#FAF5ED] rounded-2xl border border-[#4A0E17]/20 shadow-2xl overflow-hidden max-h-80 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-200 p-2 space-y-1.5">
              <div className="px-3 py-1 flex items-center justify-between text-[10.5px] font-bold text-stone-500 border-b border-stone-200">
                <span>{isAr ? "النتائج المطابقة السريعة:" : "Quick Matches:"}</span>
                <span className="text-[#4A0E17] font-black">{filteredProducts.length} صنف</span>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-400 font-bold">
                  {isAr ? "لم نجد أصنافاً مطابقة لبحثك." : "No matching items found."}
                </div>
              ) : (
                filteredProducts.slice(0, 6).map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      setActiveProduct(prod);
                      setSearchQuery("");
                    }}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 border border-black/5">
                        <Image
                          src={prod.image || "/hero-baklava.png"}
                          alt={prod.titleAr}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-stone-800 group-hover:text-[#4A0E17] transition">
                          {isAr ? prod.titleAr : prod.titleEn}
                        </h5>
                        <span className="text-[10px] text-stone-400 font-medium">
                          {prod.has_weights !== false ? (isAr ? "متوفر بالأوزان ⚖️" : "Weights available") : (isAr ? "صنف فردي" : "Single item")}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-[#4A0E17] font-mono">
                      {prod.basePrice.toFixed(2)} ر.س
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* البانر وشريط القصة */}
        <div className="space-y-3">
          <PromoCarousel onSelectCategory={(catSlug) => setSelectedCategory(catSlug)} />
          <BrandStoryMarquee />
        </div>

        {/* شريط الأقسام */}
        {categories.length > 0 && (
          <section className="pt-1" id="categories-section" dir={dir}>
            <div className="w-full bg-[#FAF5ED]/95 backdrop-blur-md rounded-2xl sm:rounded-4xl border border-[#EADBCE] shadow-[0_8px_25px_-8px_rgba(74,14,23,0.06)] p-3 sm:p-5">
              <div className="flex items-center justify-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar px-1 py-1">
                {/* زر عرض الكل */}
                <button
                  onClick={() => setSelectedCategory("All")}
                  className="group flex flex-col items-center justify-between min-w-18 sm:min-w-21.25 shrink-0 cursor-pointer transition-all select-none text-center"
                >
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
                    <div className="absolute bottom-1 w-3/4 h-2.5 bg-[#4A0E17]/15 rounded-full blur-xs pointer-events-none" />
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
                        selectedCategory === "All"
                          ? "bg-[#4A0E17] text-[#E5C058] scale-110 shadow-[0_8px_15px_rgba(74,14,23,0.3)]"
                          : "bg-white text-[#4A0E17]/80 group-hover:text-[#4A0E17] border border-stone-200 group-hover:scale-105"
                      }`}
                    >
                      <svg
                        viewBox="0 0 100 150"
                        className={`w-7 h-10 sm:w-8 sm:h-11 overflow-visible transition-all duration-300 ${
                          selectedCategory === "All"
                            ? "drop-shadow-[0_0_8px_rgba(229,192,88,0.45)]"
                            : ""
                        }`}
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="14"
                          y="8"
                          width="72"
                          height="134"
                          rx="36"
                          stroke="currentColor"
                          strokeWidth="5.5"
                        />
                        <g stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M 44 76 C 32 70, 33 44, 48 31 C 63 42, 66 66, 47 77" strokeWidth="4.5" />
                          <path d="M 47 32 C 46 38, 45 43, 44.5 47" strokeWidth="3" />
                          <path d="M 49.5 33 C 52.5 46, 51.5 58, 48.5 67" strokeWidth="3.2" />
                          <path d="M 55.5 51 C 56.5 61, 53.5 70, 47 77" strokeWidth="3.2" />
                          <path d="M 43 56 C 43.5 73, 46 92, 49.5 110" strokeWidth="4.8" />
                          <path d="M 47 77 C 70 77, 72 110, 50 111 C 41 111.5, 34 107, 30 99" strokeWidth="4.8" />
                        </g>
                      </svg>
                    </div>
                  </div>
                  <span
                    className={`mt-2 text-[11px] sm:text-xs font-serif transition-colors tracking-wide truncate max-w-20 ${
                      selectedCategory === "All"
                        ? "text-[#4A0E17] font-black underline decoration-[#C59B27] decoration-2 underline-offset-4"
                        : "text-stone-600 font-bold group-hover:text-[#4A0E17]"
                    }`}
                  >
                    {isAr ? "الكل" : "All"}
                  </span>
                </button>

                {/* قائمة الأقسام المجلوبة */}
                {categories.map((cat, index) => {
                  const isSelected = selectedCategory === cat.slug;
                  const catTitle = isAr ? cat.name_ar : cat.name_en;

                  return (
                    <button
                      key={cat.id || cat.slug}
                      onClick={() => setSelectedCategory(isSelected ? "All" : cat.slug)}
                      className="group flex flex-col items-center justify-between min-w-18 sm:min-w-22 shrink-0 cursor-pointer transition-all select-none text-center"
                    >
                      <div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center">
                        <div className="relative w-full h-full">
                          <Image
                            src={cat.image_url}
                            alt={catTitle}
                            fill
                            sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                            priority={index < 4}
                            quality={85}
                            className={`object-contain filter drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] transition-all duration-300 ${
                              isSelected
                                ? "scale-115 -translate-y-1.5 drop-shadow-[0_10px_15px_rgba(197,155,39,0.35)]"
                                : "group-hover:scale-105 group-hover:-translate-y-1"
                            }`}
                          />
                        </div>
                      </div>

                      <span
                        className={`mt-2 text-[11px] sm:text-xs font-serif transition-colors tracking-wide truncate max-w-21.25 ${
                          isSelected
                            ? "text-[#4A0E17] font-black underline decoration-[#C59B27] decoration-2 underline-offset-4"
                            : "text-stone-600 font-bold group-hover:text-[#4A0E17]"
                        }`}
                        title={catTitle}
                      >
                        {catTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* شبكة المنتجات */}
        <section className="space-y-3 pt-2" id="productsSection">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base md:text-xl text-[#2D2321] font-serif">
              {isAr ? "المختارات الأكثر طلباً" : "Popular Picks"}
            </h3>
            {selectedCategory !== "All" && (
              <button
                onClick={() => setSelectedCategory("All")}
                className="text-xs md:text-sm font-bold text-[#4A0E17] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>{isAr ? "عرض الكل" : "View All"}</span>
                {dir === "rtl" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {isLoading && productsData.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-stone-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#4A0E17]" />
              <p className="text-xs font-bold text-stone-600">
                {isAr ? "جاري تحميل قائمة الحلويات ..." : "Loading royal menu..."}
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-14 bg-white rounded-3xl border border-stone-200 text-center text-stone-400 space-y-2 p-6 shadow-2xs">
              <p className="font-bold text-sm text-stone-700">
                {isAr ? "لا توجد منتجات مضافة حالياً في هذا القسم." : "No items found in this section."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetail={(p) => setActiveProduct(p)}
                />
              ))}
            </div>
          )}
        </section>

        {/* شريط برنامج المكافآت */}
        <section className="bg-[#FAF5ED] border border-[#4A0E17]/10 rounded-3xl p-4 md:p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-11 h-11 md:w-14 md:h-14 rounded-2xl bg-[#4A0E17]/10 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 md:w-7 md:h-7 text-[#4A0E17]" />
            </div>
            <div>
              <h4 className="font-black text-xs md:text-base text-[#4A0E17] font-brand tracking-wider">
                BADEM ROYAL REWARDS
              </h4>
              <p className="text-[10px] md:text-xs text-stone-500 leading-tight mt-0.5">
                {isAr
                  ? "اكسب نقاطاً مع كل طلب واستبدلها بكوبونات خصم فورية."
                  : "Earn royal points with every order and redeem instant discounts."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsRewardsOpen(true)}
            className="bg-[#4A0E17] hover:bg-[#36070E] text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer shrink-0"
          >
            {isAr ? "استعراض المكافآت" : "Explore Rewards"}
          </button>
        </section>
      </main>

      <Footer />
      <BottomNav />

      {/* النوافذ المنبثقة المحملة ديناميكياً عند الطلب فقط */}
      <IngredientModal product={activeProduct} onClose={() => setActiveProduct(null)} />
      <CartDrawer onCheckout={() => setIsCheckoutOpen(true)} />
      <CheckoutSystem isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
      <ProfileModal />
      <RewardsModal />
      <NotificationModal />
      <CustomBoxModal />
    </div>
  );
}