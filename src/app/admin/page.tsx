"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, Layers, Package, ImageIcon, Tag, 
  Medal, PackagePlus, MessageSquare, RefreshCw, LogOut, Volume2, Loader2 
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";

// المكونات الفرعية المستقلة
import { OrdersManager, type AdminOrder } from "./OrdersManager";
import { CategoriesManager, type CategoryItem } from "./CategoriesManager";
import { ProductsManager, type ProductItem } from "./ProductsManager";
import { BannersManager, type BannerItem } from "./BannersManager";
import { CouponsManager, type CouponItem } from "./CouponsManager";
import { LoyaltyManager, type LoyaltyRewardItem } from "./LoyaltyManager";
import { BoxBuilderSettings } from "./BoxBuilderSettings";
import { ReviewsManager } from "./ReviewsManager";
import { CustomersManager } from "./CustomersManager";
import { Users } from "lucide-react"; 

type AdminTab = "orders" | "customers" | "categories" | "products" | "banners" | "coupons" | "loyalty" | "box_settings" | "reviews";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");

  // بيانات لوحة التحكم العامة
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyRewardItem[]>([]);
  const [pointsPerSar, setPointsPerSar] = useState<number>(10);

  const audioCtxRef = useRef<AudioContext | null>(null);
// 🛡️ فحص صلاحية الدخول: إذا لم يكن مسجل الدخول، التحويل الفوري لصفحة /login
  useEffect(() => {
    const timer = setTimeout(() => {
      const isAuth = typeof window !== "undefined" && sessionStorage.getItem("badem_admin_auth") === "true";
      if (!isAuth) {
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  // نغمة التنبيه للطلبات الجديدة
  const playLuxuryOrderAlert = useCallback(() => {
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtxClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn("Audio trigger error:", e);
    }
  }, []);

  // جلب البيانات من Supabase
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, banRes, coupRes, ordRes, loyRes, setRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("banners").select("*").order("created_at", { ascending: false }),
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("loyalty_rewards").select("*").order("points_required", { ascending: true }),
        supabase.from("store_settings").select("*").eq("id", "loyalty").maybeSingle(),
      ]);

      if (catRes.data) setCategories(catRes.data as CategoryItem[]);
      if (prodRes.data) setProducts(prodRes.data as ProductItem[]);
      if (banRes.data) setBanners(banRes.data as BannerItem[]);
      if (coupRes.data) setCoupons(coupRes.data as CouponItem[]);
      if (ordRes.data) setOrders(ordRes.data as AdminOrder[]);
      if (loyRes.data) setLoyaltyRewards(loyRes.data as LoyaltyRewardItem[]);
      if (setRes.data?.points_per_sar) setPointsPerSar(Number(setRes.data.points_per_sar));

    } catch (e) {
      console.error("Error fetching admin data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // الربط اللحظي للطلبات والتحديث الأولي
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setTimeout(() => {
      void fetchData();
    }, 0);

    const channel = supabase
      .channel("realtime-admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        setOrders((prev) => [payload.new as AdminOrder, ...prev]);
        playLuxuryOrderAlert();
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated, fetchData, playLuxuryOrderAlert]);

  const handleLogout = () => {
    sessionStorage.removeItem("badem_admin_auth");
    router.replace("/login");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF5ED] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4A0E17]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5ED] text-[#2D2321] p-4 md:p-8 font-sans pb-24 select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* شريط العنوان والعمليات العلوي */}
        <div className="bg-[#4A0E17] text-white p-6 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 border border-[#C59B27]/30">
          <div>
            <span className="text-[10px] tracking-widest text-[#E5C058] font-black uppercase font-brand">BADEM MASTER CONTROL</span>
            <h1 className="text-2xl font-black text-white mt-1">لوحة تحكم المتجر وقواعد البيانات</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={playLuxuryOrderAlert}
              title="تجربة صوت التنبيه"
              className="p-2.5 bg-white/10 text-[#E5C058] rounded-xl cursor-pointer hover:bg-white/20 active:scale-90 transition"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-white/20 active:scale-95 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>تحديث</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-rose-700 active:scale-95 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>

        {/* أزرار التبويبات المنظمة */}
        <div className="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto no-scrollbar">
          {[
            { id: "orders" as const, label: `الطلبات (${orders.length})`, icon: ShoppingBag },
            { id: "customers" as const, label: "العملاء والمشتركون (VIP)", icon: Users },
            { id: "categories" as const, label: `الأقسام (${categories.length})`, icon: Layers },
            { id: "products" as const, label: `المنتجات (${products.length})`, icon: Package },
            { id: "banners" as const, label: `العروض والبانرات (${banners.length})`, icon: ImageIcon },
            { id: "coupons" as const, label: `الكوبونات والأمان 🛡️ (${coupons.length})`, icon: Tag },
            { id: "loyalty" as const, label: `نقاط المكافآت (${loyaltyRewards.length})`, icon: Medal },
            { id: "box_settings" as const, label: "خدمة البوكسات", icon: PackagePlus },
            { id: "reviews" as const, label: "التعليقات والتقييمات", icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#4A0E17] text-white shadow-md font-black"
                    : "bg-white text-stone-600 hover:bg-stone-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 🌟 استدعاء التبويبات المستقلة بنظافة تامة وبدون أي كود مكرر */}
        <main>
          {activeTab === "orders" && (
            <OrdersManager 
              orders={orders} 
              productsCount={products.length} 
              couponsCount={coupons.length} 
              fetchData={fetchData} 
            />
          )}
{/* 👈 أضف هذا التبويب الجديد */}
  {activeTab === "customers" && (
    <CustomersManager orders={orders} />
  )}

          {activeTab === "categories" && (
            <CategoriesManager 
              categories={categories} 
              fetchData={fetchData} 
            />
          )}

          {activeTab === "products" && (
            <ProductsManager 
              products={products} 
              categories={categories} 
              fetchData={fetchData} 
              setProducts={setProducts} 
            />
          )}

          {activeTab === "banners" && (
            <BannersManager 
              banners={banners} 
              categories={categories} 
              fetchData={fetchData} 
            />
          )}

          {activeTab === "coupons" && (
            <CouponsManager 
              coupons={coupons} 
              fetchData={fetchData} 
            />
          )}

          {activeTab === "loyalty" && (
            <LoyaltyManager 
              loyaltyRewards={loyaltyRewards} 
              pointsPerSar={pointsPerSar} 
              setPointsPerSar={setPointsPerSar} 
              fetchData={fetchData} 
            />
          )}

          {activeTab === "box_settings" && (
            <div className="pt-2">
              <BoxBuilderSettings />
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="pt-2">
              <ReviewsManager />
            </div>
          )}
        </main>

      </div>
    </div>
  );
}