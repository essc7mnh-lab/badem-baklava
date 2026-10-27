"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase/supabase";

export interface BannerItem {
  id?: string;
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  tag_ar?: string;
  tag_en?: string;
  image_url?: string;
  target_category_slug?: string;
}

interface PromoCarouselProps {
  onSelectCategory?: (categorySlug: string) => void;
}

export const PromoCarousel: React.FC<PromoCarouselProps> = ({ onSelectCategory }) => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // مراجع تتبع حركة اللمس والسحب لمنع التداخل مع النقر العادي
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const hasSwiped = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .order("created_at", { ascending: false });

        if (isMounted) {
          if (data && data.length > 0 && !error) {
            setBanners(data as BannerItem[]);
          } else {
            setBanners([]);
          }
        }
      } catch {
        if (isMounted) setBanners([]);
      }
    };

    const timer = setTimeout(() => {
      void fetchBanners();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  // تشغيل التبديل التلقائي مع إعادة ضبط المؤقت عند كل سحب يدوي
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length, currentIndex]);

  if (banners.length === 0) return null;

  const current = banners[currentIndex] || banners[0];

  // دوال الانتقال
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // 🌟 معالجة اللمس للجوال (Touch Gestures)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = e.touches[0].clientX;
    hasSwiped.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    const diffX = Math.abs(touchEndX.current - touchStartX.current);
    const diffY = Math.abs(e.touches[0].clientY - touchStartY.current);

    // إذا كانت الحركة أفقية وأكبر من 10px يتم اعتبارها سحباً
    if (diffX > 10 && diffX > diffY) {
      hasSwiped.current = true;
    }
  };

  const handleTouchEnd = () => {
    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // المسافة الأدنى لاعتماد السحب

    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        // سحب لليسار -> التالي
        handleNext();
      } else {
        // سحب لليمين -> السابق
        handlePrev();
      }
    }

    setTimeout(() => {
      hasSwiped.current = false;
    }, 120);
  };

  // 🌟 معالجة السحب بالماوس للكمبيوتر (Mouse Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchEndX.current = e.clientX;
    isDragging.current = true;
    hasSwiped.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    touchEndX.current = e.clientX;
    if (Math.abs(touchEndX.current - touchStartX.current) > 10) {
      hasSwiped.current = true;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diffX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    setTimeout(() => {
      hasSwiped.current = false;
    }, 120);
  };

  const handleMouseLeave = () => {
    if (isDragging.current) {
      handleMouseUp();
    }
  };

  // دالة النقر: لا تتفاعل إذا كان المستخدم يقوم بسحب الشريحة
  const handleBannerAction = () => {
    if (hasSwiped.current) return;

    if (current.target_category_slug && onSelectCategory) {
      onSelectCategory(current.target_category_slug);
    }

    const targetSection =
      document.getElementById("productsSection") ||
      document.getElementById("categories-section");

    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const hasText = Boolean(
    (current.title_ar && current.title_ar.trim()) ||
    (current.title_en && current.title_en.trim())
  );

  return (
    <section className="w-full max-w-5xl mx-auto px-3 sm:px-6 my-3 sm:my-6 select-none">
      <div
        onClick={handleBannerAction}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-[#C59B27]/25 shadow-xl cursor-pointer transition-transform duration-300 hover:shadow-2xl active:scale-[0.99] group touch-pan-y ${
          hasText
            ? "bg-gradient-to-r from-[#4A0E17] via-[#3D0A11] to-[#36070E] p-4 sm:p-7 md:p-9"
            : "p-0 aspect-[16/8] sm:aspect-[21/9] md:aspect-[2.4/1] bg-[#4A0E17]"
        }`}
      >
        {/* الحالة الأولى: تصميم بوستر كامل ملء المستطيل (Full-Bleed Artwork) */}
        {!hasText && current.image_url ? (
          <div className="relative w-full h-full">
            <Image
              key={current.image_url}
              src={current.image_url}
              alt="عرض بادَم"
              fill
              priority
              quality={92}
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="object-cover object-center w-full h-full transition-transform duration-500 group-hover:scale-105 pointer-events-none"
            />
          </div>
        ) : (
          /* الحالة الثانية: صورة مفرغة طافية + نصوص وزر طلب مبرمج */
          <div className="flex items-center justify-between gap-3 sm:gap-6 relative z-10 pointer-events-none">
            <div className="flex-1 min-w-0 space-y-2 sm:space-y-3 text-white rtl:text-right ltr:text-left">
              {current.tag_ar && (
                <span className="inline-flex items-center gap-1 bg-[#C59B27]/20 border border-[#C59B27]/40 text-[#E5C058] text-[9.5px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  <span>{isAr ? current.tag_ar : current.tag_en || current.tag_ar}</span>
                </span>
              )}

              <h2 className="text-base sm:text-2xl md:text-3xl lg:text-4xl font-serif font-black tracking-wide text-[#FAF5ED] uppercase leading-tight drop-shadow-sm whitespace-pre-line break-words">
                {isAr ? current.title_ar : current.title_en}
              </h2>

              {(current.subtitle_ar || current.subtitle_en) && (
                <p className="text-[10.5px] sm:text-xs md:text-sm text-stone-300/90 font-serif leading-relaxed line-clamp-2 max-w-sm break-words">
                  {isAr ? current.subtitle_ar : current.subtitle_en}
                </p>
              )}

              <div className="pt-1 sm:pt-2">
                <span className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#FAF5ED] group-hover:bg-[#E5C058] text-[#4A0E17] font-serif font-bold text-[11px] sm:text-xs md:text-sm shadow-md transition-colors">
                  <span>{isAr ? "اطلب الآن" : "Explore Now"}</span>
                  {isAr ? (
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  )}
                </span>
              </div>
            </div>

            {current.image_url && (
              <div className="relative shrink-0 flex items-center justify-center w-32 sm:w-56 md:w-72 h-32 sm:h-56 md:h-64">
                <Image
                  key={current.image_url}
                  src={current.image_url}
                  alt="صورة العرض"
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 640px) 130px, (max-width: 768px) 220px, 300px"
                  className="object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:scale-105 pointer-events-none"
                />
              </div>
            )}
          </div>
        )}

        {/* مؤشرات التنقل السفلية بين البانرات */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-20">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10 shadow-xs">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    currentIndex === idx
                      ? "w-6 h-1.5 bg-[#E5C058]"
                      : "w-1.5 h-1.5 bg-white/40 hover:bg-white"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};