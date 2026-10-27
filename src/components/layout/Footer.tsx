"use client";

import React from "react";
import Image from "next/image"; // 🌟 تم إضافة استيراد Image
import { Phone, MapPin, Clock, Sparkles, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// 🌐 ضع رابط موقع وكالتكم أو حسابكم هنا:
const AGENCY_URL = "https://nt-media-agency-xoo4.vercel.app"; 

const InstagramIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const currentYear = new Date().getFullYear();
  const mapLink = "https://maps.app.goo.gl/WSoqTwxhk6684U7M6";

  return (
    <footer className="w-full bg-gradient-to-b from-[#38070E] via-[#280509] to-[#150204] text-white border-t border-[#C59B27]/25 mt-12 pt-10 pb-8 px-4 mb-14 md:mb-0 shadow-2xl relative z-10 overflow-hidden select-none">
      
      {/* توهج ذهبي ناعم في الخلفية العلوية */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-20 bg-[#C59B27]/10 blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 relative z-10">
        
        {/* 1. الشعار الملكي في القمة بدون مشتتات بصرية */}
        <div className="flex flex-col items-center text-center">
          
          {/* 🌟 شعار بادَم (SVG) يتصدر المشهد كالتاج */}
          <div className="relative w-14 h-20 sm:w-16 sm:h-24 mb-2.5 flex items-center justify-center drop-shadow-[0_6px_16px_rgba(229,192,88,0.28)]">
            <svg
              viewBox="0 0 100 150"
              className="w-full h-full overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="royalGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F3DC8B" />
                  <stop offset="35%" stopColor="#C59B27" />
                  <stop offset="50%" stopColor="#FFF2B2" />
                  <stop offset="70%" stopColor="#B38728" />
                  <stop offset="100%" stopColor="#E5C058" />
                </linearGradient>
              </defs>

              <rect
                x="15"
                y="8"
                width="70"
                height="134"
                rx="35"
                stroke="url(#royalGold)"
                strokeWidth="4.5"
              />
{/* 🌟 رسم حرف B وحبة اللوز بعد ضبط الـ 4 لمسات الدقيقة للتطابق 100% */}
              <g fill="url(#royalGold)">
                
                {/* 1. جسم حبة اللوز (أكثر امتلاءً وانسيابية مع خصر مسحوب بدقة) */}
                <path d="M 43 80.5 C 30.5 74, 30.5 51, 43 39.5 C 45.8 36.8, 49.5 36.8, 52.2 39.5 C 64.5 50.5, 65.5 69.5, 50.5 79.5 L 44.5 79 C 57.5 70, 57.5 51.5, 49.5 42.5 C 48.2 41, 47 41, 45.6 42.5 C 36 52, 35.5 71.5, 43.5 78 Z" />

                {/* 2. الساق العمودية (تبدأ أقصر وبرأس مدبب كالإبرة وتنزل بانحناءة خطاطية) */}
                <path d="M 42.6 58.5 C 43 58.5, 43.6 59.5, 43.8 61.5 C 44.8 76, 47.5 93, 52 107.5 L 45.2 108.5 C 42.6 94, 41.5 77, 42 61.5 C 42.1 59.5, 42.3 58.5, 42.6 58.5 Z" />

                {/* 3. البطن السفلي لحرف B (ينطلق من الخصر المدبب وينتهي بذيل أيسر رفيع) */}
                <path d="M 44.5 77.8 C 68.5 77, 71 108.5, 49.5 109.5 C 41.2 110, 34.5 106.2, 31.2 100 C 30.9 99.4, 31.6 98.9, 32.1 99.4 C 35.8 103.8, 41.8 106.2, 48.5 105.8 C 63 104.8, 62 81.5, 44.5 80.2 Z" />

                {/* 4. العرق الطويل الأوسط (ينبع من القمة وينتهي حراً في الوسط دون لمس الساق) */}
                <path d="M 47.6 40.5 C 52 50, 51.8 61.5, 48.8 70.5 C 48.4 71.4, 47.1 71, 47.4 70 C 49.8 61, 49.8 50.5, 46.2 41 Z" />

                {/* 5. العرق القصير الأيمن (ينحني بنعومة ويلتقي في الخصر) */}
                <path d="M 54.5 54 C 56.2 62, 53.5 71.5, 47.5 78 L 45.5 77.2 C 50.8 71, 53.2 62, 52.5 54.5 C 52.4 53.6, 54.3 53.2, 54.5 54 Z" />

              </g>
            </svg>
          </div>

          {/* اسم البراند */}
          <h3 className="font-serif font-bold text-2xl sm:text-3xl tracking-[0.25em] bg-gradient-to-r from-[#DFB755] via-[#FFF0A5] to-[#C59B27] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] pl-1">
            BADEM
          </h3>

          {/* كلمة BAKLAVA */}
          <span className="font-serif text-[10px] sm:text-[11px] tracking-[0.5em] text-[#E5C058]/90 font-semibold mt-0.5 pl-1.5">
            BAKLAVA
          </span>

          {/* فاصل "أصالة الضيافة" بتصميم خطوط جانبية ملكية بدلاً من الكبسولة العلوية */}
          <div className="flex items-center justify-center gap-3 mt-4 mb-1.5">
            <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-r from-transparent to-[#C59B27]/60" />
            <div className="flex items-center gap-1.5 text-[#E5C058] text-[10px] font-bold tracking-widest uppercase">
              <Sparkles className="w-3 h-3 text-[#C59B27]" />
              <span>{isAr ? "أصالة الضيافة التركية" : "ROYAL TURKISH HOSPITALITY"}</span>
              <Sparkles className="w-3 h-3 text-[#C59B27]" />
            </div>
            <span className="w-8 sm:w-12 h-[1px] bg-gradient-to-l from-transparent to-[#C59B27]/60" />
          </div>

          <p className="text-xs text-stone-300/95 font-medium tracking-wide max-w-md leading-relaxed">
            {isAr ? "بقلاوة تركية فاخرة بالفستق العنتابي والسمن البلدي النقي" : "Artisan Turkish Baklava & Royal Confectionery"}
          </p>
        </div>

        {/* 2. بطاقة معلومات الفرع مع انعكاس ذهبي علوي فخم */}
        <div className="w-full max-w-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.015] border border-white/10 border-t-[#C59B27]/40 rounded-3xl p-4 sm:p-5 backdrop-blur-md flex flex-col items-center gap-4 text-[11px] shadow-[0_10px_30px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(229,192,88,0.15)]">
          
          {/* الموقع وأوقات الدوام */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-stone-200">
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-[#E5C058] transition group cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E5C058] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="underline decoration-[#C59B27]/40 underline-offset-4 group-hover:decoration-[#E5C058]">
                {isAr ? "الرياض - حي المحمدية - شارع التخصصي" : "Riyadh - Al Mohammadiyah - Takhassusi St."}
              </span>
            </a>

            <span className="text-[#C59B27]/40 hidden sm:inline">✦</span>

            <span className="flex items-center gap-1.5 text-stone-200">
              <Clock className="w-3.5 h-3.5 text-[#E5C058] shrink-0" />
              <span>{isAr ? "يومياً: 4 م - 12 ص" : "Daily: 4 PM - 12 AM"}</span>
            </span>
          </div>

          {/* أزرار التواصل الموحدة */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3 border-t border-white/10 w-full">
            <a
              href="https://wa.me/966592320106"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-[#C59B27]/15 border border-white/10 hover:border-[#E5C058]/50 text-stone-200 hover:text-[#E5C058] transition-all duration-300 text-[11px] font-bold group shadow-2xs"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 text-[#E5C058] group-hover:scale-110 transition-transform" />
              <span>{isAr ? "واتساب الطلبات" : "WhatsApp"}</span>
            </a>

            <a
              href="https://instagram.com/badem_sa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-[#C59B27]/15 border border-white/10 hover:border-[#E5C058]/50 text-stone-200 hover:text-[#E5C058] transition-all duration-300 text-[11px] font-bold group shadow-2xs"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-[#E5C058] group-hover:scale-110 transition-transform" />
              <span className="font-mono">@badem_sa</span>
            </a>

            <a
              href="tel:+966592320106"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-[#C59B27]/15 border border-white/10 hover:border-[#E5C058]/50 text-stone-200 hover:text-[#E5C058] transition-all duration-300 text-[11px] font-bold group shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-[#E5C058] group-hover:scale-110 transition-transform" />
              <span>{isAr ? "اتصل بنا" : "Call"}</span>
            </a>
          </div>
        </div>

        {/* فاصل ذهبي ناعم */}
        <div className="w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-[#C59B27]/30 to-transparent my-0.5" />

        {/* 3. شريط الحقوق + بصمة التطوير */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          
          {/* حقوق النشر لمتجر بادَم */}
          <div className="text-center sm:text-right space-y-0.5">
            <div className="text-[11px] text-stone-400">
              <span>© {currentYear} </span>
              <strong className="text-stone-200 font-bold">BADEM BAKLAVA</strong>
              <span>. {isAr ? "جميع الحقوق محفوظة." : "All rights reserved."}</span>
            </div>
            <p className="text-[9.5px] text-stone-500 font-medium">
              مؤسسة رواد اللذة للحلويات • سجل تجاري معتمد
            </p>
          </div>

          {/* 🌟 كبسولة التطوير الملكية المختصرة */}
          <a
            href={AGENCY_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="HM Digital Solutions"
            className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-[#E5C058]/45 backdrop-blur-xl shadow-xs hover:shadow-[0_0_15px_rgba(229,192,88,0.18)] active:scale-95 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            {/* انعكاس ذهبي انسيابي خفيف عند التمرير */}
            <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-[#E5C058]/15 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-[280%] transition-transform duration-700 ease-in-out pointer-events-none" />

            {/* نقطة نبض ذهبية ملكية */}
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5C058] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#E5C058]" />
            </span>

            {/* كلمة مختصرة وراقية */}
            <span className="text-[10px] font-medium text-stone-300 group-hover:text-stone-200 transition-colors">
              {isAr ? "تطوير" : "Built by"}
            </span>

            <span className="text-white/20 text-[10px]">•</span>

            {/* الاسم مختصر ومندمج مع درجات عاج وأوف وايت المتجر */}
            <div dir="ltr" className="flex items-center gap-1 text-[11px] font-bold">
              <span className="text-[#FAF5ED] group-hover:text-[#E5C058] transition-colors font-mono tracking-tight">
                MY BRAND
              </span>
              <ArrowUpRight className="w-3 h-3 text-[#C59B27] group-hover:text-[#E5C058] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </div>
          </a>

        </div>

      </div>
    </footer>
  );
};