"use client";

import React, { useState } from "react";
import { Crown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const BrandStoryMarquee: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // حالة التحكم بإيقاف واستئناف الحركة بالنقر
  const [isPaused, setIsPaused] = useState(false);

  const rawStoryItems = isAr
    ? [
        "بقلاوة تركية أصيلة • تُصنع بعناية وتُقدّم كما يجب",
        "فستق عنتابي فاخر • جودة تذوقها من أول حبة",
        "من تركيا إلى بـادم • أصالة في كل لقمة",
        "تفاصيل تُصنع بعناية • وطعم لا يُنسى",
        "بقلاوة بـادم • حيث تلتقي الأصالة بالفخامة",
        "أجود المكونات • وألذ التفاصيل",
        "حلا يليق بذوقك • من بـادم",
        "صُنعت بإتقان • لتستمتع بكل حبة",
        "طعم فاخر • جودة تستحق التجربة",
        "بـادم • وجهتك للبقلاوة التركية الأصيلة",
      ]
    : [
        "Authentic Turkish Baklava • Handcrafted with perfection",
        "Premium Antep Pistachio • Quality in every single bite",
        "From Turkey to Badem • Heritage in every layer",
        "Carefully crafted details • An unforgettable taste",
        "Badem Baklava • Where heritage meets royal luxury",
        "Finest pure ingredients • The most exquisite details",
        "A royal sweet worthy of your taste • By Badem",
        "Baked to perfection • To savor every single piece",
        "Luxurious flavor • An experience worth savoring",
        "Badem • Your destination for genuine Turkish baklava",
      ];

  // في العربي نعكس ترتيب عناصر المسار لتظهر الجملة الأولى أولاً أثناء التحرك نحو اليمين
  const storyItems = isAr ? [...rawStoryItems].reverse() : rawStoryItems;

  return (
    <div className="w-full py-1">
      {/* 🌟 الكبسولة الملكية العائمة */}
      <div
        onClick={() => setIsPaused((prev) => !prev)}
        role="button"
        tabIndex={0}
        title={
          isAr
            ? isPaused
              ? "اضغط لتشغيل الحركة"
              : "اضغط لإيقاف الحركة"
            : isPaused
            ? "Tap to resume"
            : "Tap to pause"
        }
        className="relative w-full bg-[#4A0E17] text-[#FAF5ED] py-2 px-1 rounded-2xl md:rounded-full border border-[#C59B27]/40 shadow-[0_4px_20px_rgba(74,14,23,0.18)] overflow-hidden select-none cursor-pointer active:scale-[0.99] transition-transform"
      >
        {/* تضمين قواعد الحركة التلقائية حسب اللغة (يمين للعربي / يسار للإنجليزي) */}
        <style>{`
          /* حركة اللغة العربية: من اليسار إلى اليمين لتظهر بداية الجملة أولاً */
          @keyframes marqueeLoopRTL {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(0%);
            }
          }

          /* حركة اللغة الإنجليزية: من اليمين إلى اليسار */
          @keyframes marqueeLoopLTR {
            0% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(-100%);
            }
          }

          .royal-track-ar {
            display: flex;
            flex-shrink: 0;
            align-items: center;
            white-space: nowrap;
            animation: marqueeLoopRTL 50s linear infinite;
          }

          .royal-track-en {
            display: flex;
            flex-shrink: 0;
            align-items: center;
            white-space: nowrap;
            animation: marqueeLoopLTR 50s linear infinite;
          }

          @media (hover: hover) {
            .royal-container:hover .royal-track-ar,
            .royal-container:hover .royal-track-en {
              animation-play-state: paused;
            }
          }

          .royal-track-paused {
            animation-play-state: paused !important;
          }
        `}</style>

        {/* تدرج تلاشٍ ناعم عند الحواف */}
        <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-[#4A0E17] via-[#4A0E17]/80 to-transparent z-10 pointer-events-none rounded-l-2xl md:rounded-l-full" />
        <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-[#4A0E17] via-[#4A0E17]/80 to-transparent z-10 pointer-events-none rounded-r-2xl md:rounded-r-full" />

        {/* مسار النصوص الدائري اللانهائي */}
        <div className="royal-container flex overflow-hidden w-full" dir="ltr">
          {/* المسار الأول */}
          <div
            className={`${isAr ? "royal-track-ar" : "royal-track-en"} ${
              isPaused ? "royal-track-paused" : ""
            }`}
          >
            {storyItems.map((text, idx) => (
              <div
                key={`track1-${idx}`}
                className="flex items-center gap-2.5 text-xs md:text-sm font-bold tracking-wide px-5 text-stone-200"
                dir={isAr ? "rtl" : "ltr"}
              >
                <Crown className="w-3.5 h-3.5 text-[#E5C058] shrink-0 animate-pulse" />
                <span className="drop-shadow-xs">{text}</span>
                <span className="text-[#C59B27]/60 mx-2 text-[10px]">✦</span>
              </div>
            ))}
          </div>

          {/* المسار الثاني التوأم لضمان عدم وجود أي فراغ */}
          <div
            className={`${isAr ? "royal-track-ar" : "royal-track-en"} ${
              isPaused ? "royal-track-paused" : ""
            }`}
            aria-hidden="true"
          >
            {storyItems.map((text, idx) => (
              <div
                key={`track2-${idx}`}
                className="flex items-center gap-2.5 text-xs md:text-sm font-bold tracking-wide px-5 text-stone-200"
                dir={isAr ? "rtl" : "ltr"}
              >
                <Crown className="w-3.5 h-3.5 text-[#E5C058] shrink-0 animate-pulse" />
                <span className="drop-shadow-xs">{text}</span>
                <span className="text-[#C59B27]/60 mx-2 text-[10px]">✦</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};