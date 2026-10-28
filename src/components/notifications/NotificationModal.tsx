"use client";

import React, { useEffect, useState } from "react";
import { 
  X, 
  Bell, 
  CheckCheck, 
  Trash2, 
  Package, 
  Coins, 
  Sparkles, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  Tag
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase/supabase";
import { royalSound } from "@/lib/sound";

interface BroadcastCoupon {
  id: string;
  code: string;
  discount_percent: number;
  broadcast_title?: string | null;
  badge_text?: string | null;
  min_order_amount?: number | null;
  expires_at?: string | null;
  one_per_customer?: boolean | null;
}

export const NotificationModal: React.FC = () => {
  const { 
    isNotificationsOpen, 
    setIsNotificationsOpen, 
    notifications = [], 
    unreadNotificationsCount = 0, 
    markNotificationAsRead,
    markAllNotificationsAsRead, 
    clearNotifications,
    openOrderTracking
  } = useUser();

  const { applyCoupon, setIsCartOpen } = useCart();
  const { language } = useLanguage();
  const isAr = language === "ar";

  // حالة الكوبونات الملكية المذاعة من لوحة التحكم
  const [broadcastCoupons, setBroadcastCoupons] = useState<BroadcastCoupon[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // جلب الكوبونات المذاعة فور فتح النافذة
  useEffect(() => {
    if (!isNotificationsOpen) return;

    let isMounted = true;
    const fetchBroadcastCoupons = async () => {
      try {
        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .eq("is_active", true)
          .eq("is_broadcast", true)
          .order("created_at", { ascending: false });

        if (!error && data && isMounted) {
          const valid = (data as BroadcastCoupon[]).filter((c) => {
            if (!c.expires_at) return true;
            return new Date(c.expires_at) >= new Date();
          });
          setBroadcastCoupons(valid);
        }
      } catch (err) {
        console.warn("Failed to load broadcast coupons:", err);
      }
    };

    fetchBroadcastCoupons();

    return () => {
      isMounted = false;
    };
  }, [isNotificationsOpen]);

  // إغلاق النافذة بزر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isNotificationsOpen) {
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNotificationsOpen, setIsNotificationsOpen]);

  if (!isNotificationsOpen) return null;

  // نسخ وتطبيق الكوبون في السلة فوراً
  const handleApplyCouponDirectly = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      royalSound?.playSuccessChime();

      await applyCoupon(code);

      setTimeout(() => {
        setIsNotificationsOpen(false);
        setIsCartOpen(true);
      }, 650);
    } catch (e) {
      console.warn("Copy error:", e);
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "order":
        return {
          icon: <Package className="w-4 h-4 text-[#C59B27]" />,
          bg: "bg-[#C59B27]/10 border-[#C59B27]/25"
        };
      case "points":
        return {
          icon: <Coins className="w-4 h-4 text-emerald-600" />,
          bg: "bg-emerald-50 border-emerald-200"
        };
      case "alert":
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
          bg: "bg-rose-50 border-rose-200"
        };
      default:
        return {
          icon: <Sparkles className="w-4 h-4 text-[#E5C058]" />,
          bg: "bg-[#4A0E17]/10 border-[#4A0E17]/20"
        };
    }
  };

  const handleNotificationClick = (notif: { id: string; orderId?: string }) => {
    if (notif.orderId && openOrderTracking) {
      openOrderTracking(notif.orderId, notif.id);
      return;
    }
    if (markNotificationAsRead) {
      markNotificationAsRead(notif.id);
    }
  };

  const totalAlertsCount = notifications.length + broadcastCoupons.length;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "مركز التنبيهات المباشرة" : "Notifications Center"}
    >
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={() => setIsNotificationsOpen(false)}
        aria-label="Close modal overlay"
      />

      <div className="bg-[#FAF5ED] w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[85vh] flex flex-col relative z-10 text-[#2D2321] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* الترويسة العنابية الفاخرة */}
        <div className="bg-gradient-to-r from-[#4A0E17] via-[#36070E] to-[#4A0E17] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#C59B27]/30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-[#C59B27]/40 flex items-center justify-center text-[#E5C058] relative shadow-xs">
              <Bell className="w-5 h-5 animate-pulse" />
              {unreadNotificationsCount > 0 && (
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-[#4A0E17]" />
              )}
            </div>
            <div>
              <span className="text-[9px] tracking-[0.25em] text-[#E5C058] font-black uppercase font-brand block leading-tight">
                BADEM VIP ALERTS
              </span>
              <h3 className="font-black text-sm sm:text-base text-white">
                {isAr ? "ديوان تنبيهات بادَم" : "Live Notifications"}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNotificationsOpen(false)}
            aria-label={isAr ? "إغلاق التنبيهات" : "Close"}
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* شريط الإجراءات والعداد */}
        {notifications.length > 0 && (
          <div className="bg-white px-4 py-2 border-b border-stone-200/80 flex items-center justify-between text-[11px] font-bold text-stone-500 shadow-2xs">
            <span className="text-stone-700">
              {isAr ? `لديك ${totalAlertsCount} تنبيهات` : `${totalAlertsCount} Alerts`}
            </span>
            <div className="flex items-center gap-3">
              {unreadNotificationsCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="flex items-center gap-1 text-[#4A0E17] hover:underline active:scale-95 transition cursor-pointer font-black"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? "تحديد كمقروء" : "Mark read"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={clearNotifications}
                className="flex items-center gap-1 text-stone-400 hover:text-rose-600 active:scale-95 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isAr ? "مسح الكل" : "Clear"}</span>
              </button>
            </div>
          </div>
        )}

        {/* قائمة بطاقات التنبيهات */}
        <div className="p-4 space-y-3 overflow-y-auto no-scrollbar flex-1 overscroll-contain">
          
          {/* 🌟 1. قسائم الإهداء الملكية المذاعة من لوحة التحكم (VIP Vouchers) */}
          {broadcastCoupons.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-gradient-to-br from-[#4A0E17] via-[#3B0710] to-[#250308] text-white p-4 sm:p-5 rounded-3xl border border-[#C59B27]/40 shadow-xl space-y-3 relative overflow-hidden animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[9.5px] bg-[#E5C058]/20 text-[#E5C058] border border-[#E5C058]/35 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{coupon.badge_text || (isAr ? "عرض حصري ✨" : "VIP Offer")}</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest text-stone-300 font-bold">
                  BADEM VIP VOUCHER
                </span>
              </div>

              <div className="space-y-0.5">
                <h4 className="font-black text-sm text-white">
                  {coupon.broadcast_title || (isAr ? "قسيمة خصم ملكية خاصة بضيافتكم" : "Royal Courtesy Voucher")}
                </h4>
                <p className="text-xs text-[#E5C058] font-bold">
                  {isAr 
                    ? `خصم ${coupon.discount_percent}% فوري على تشكيلة الحلويات الفاخرة` 
                    : `Instant ${coupon.discount_percent}% discount on luxury sweets`}
                </p>
              </div>

              {/* كود الكوبون وزر التطبيق المباشر في السلة */}
              <div className="bg-black/35 p-2.5 rounded-2xl border border-white/15 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#E5C058]" />
                  <span className="font-mono text-xs font-black tracking-widest text-[#FAF5ED] uppercase select-all">
                    {coupon.code}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleApplyCouponDirectly(coupon.code)}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
                    copiedCode === coupon.code
                      ? "bg-emerald-600 text-white"
                      : "bg-gradient-to-r from-[#C59B27] via-[#D8AE38] to-[#C59B27] hover:brightness-110 text-[#4A0E17] active:scale-95"
                  }`}
                >
                  {copiedCode === coupon.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>مطبق في السلة! 🎉</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>تطبيق في السلة 🛍️</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* 🌟 2. إشعارات حساب العميل العادية (الطلبات، النقاط) */}
          {notifications.length === 0 && broadcastCoupons.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-stone-200/80 text-center text-stone-400 space-y-2 shadow-2xs my-auto">
              <div className="w-12 h-12 rounded-full bg-[#4A0E17]/5 flex items-center justify-center mx-auto text-stone-400 mb-2">
                <Bell className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-stone-700">
                {isAr ? "لا توجد إشعارات جديدة حالياً" : "No new notifications"}
              </p>
              <p className="text-[10px] text-stone-400 leading-relaxed max-w-xs mx-auto">
                {isAr 
                  ? "ستظهر هنا تحديثات طلباتك الحية، العروض، والنقاط أولاً بأول." 
                  : "Order updates, offers, and points will appear here."}
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const badge = getNotificationBadge(notif.type);
              const isOrderLinked = Boolean(notif.orderId);

              return (
                <div
                  key={notif.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(notif)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleNotificationClick(notif);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 select-none cursor-pointer active:scale-[0.99] ${
                    notif.isRead
                      ? "bg-white/80 border-stone-200/70 text-stone-700 shadow-2xs"
                      : "bg-white border-[#4A0E17]/30 text-stone-900 shadow-xs ring-1 ring-[#4A0E17]/10 hover:border-[#4A0E17]/50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${badge.bg}`}>
                    {badge.icon}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#4A0E17] shrink-0 animate-pulse" />
                        )}
                        <h4 className="text-xs font-black text-[#4A0E17] truncate leading-tight">
                          {notif.title}
                        </h4>
                      </div>
                      <span className="text-[9.5px] text-stone-400 flex items-center gap-1 shrink-0 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{notif.date}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-stone-600 leading-relaxed break-words font-medium">
                      {notif.message}
                    </p>

                    {isOrderLinked && (
                      <div className="pt-1 flex items-center gap-1 text-[10px] text-[#C59B27] font-black group">
                        <span className="underline underline-offset-2">
                          {isAr ? "اضغط لتتبع حالة الطلب المباشرة" : "Track live order status"}
                        </span>
                        <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1 rtl:rotate-0 ltr:rotate-180" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};