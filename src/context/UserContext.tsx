"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase/supabase";
import { CartItem } from "@/types";

export interface SavedAddress {
  id: string;
  title: string;
  city: string;
  district: string;
  street: string;
  isDefault?: boolean;
}

export interface PastOrder {
  id: string;
  date: string;
  items: (CartItem | Record<string, unknown>)[];
  totalAmount: number;
  status: string;
  paymentMethod: string;
  phone?: string;
  customerName?: string;
}

export interface NewOrderInput {
  id: string;
  items: (CartItem | Record<string, unknown>)[];
  totalAmount: number;
  paymentMethod: string;
  status?: string;
  phone?: string;
  customerName?: string;
  [key: string]: unknown;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "order" | "points" | "promo";
  date: string;
  isRead: boolean;
  orderId?: string;
}

// واجهة صريحة لتحديثات الطلبات اللحظية من Supabase
interface OrderPayloadRow {
  id: string;
  customer_phone: string;
  status: string;
  subtotal?: string | number;
  total_amount?: string | number;
}

export type ProfileTabType = "info" | "orders" | "addresses";

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  userPhone: string;
  setUserPhone: (phone: string) => void;
  points: number;
  addPoints: (amount: number) => void;
  redeemPoints: (cost: number) => boolean;
  addresses: SavedAddress[];
  addAddress: (addr: Omit<SavedAddress, "id">) => void;
  deleteAddress: (id: string) => void;
  orders: PastOrder[];
  addOrder: (order: NewOrderInput) => Promise<void>;
  resetAllUserData: () => void;
  syncPointsWithDatabase: () => Promise<void>;
  
  // النوافذ المنبثقة
  isProfileOpen: boolean;
  setIsProfileOpen: (open: boolean) => void;
  isRewardsOpen: boolean;
  setIsRewardsOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;

  // الربط الذكي والتوجيه بين الإشعار والملف الشخصي
  activeProfileTab: ProfileTabType;
  setActiveProfileTab: (tab: ProfileTabType) => void;
  targetOrderId: string | null;
  setTargetOrderId: (id: string | null) => void;
  openOrderTracking: (orderId: string, notificationId?: string) => void;

  // إدارة الإشعارات
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEYS = {
  NAME: "badem_user_name",
  PHONE: "badem_user_phone",
  ADDRESSES: "badem_user_addresses",
  ORDERS: "badem_user_orders",
  NOTIFICATIONS: "badem_user_notifications",
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [points, setPoints] = useState(0);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // حالات النوافذ المنبثقة
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // حالات الربط الذكي
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTabType>("info");
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // 1️⃣ استرجاع البيانات بأمان وبشكل غير متزامن لتفادي تعليق التصيير الأولي
  useEffect(() => {
    const loadTimer = setTimeout(() => {
      try {
        if (typeof window !== "undefined") {
          const savedName = localStorage.getItem(STORAGE_KEYS.NAME);
          const savedPhone = localStorage.getItem(STORAGE_KEYS.PHONE);
          const savedAddresses = localStorage.getItem(STORAGE_KEYS.ADDRESSES);
          const savedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
          const savedNotifs = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);

          if (savedName) setUserName(savedName);
          if (savedPhone) setUserPhone(savedPhone);
          if (savedAddresses) {
            const parsed = JSON.parse(savedAddresses);
            if (Array.isArray(parsed)) setAddresses(parsed);
          }
          if (savedOrders) {
            const parsed = JSON.parse(savedOrders);
            if (Array.isArray(parsed)) setOrders(parsed);
          }
          if (savedNotifs) {
            const parsed = JSON.parse(savedNotifs);
            if (Array.isArray(parsed)) setNotifications(parsed);
          }
        }
      } catch (e) {
        console.warn("Failed to load user state from localStorage:", e);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => clearTimeout(loadTimer);
  }, []);

  // 2️⃣ الحفظ التلقائي عند التحديث بعد اكتمال التحميل
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEYS.NAME, userName);
      localStorage.setItem(STORAGE_KEYS.PHONE, userPhone);
      localStorage.setItem(STORAGE_KEYS.ADDRESSES, JSON.stringify(addresses));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) {
      console.warn("Failed to persist user state:", e);
    }
  }, [addresses, orders, userName, userPhone, notifications, isLoaded]);

  // تشغيل نغمة الإشعار الملكية
  const playNotificationSound = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!AudioCtxClass) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtxClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.55);
    } catch {
      // تجاوز صامت في حال منع المتصفح للصوت التلقائي
    }
  }, []);

  // إضافة إشعار جديد
  const pushNotification = useCallback(
    (title: string, message: string, type: "order" | "points" | "promo", orderId?: string) => {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title,
        message,
        type,
        date: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        isRead: false,
        orderId,
      };

      setNotifications((prev) => [newNotif, ...prev]);
      playNotificationSound();
    },
    [playNotificationSound]
  );

  // مزامنة رصيد النقاط مع قاعدة البيانات
  const syncPointsWithDatabase = useCallback(async () => {
    const cleanPhone = userPhone.trim();
    if (!cleanPhone) {
      setPoints(0);
      return;
    }

    try {
      const [{ data: settings }, { data: completedOrders }] = await Promise.all([
        supabase
          .from("store_settings")
          .select("points_per_sar")
          .eq("id", "loyalty")
          .maybeSingle(),
        supabase
          .from("orders")
          .select("subtotal, total_amount, delivery_fee, status")
          .eq("customer_phone", cleanPhone)
          .eq("status", "completed"),
      ]);

      const rate = Number(settings?.points_per_sar) || 1;

      if (completedOrders) {
        const totalEarned = completedOrders.reduce((sum, ord) => {
          const productAmount = parseFloat(String(ord.subtotal || ord.total_amount || "0"));
          return sum + Math.floor(productAmount * rate);
        }, 0);

        const redeemed = Number(localStorage.getItem(`badem_redeemed_${cleanPhone}`) || "0");
        const available = Math.max(0, totalEarned - redeemed);
        setPoints(available);
      }
    } catch (err) {
      console.error("Points sync error:", err);
    }
  }, [userPhone]);

  // ⚡ الاشتراك اللحظي في تحديثات الطلبات وتحديث الحالة الفورية في الذاكرة
  useEffect(() => {
    const cleanPhone = userPhone.trim();
    if (!cleanPhone) return;

    const syncTimer = setTimeout(() => {
      void syncPointsWithDatabase();
    }, 0);

    const channel = supabase
      .channel(`realtime-orders-${cleanPhone}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        async (payload: { new: OrderPayloadRow }) => {
          const updated = payload.new;
          if (updated && updated.customer_phone === cleanPhone) {
            
            // 🌟 1. تحديث حالة الطلب فوراً داخل مصفوفة orders في الذاكرة ليتغير لون الكرت فوراً!
            setOrders((prevOrders) =>
              prevOrders.map((ord) =>
                ord.id === updated.id ? { ...ord, status: updated.status } : ord
              )
            );

            // 🌟 2. دعم حالات لوحة التحكم بالكامل وإرسال الإشعار المناسب
            const st = updated.status;

            if (st === "baking" || st === "in_oven" || st === "في الفرن") {
              pushNotification(
                "🔥 جاري خَبز وتجهيز طلبك",
                `طلبك رقم #${updated.id} تم تسليمه للشيف وهو الآن في الفرن والتجهيز الطازج.`,
                "order",
                updated.id
              );
            } else if (st === "delivering" || st === "with_driver" || st === "مع المندوب") {
              pushNotification(
                "🚚 طلبك خرج مع المندوب",
                `المندوب استلم طلبك #${updated.id} وهو في طريقه الآن إلى موقعكم المسجل.`,
                "order",
                updated.id
              );
            } else if (st === "completed" || st === "مكتمل") {
              const { data: settings } = await supabase
                .from("store_settings")
                .select("points_per_sar")
                .eq("id", "loyalty")
                .maybeSingle();

              const rate = Number(settings?.points_per_sar) || 1;
              const productAmount = parseFloat(String(updated.subtotal || updated.total_amount || "0"));
              const earnedPts = Math.floor(productAmount * rate);

              pushNotification(
                "✅ تم تسليم الطلب وإضافة النقاط!",
                `تم تسليم طلبك بنجاح، وتمت إضافة ${earnedPts} نقطة مكافأة إلى رصيدك 🎉`,
                "points",
                updated.id
              );
              void syncPointsWithDatabase();
            }
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(syncTimer);
      void supabase.removeChannel(channel);
    };
  }, [userPhone, syncPointsWithDatabase, pushNotification]);

  // إدارة قراءة الإشعارات
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // 🎯 الدالة المركزية لربط الإشعار بالطلب والتنقل المباشر
  const openOrderTracking = useCallback(
    (orderId: string, notificationId?: string) => {
      if (notificationId) {
        markNotificationAsRead(notificationId);
      }
      setTargetOrderId(orderId);
      setActiveProfileTab("orders"); // الانتقال لتبويب الطلبات
      setIsNotificationsOpen(false); // إغلاق الإشعارات
      setIsProfileOpen(true);        // فتح الملف الشخصي
    },
    [markNotificationAsRead]
  );

  const addPoints = useCallback((amount: number) => {
    setPoints((prev) => prev + amount);
  }, []);

  const redeemPoints = useCallback(
    (cost: number): boolean => {
      if (points >= cost) {
        setPoints((prev) => prev - cost);
        const cleanPhone = userPhone.trim();
        if (cleanPhone) {
          const current = Number(localStorage.getItem(`badem_redeemed_${cleanPhone}`) || "0");
          localStorage.setItem(`badem_redeemed_${cleanPhone}`, String(current + cost));
        }

        pushNotification(
          "🎟️ تم استبدال النقاط بنجاح",
          `تم استبدال ${cost} نقطة بنجاح، كود الخصم جاهز في محفظتك لاستخدامه في السلة.`,
          "points"
        );
        return true;
      }
      return false;
    },
    [points, userPhone, pushNotification]
  );

  const addAddress = useCallback((addr: Omit<SavedAddress, "id">) => {
    setAddresses((prev) => [...prev, { ...addr, id: `addr-${Date.now()}` }]);
  }, []);

  const deleteAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addOrder = useCallback(
    async (orderData: NewOrderInput) => {
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString("ar-SA")} - ${now.toLocaleTimeString("ar-SA", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;

      const newOrder: PastOrder = {
        id: orderData.id,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        paymentMethod: orderData.paymentMethod,
        date: formattedDate,
        status: orderData.status || "pending",
        phone: orderData.phone,
        customerName: orderData.customerName,
      };

      setOrders((prev) => [newOrder, ...prev]);

      if (orderData.phone && orderData.phone !== userPhone) setUserPhone(orderData.phone);
      if (orderData.customerName && orderData.customerName !== userName) {
        setUserName(orderData.customerName);
      }

      pushNotification(
        "📦 تم استلام طلبك بنجاح",
        `تم استلام طلبك رقم #${orderData.id} وجاري مراجعته وتأكيده عبر الواتساب.`,
        "order",
        orderData.id
      );
    },
    [userName, userPhone, pushNotification]
  );

  const resetAllUserData = useCallback(() => {
    const cleanPhone = userPhone.trim();
    if (typeof window !== "undefined") {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
      if (cleanPhone) {
        localStorage.removeItem(`badem_redeemed_${cleanPhone}`);
      }
    }

    setUserName("");
    setUserPhone("");
    setPoints(0);
    setAddresses([]);
    setOrders([]);
    setNotifications([]);
  }, [userPhone]);

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const contextValue = useMemo(
    () => ({
      userName,
      setUserName,
      userPhone,
      setUserPhone,
      points,
      addPoints,
      redeemPoints,
      addresses,
      addAddress,
      deleteAddress,
      orders,
      addOrder,
      resetAllUserData,
      syncPointsWithDatabase,
      isProfileOpen,
      setIsProfileOpen,
      isRewardsOpen,
      setIsRewardsOpen,
      isNotificationsOpen,
      setIsNotificationsOpen,
      isMenuOpen,
      setIsMenuOpen,
      activeProfileTab,
      setActiveProfileTab,
      targetOrderId,
      setTargetOrderId,
      openOrderTracking,
      notifications,
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,
    }),
    [
      userName,
      userPhone,
      points,
      addPoints,
      redeemPoints,
      addresses,
      addAddress,
      deleteAddress,
      orders,
      addOrder,
      resetAllUserData,
      syncPointsWithDatabase,
      isProfileOpen,
      isRewardsOpen,
      isNotificationsOpen,
      isMenuOpen,
      activeProfileTab,
      targetOrderId,
      openOrderTracking,
      notifications,
      unreadNotificationsCount,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      clearNotifications,
    ]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};