"use client";

import React from "react";
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

      <div className="max-w-6xl mx-auto flex flex-col items-center gap-7 relative z-10">
        
        {/* 1. شعار واسم متجر بادَم الفاخر */}
        <div className="flex flex-col items-center text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#C59B27]/15 border border-[#C59B27]/30 text-[#E5C058] text-[9.5px] font-black tracking-widest uppercase mb-1 shadow-2xs">
            <Sparkles className="w-3 h-3 text-[#E5C058]" />
            <span>{isAr ? "أصالة الضيافة " : "ROYAL TURKISH HOSPITALITY"}</span>
          </div>
          <h3 className="font-black text-[#FAF5ED] font-brand text-xl sm:text-2xl tracking-[0.2em] uppercase drop-shadow-sm">
            BADEM BAKLAVA
          </h3>
          <p className="text-[11px] text-stone-300 font-medium tracking-wide">
            {isAr ? "بقلاوة تركية فاخرة بالفستق العنتابي والسمن البلدي النقي" : "Artisan Turkish Baklava & Royal Confectionery"}
          </p>
        </div>

        {/* 2. بطاقة معلومات الفرع وقنوات التواصل */}
        <div className="w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-2xl p-4 backdrop-blur-md flex flex-col items-center gap-3.5 text-[11px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
          
          {/* الموقع وأوقات الدوام */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 text-stone-300">
            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              title={isAr ? "عرض الموقع على خريطة جوجل" : "View location on Google Maps"}
              className="flex items-center gap-1.5 hover:text-[#E5C058] transition group cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E5C058] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="underline decoration-stone-500/50 underline-offset-4 group-hover:decoration-[#E5C058]">
                {isAr ? "الرياض - حي المحمدية - شارع التخصصي" : "Riyadh - Al Mohammadiyah - Takhassusi St."}
              </span>
            </a>

            <span className="text-white/20 hidden sm:inline">•</span>

            <span className="flex items-center gap-1.5 text-stone-300">
              <Clock className="w-3.5 h-3.5 text-[#E5C058] shrink-0" />
              <span>{isAr ? "يومياً: 4 م - 12 ص" : "Daily: 4 PM - 12 AM"}</span>
            </span>
          </div>

          {/* أزرار التواصل الموحدة */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 border-t border-white/5 w-full">
            <a
              href="https://wa.me/966592320106"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C59B27]/40 text-stone-200 hover:text-[#E5C058] transition text-[11px] font-bold group"
            >
              <div className="text-[#E5C058] group-hover:scale-110 transition-transform">
                <WhatsAppIcon className="w-3.5 h-3.5" />
              </div>
              <span>{isAr ? "واتساب الطلبات" : "WhatsApp"}</span>
            </a>

            <a
              href="https://instagram.com/badem_sa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C59B27]/40 text-stone-200 hover:text-[#E5C058] transition text-[11px] font-bold group"
            >
              <div className="text-[#E5C058] group-hover:scale-110 transition-transform">
                <InstagramIcon className="w-3.5 h-3.5" />
              </div>
              <span className="font-mono">@badem_sa</span>
            </a>

            <a
              href="tel:+966592320106"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#C59B27]/40 text-stone-200 hover:text-[#E5C058] transition text-[11px] font-bold group"
            >
              <Phone className="w-3.5 h-3.5 text-[#E5C058] group-hover:scale-110 transition-transform" />
              <span>{isAr ? "اتصل بنا" : "Call"}</span>
            </a>
          </div>

        </div>

        {/* فاصل ذهبي ناعم */}
        <div className="w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-[#C59B27]/30 to-transparent my-0.5" />

        {/* 3. شريط الحقوق + بصمة NT Media المختصرة والمندمجة بالكامل */}
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

          {/* 🌟 كبسولة التطوير الملكية المختصرة (Minimalist Royal Badge) */}
          <a
            href={AGENCY_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="NT Media Agency"
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
                NT Media
              </span>
              <ArrowUpRight className="w-3 h-3 text-[#C59B27] group-hover:text-[#E5C058] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </div>
          </a>

        </div>

      </div>
    </footer>
  );
};