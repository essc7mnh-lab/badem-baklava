"use client";

import React, { useState, useEffect } from "react";
import {
  Globe,
  MapPin,
  ChevronDown,
  Bell,
  User,
  ShoppingBag,
  PackagePlus,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { royalSound } from "@/lib/sound";

export const Navbar: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();
  const { totalItemsCount, setIsCartOpen, isCartBouncing } = useCart();
  const {
    setIsProfileOpen,
    setIsNotificationsOpen,
    unreadNotificationsCount = 0,
    setIsMenuOpen,
  } = useUser();

  const isAr = language === "ar";
  const mapLink = "https://maps.app.goo.gl/WSoqTwxhk6684U7M6";

  // استشعار حركة التمرير لتطبيق تأثير الزجاج المصغر الفاخر
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`w-full sticky top-0 z-40 text-white transition-all duration-300 select-none border-b ${
        isScrolled
          ? "bg-[#3A070F]/90 backdrop-blur-xl border-[#C59B27]/30 shadow-2xl py-2"
          : "bg-[#4A0E17]/95 backdrop-blur-md border-[#5E1420] py-2.5 sm:py-3 shadow-lg"
      }`}
    >
      <div className="max-w-md md:max-w-6xl mx-auto px-4 flex items-center justify-between gap-2">
        
        {/* الجانب الأيمن: تبديل اللغة وشريط العنوان لسطح المكتب */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* زر تبديل اللغة الزجاجي */}
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={isAr ? "Switch to English" : "التحويل للغة العربية"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] hover:border-[#E5C058]/50 text-white text-xs font-bold shadow-xs active:scale-95 transition-all backdrop-blur-xs cursor-pointer focus-visible:outline-hidden group"
          >
            <Globe className="w-3.5 h-3.5 text-[#E5C058] group-hover:rotate-45 transition-transform duration-300" />
            <span className="leading-none text-[11px] sm:text-xs">
              {isAr ? "English" : "العربية"}
            </span>
          </button>

          {/* شريط العنوان التفاعلي لسطح المكتب */}
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            title={isAr ? "عرض الموقع على خريطة جوجل" : "View location on Google Maps"}
            className="hidden md:flex items-center gap-2 bg-white/[0.06] border border-white/15 hover:border-[#E5C058]/40 rounded-full px-3.5 py-1.5 text-xs text-stone-100 shadow-2xs backdrop-blur-xs hover:bg-white/[0.12] transition-all cursor-pointer group"
          >
            <MapPin className="w-3.5 h-3.5 text-[#E5C058] shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-[11.5px] truncate max-w-[170px]">
              {isAr ? "الرياض - شارع التخصصي" : "Riyadh - Takhassusi St."}
            </span>
            <ChevronDown className="w-3 h-3 text-stone-300 shrink-0 group-hover:text-white transition-colors" />
          </a>
        </div>

        {/* المنتصف: الشعار الملكي الفاخر */}
        <div
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex flex-col items-center select-none cursor-pointer group active:scale-95 transition-transform"
          role="button"
          aria-label={isAr ? "العودة إلى أعلى الصفحة" : "Scroll to top"}
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-brand text-[#FAF5ED] tracking-[0.25em] drop-shadow-sm group-hover:text-white transition-colors">
            BADEM
          </h1>
          <div className="flex items-center gap-1.5 -mt-1 w-full justify-center">
            <span className="w-2 md:w-3.5 h-[1px] bg-gradient-to-r from-transparent to-[#C59B27]/80" />
            <span className="text-[7.5px] sm:text-[8.5px] md:text-[9px] tracking-[0.35em] text-[#E5C058] font-black uppercase">
              BAKLAVA
            </span>
            <span className="w-2 md:w-3.5 h-[1px] bg-gradient-to-l from-transparent to-[#C59B27]/80" />
          </div>
        </div>

        {/* الجانب الأيسر: الإجراءات السريعة والسلة  */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* 🌟 زر صمّم بوكسك الاستثنائي لسطح المكتب مع تأثير الوميض الضوئي (Shimmer) */}
          <button
            type="button"
            onClick={() => {
              royalSound.playBoxOpenSound();
              setIsMenuOpen(true);
            }}
            aria-label={isAr ? "صمّم بوكسك الخاص" : "Custom Box Studio"}
            className="relative overflow-hidden hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#C59B27] via-[#D8AE38] to-[#C59B27] text-[#4A0E17] text-xs font-black shadow-[0_2px_15px_rgba(197,155,39,0.35)] hover:shadow-[0_4px_22px_rgba(197,155,39,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-300 group cursor-pointer"
          >
            {/* انعكاس ضوئي انسيابي متكرر */}
            <div className="absolute inset-0 w-1/2 h-full bg-white/35 skew-x-12 -translate-x-full group-hover:translate-x-[280%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            
            <PackagePlus className="w-3.5 h-3.5 text-[#4A0E17] group-hover:scale-110 transition-transform" />
            <span className="leading-none">{isAr ? "صمّم بوكسك" : "Custom Box"}</span>
            <Sparkles className="w-3.5 h-3.5 text-[#4A0E17] animate-pulse" />
          </button>

          {/* زر الإشعارات */}
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            aria-label={
              isAr
                ? `التنبيهات (${unreadNotificationsCount} غير مقروءة)`
                : `Notifications (${unreadNotificationsCount} unread)`
            }
            title={isAr ? "التنبيهات المباشرة" : "Notifications"}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 hover:border-[#E5C058]/40 flex items-center justify-center text-white shadow-2xs active:scale-90 transition-all relative cursor-pointer group"
          >
            <Bell className="w-3.5 h-3.5 text-stone-200 group-hover:text-white transition-colors" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[8.5px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-[#4A0E17] animate-pulse">
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* 🌟 زر سلة المشتريات الزجاجي الملكي مع البادج العائم */}
          <button
            type="button"
            id="cart-target-desktop"
            onClick={() => setIsCartOpen(true)}
            aria-label={
              isAr
                ? `سلة المشتريات بها ${totalItemsCount} عناصر`
                : `Shopping cart with ${totalItemsCount} items`
            }
            className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 hover:border-[#E5C058]/50 text-white shadow-xs active:scale-90 transition-all cursor-pointer group ${
              isCartBouncing ? "animate-cart-bounce ring-2 ring-[#E5C058]" : ""
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5C058] group-hover:scale-110 transition-transform" />
            
            {/* بادج العداد العائم */}
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 sm:min-w-4.5 h-4 sm:h-4.5 px-1 rounded-full bg-[#E5C058] text-[#4A0E17] font-black text-[9px] sm:text-[9.5px] flex items-center justify-center shadow-md animate-in zoom-in-75 ring-2 ring-[#4A0E17]">
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* زر حساب العميل والملف الشخصي */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            aria-label={isAr ? "حسابي الشخصي" : "My Profile"}
            title={isAr ? "حسابي" : "Profile"}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 hover:border-[#E5C058]/40 flex items-center justify-center text-stone-200 hover:text-white shadow-2xs active:scale-90 transition-all cursor-pointer group"
          >
            <User className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* شريط تحديد الموقع الرشيق للهواتف الذكية (تم تنحيفه ليكون كبسولة عائمة) */}
      <div className="max-w-md mx-auto md:hidden px-4 pt-1.5">
        <a
          href={mapLink}
          target="_blank"
          rel="noopener noreferrer"
          title={isAr ? "عرض الموقع على خريطة جوجل" : "View location on Google Maps"}
          className="bg-white/[0.05] border border-white/10 hover:border-[#E5C058]/30 rounded-full px-3 py-1 flex items-center justify-between shadow-2xs backdrop-blur-xs text-white active:bg-white/10 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-1.5 text-[11px] truncate">
            <MapPin className="w-3 h-3 text-[#E5C058] shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-medium truncate text-stone-200">
              {isAr
                ? "التوصيل إلى: الرياض - شارع التخصصي"
                : "Deliver to: Riyadh - Takhassusi St."}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-stone-400 shrink-0 group-hover:text-white transition-colors" />
        </a>
      </div>
    </header>
  );
};