"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Globe,
  MapPin,
  ChevronDown,
  Bell,
  User,
  ShoppingBag,
  PackagePlus,
  Sparkles,
  Clock,
  Phone,
  X,
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
  const phoneCallNumber = "tel:966592320106";

  const [isScrolled, setIsScrolled] = useState(false);
  const [isBranchCardOpen, setIsBranchCardOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<{ id: string } | null>(null);

  // 🕒 حساب الوقت الحقيقي بتوقيت الرياض (Asia/Riyadh) مطابق لجوجل ماب
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    const orderTimer = setTimeout(() => {
      try {
        const savedOrders = JSON.parse(localStorage.getItem("badem_recent_orders") || "[]");
        if (Array.isArray(savedOrders) && savedOrders.length > 0) {
          setActiveOrder(savedOrders[0]);
        }
      } catch {
        // تجاوز صامت
      }
    }, 0);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(timer);
      clearTimeout(orderTimer);
    };
  }, []);

  // فحص حالة الفرع التلقائية (من 4:00 عصراً حتى 12:00 منتصف الليل)
  const branchStatus = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Riyadh",
        hour: "numeric",
        minute: "numeric",
        hour12: false,
      });
      const parts = formatter.formatToParts(currentTime);
      const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
      const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
      const totalMinutes = hour * 60 + minute;

      // مواعيد العمل: 4:00 م (16:00) إلى 12:00 منتصف الليل (24:00)
      const openMinutes = 16 * 60;
      const closeMinutes = 24 * 60;

      const isOpen = totalMinutes >= openMinutes && totalMinutes < closeMinutes;

      return {
        isOpen,
        statusText: isOpen
          ? isAr
            ? "مفتوح الآن • يغلق عند 12:00 ص"
            : "Open now • Closes at 12:00 AM"
          : isAr
          ? "مغلق • يفتح عند الساعة 4:00 م"
          : "Closed • Opens at 4:00 PM",
      };
    } catch {
      return {
        isOpen: false,
        statusText: isAr ? "يفتح عند الساعة 4:00 م" : "Opens at 4:00 PM",
      };
    }
  }, [currentTime, isAr]);

  return (
    <header
      className={`w-full sticky top-0 z-40 text-white transition-all duration-300 select-none border-b ${
        isScrolled
          ? "bg-[#3A070F]/90 backdrop-blur-xl border-[#C59B27]/30 shadow-2xl py-2"
          : "bg-[#4A0E17]/95 backdrop-blur-md border-[#5E1420] py-2.5 sm:py-3 shadow-lg"
      }`}
    >
      <div className="max-w-md md:max-w-6xl mx-auto px-4 flex items-center justify-between gap-2 relative">
        
        {/* الجانب الأيمن: زر اللغة وزر الفرع لسطح المكتب */}
        <div className="flex items-center gap-2 sm:gap-2.5">
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

          {/* 📍 زر تفاصيل الفرع لسطح المكتب */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setIsBranchCardOpen(!isBranchCardOpen)}
              className="flex items-center gap-2 bg-white/[0.06] border border-white/15 hover:border-[#E5C058]/40 rounded-full px-3.5 py-1.5 text-xs text-stone-100 shadow-2xs backdrop-blur-xs hover:bg-white/[0.12] transition-all cursor-pointer group"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${branchStatus.isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
              <MapPin className="w-3.5 h-3.5 text-[#E5C058] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-medium text-[11.5px] truncate max-w-[170px]">
                {isAr ? "الرياض - شارع التخصصي" : "Riyadh - Takhassusi St."}
              </span>
              <ChevronDown className={`w-3 h-3 text-stone-300 shrink-0 transition-transform duration-200 ${isBranchCardOpen ? "rotate-180 text-white" : ""}`} />
            </button>

            {/* بطاقة معلومات الفرع لسطح المكتب */}
            {isBranchCardOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsBranchCardOpen(false)} />
                <div className="absolute right-0 rtl:right-0 ltr:left-0 top-full mt-2 w-80 bg-[#FAF5ED] text-[#2D2321] rounded-2xl border border-[#C59B27]/40 shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 duration-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${branchStatus.isOpen ? "bg-emerald-600 animate-ping" : "bg-rose-600"}`} />
                      <span className={`text-[11px] font-black ${branchStatus.isOpen ? "text-emerald-800" : "text-rose-700"}`}>
                        {branchStatus.statusText}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBranchCardOpen(false)}
                      className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-right">
                    <p className="font-bold text-[#4A0E17]">
                      {isAr ? "فرع بادَم (المحمدية):" : "BADEM Boutique (Al Mohammadiyah):"}
                    </p>
                    <p className="text-[11px] text-stone-600 leading-tight">
                      {isAr ? "شارع التخصصي، حي المحمدية، الرياض 12363." : "Takhassusi St., Al Mohammadiyah, Riyadh 12363."}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10.5px] text-stone-500 pt-0.5">
                      <Clock className="w-3 h-3 text-[#C59B27]" />
                      <span>{isAr ? "يومياً: 4:00 عصراً – 12:00 منتصف الليل" : "Daily: 4:00 PM – 12:00 AM"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200">
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#4A0E17] hover:bg-[#34050D] text-white rounded-xl text-[10.5px] font-bold shadow-xs transition"
                    >
                      <MapPin className="w-3 h-3 text-[#E5C058]" />
                      <span>{isAr ? "خرائط Google" : "Directions"}</span>
                    </a>
                    <a
                      href={phoneCallNumber}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-xl text-[10.5px] font-bold shadow-xs transition"
                    >
                      <Phone className="w-3 h-3 text-emerald-700" />
                      <span>{isAr ? "اتصال بالفرع" : "Call"}</span>
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* المنتصف: الشعار الملكي */}
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

        {/* الجانب الأيسر: الإجراءات والسلة */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              royalSound.playBoxOpenSound();
              setIsMenuOpen(true);
            }}
            aria-label={isAr ? "صمّم بوكسك الخاص" : "Custom Box Studio"}
            className="relative overflow-hidden hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#C59B27] via-[#D8AE38] to-[#C59B27] text-[#4A0E17] text-xs font-black shadow-[0_2px_15px_rgba(197,155,39,0.35)] hover:shadow-[0_4px_22px_rgba(197,155,39,0.6)] hover:scale-[1.02] active:scale-95 transition-all duration-300 group cursor-pointer"
          >
            <div className="absolute inset-0 w-1/2 h-full bg-white/35 skew-x-12 -translate-x-full group-hover:translate-x-[280%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            <PackagePlus className="w-3.5 h-3.5 text-[#4A0E17] group-hover:scale-110 transition-transform" />
            <span className="leading-none">{isAr ? "صمّم بوكسك" : "Custom Box"}</span>
            <Sparkles className="w-3.5 h-3.5 text-[#4A0E17] animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setIsNotificationsOpen(true)}
            aria-label={isAr ? "التنبيهات المباشرة" : "Notifications"}
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

          <button
            type="button"
            id="cart-target-desktop"
            onClick={() => setIsCartOpen(true)}
            aria-label={isAr ? "سلة المشتريات" : "Shopping Cart"}
            className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 hover:border-[#E5C058]/50 text-white shadow-xs active:scale-90 transition-all cursor-pointer group ${
              isCartBouncing ? "animate-cart-bounce ring-2 ring-[#E5C058]" : ""
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E5C058] group-hover:scale-110 transition-transform" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 sm:min-w-4.5 h-4 sm:h-4.5 px-1 rounded-full bg-[#E5C058] text-[#4A0E17] font-black text-[9px] sm:text-[9.5px] flex items-center justify-center shadow-md animate-in zoom-in-75 ring-2 ring-[#4A0E17]">
                {totalItemsCount}
              </span>
            )}
          </button>

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

      {/* شريط الفرع للجوال (متطابق تماماً مع الكمبيوتر) */}
      <div className="max-w-md mx-auto md:hidden px-4 pt-1.5 relative">
        <button
          type="button"
          onClick={() => setIsBranchCardOpen(!isBranchCardOpen)}
          className="w-full bg-white/[0.05] border border-white/10 hover:border-[#E5C058]/30 rounded-full px-3 py-1 flex items-center justify-between shadow-2xs backdrop-blur-xs text-white active:bg-white/10 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-1.5 text-[11px] truncate">
            <span className={`w-2 h-2 rounded-full shrink-0 ${branchStatus.isOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
            <MapPin className="w-3 h-3 text-[#E5C058] shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-medium truncate text-stone-200">
              {isAr ? "الرياض - شارع التخصصي" : "Riyadh - Takhassusi St."}
            </span>
          </div>
          <ChevronDown className={`w-3 h-3 text-stone-400 shrink-0 transition-transform ${isBranchCardOpen ? "rotate-180 text-white" : ""}`} />
        </button>

        {/* 🌟 بطاقة معلومات الفرع للجوال (مطابقة 100% للكمبيوتر بالاسم وساعات العمل وزر Google Maps) */}
        {isBranchCardOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsBranchCardOpen(false)} />
            <div className="absolute left-4 right-4 top-full mt-2 bg-[#FAF5ED] text-[#2D2321] rounded-2xl border border-[#C59B27]/40 shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 duration-200 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${branchStatus.isOpen ? "bg-emerald-600 animate-ping" : "bg-rose-600"}`} />
                  <span className={`text-[11px] font-black ${branchStatus.isOpen ? "text-emerald-800" : "text-rose-700"}`}>
                    {branchStatus.statusText}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBranchCardOpen(false)}
                  className="text-stone-400 hover:text-stone-700 text-xs cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-right">
                <p className="font-bold text-[#4A0E17]">
                  {isAr ? "فرع بادَم (المحمدية):" : "BADEM Boutique (Al Mohammadiyah):"}
                </p>
                <p className="text-[11px] text-stone-600 leading-tight">
                  {isAr ? "شارع التخصصي، حي المحمدية، الرياض 12363." : "Takhassusi St., Al Mohammadiyah, Riyadh 12363."}
                </p>
                <div className="flex items-center gap-1.5 text-[10.5px] text-stone-500 pt-0.5">
                  <Clock className="w-3 h-3 text-[#C59B27]" />
                  <span>{isAr ? "يومياً: 4:00 عصراً – 12:00 منتصف الليل" : "Daily: 4:00 PM – 12:00 AM"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-200">
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#4A0E17] hover:bg-[#34050D] text-white rounded-xl text-[10.5px] font-bold shadow-xs transition"
                >
                  <MapPin className="w-3 h-3 text-[#E5C058]" />
                  <span>{isAr ? "خرائط Google" : "Directions"}</span>
                </a>
                <a
                  href={phoneCallNumber}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 rounded-xl text-[10.5px] font-bold shadow-xs transition"
                >
                  <Phone className="w-3 h-3 text-emerald-700" />
                  <span>{isAr ? "اتصال بالفرع" : "Call"}</span>
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 🛵 شريط متابعة الطلب النشط */}
      {activeOrder && (
        <div className="bg-emerald-900/90 border-t border-emerald-500/30 text-emerald-100 text-[11px] py-1 px-4 flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="max-w-md md:max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold">
                {isAr ? `طلبك (${activeOrder.id}) قيد التجهيز طازجاً في الفرع الآن ✨` : `Your order (${activeOrder.id}) is being freshly prepared!`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveOrder(null)}
              className="text-emerald-300 hover:text-white transition cursor-pointer"
              title="إخفاء"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};