"use client";

import React, { useState, useEffect, useId } from "react";
import {
  X,
  User,
  MapPin,
  Package,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Calendar,
  Phone,
  Home,
  Briefcase,
  Building,
  Clock,
  Truck,
} from "lucide-react";
import { useUser, ProfileTabType } from "@/context/UserContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";

interface OrderItemDetail {
  title: string;
  quantity: number;
  price: number | string;
}

interface UserOrderRecord {
  id: string;
  date?: string;
  items?: OrderItemDetail[];
  totalAmount: number | string;
  status?: string;
}

export const ProfileModal: React.FC = () => {
  const { isProfileOpen } = useUser();

  // عدم حجز أي ذاكرة أو تنفيذ Hooks أثناء إغلاق النافذة
  if (!isProfileOpen) return null;

  return <ProfileModalDialog />;
};

const ProfileModalDialog: React.FC = () => {
  const { 
    setIsProfileOpen, 
    userName = "", 
    setUserName, 
    userPhone = "", 
    setUserPhone, 
    addresses = [], 
    addAddress, 
    deleteAddress, 
    orders = [], 
    points = 0, 
    resetAllUserData,
    activeProfileTab,
    setActiveProfileTab,
    targetOrderId,
  } = useUser();

  const { language } = useLanguage();
  const isAr = language === "ar";
  const { showToast } = useToast();
  const addressFormId = useId();

  // ✅ الاعتماد على الـ Context مباشرة كمصدر وحيد للحقيقة
  const activeTab = activeProfileTab || "info";

  // نموذج إضافة عنوان جديد
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrTitle, setAddrTitle] = useState(isAr ? "المنزل" : "Home");
  const [addrCity] = useState("الرياض");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrStreet, setAddrStreet] = useState("");

  const [localName, setLocalName] = useState(userName);
  const [localPhone, setLocalPhone] = useState(userPhone);

  
  // إغلاق النافذة بزر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setIsProfileOpen]);

  // تمرير الشاشة تلقائياً للطلب المستهدف عند فتح النافذة
  useEffect(() => {
    if (activeTab === "orders" && targetOrderId) {
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(`order-${targetOrderId}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, targetOrderId]);

  const handleTabChange = (tab: ProfileTabType) => {
    if (setActiveProfileTab) {
      setActiveProfileTab(tab);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserName(localName.trim());
    setUserPhone(localPhone.trim());
    showToast(isAr ? "تم حفظ بيانات الحساب بنجاح! ✅" : "Profile saved successfully! ✅", "success");
  };

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrDistrict.trim() || !addrStreet.trim()) {
      showToast(isAr ? "يرجى كتابة الحي وتفاصيل الشارع" : "Please fill district and street", "error");
      return;
    }

    addAddress({
      title: addrTitle,
      city: addrCity,
      district: addrDistrict.trim(),
      street: addrStreet.trim(),
    });

    setAddrDistrict("");
    setAddrStreet("");
    setShowAddAddr(false);
    showToast(isAr ? "تمت إضافة العنوان وحفظه بنجاح! 📍" : "Address added successfully! 📍", "success");
  };

  const handleClearCache = () => {
    const confirmMessage = isAr 
      ? "هل أنت متأكد من تصفير كافة البيانات المحفوظة والبدء من جديد؟" 
      : "Are you sure you want to reset all stored data?";

    if (window.confirm(confirmMessage)) {
      resetAllUserData();
      setLocalName("");
      setLocalPhone("");
      showToast(isAr ? "تم تصفير البيانات بنجاح 🔄" : "Data reset successfully 🔄", "info");
    }
  };

  const avatarInitial = (localName.trim() || userName.trim() || "B").charAt(0).toUpperCase();

  const getAddressIcon = (title: string) => {
    if (title.includes("عمل") || title.toLowerCase().includes("work")) return <Briefcase className="w-3.5 h-3.5" />;
    if (title.includes("ديوان") || title.includes("استراحة")) return <Building className="w-3.5 h-3.5" />;
    return <Home className="w-3.5 h-3.5" />;
  };

  // 🌟 شارات الحالات الأربعة المطابقة تماماً للوحة التحكم الرسمية
  const renderStatusBadge = (status?: string) => {
    const normalized = (status || "").toLowerCase().trim();

    if (normalized === "baking" || normalized === "in_oven" || normalized.includes("فرن")) {
      return (
        <span className="text-[10px] bg-orange-50 border border-orange-200 text-orange-900 font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
          <span>{isAr ? "في الفرن 🔥" : "In Oven 🔥"}</span>
        </span>
      );
    }

    if (normalized === "delivering" || normalized === "with_driver" || normalized.includes("مندوب")) {
      return (
        <span className="text-[10px] bg-blue-50 border border-blue-200 text-blue-900 font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
          <Truck className="w-3 h-3 text-blue-600 animate-bounce" />
          <span>{isAr ? "مع المندوب 🚚" : "With Driver 🚚"}</span>
        </span>
      );
    }

    if (normalized === "completed" || normalized === "delivered" || normalized.includes("مكتمل") || normalized.includes("استلام")) {
      return (
        <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{isAr ? "مكتمل ✅" : "Completed ✅"}</span>
        </span>
      );
    }

    // الحالة الافتراضية عند إنشاء الطلب
    return (
      <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-900 font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
        <Clock className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: "3s" }} />
        <span>{isAr ? "قيد الانتظار ⌛" : "Pending ⌛"}</span>
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "الملف الشخصي" : "User Profile"}
    >
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => setIsProfileOpen(false)}
        aria-label="Close modal overlay"
      />

      <div className="bg-[#FAF5ED] w-full max-w-xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[90vh] flex flex-col relative z-10 text-[#2D2321] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        
        {/* الترويسة الفاخرة */}
        <div className="bg-[#4A0E17] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#C59B27]/30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#C59B27]/20 border border-[#E5C058]/50 flex items-center justify-center font-brand font-black text-lg text-[#E5C058] shadow-inner">
              {avatarInitial}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base text-white truncate max-w-[160px] sm:max-w-[220px]">
                  {localName.trim() || userName.trim() || (isAr ? "عميل بادَم" : "BADEM Guest")}
                </h3>
                <span className="text-[9.5px] bg-[#E5C058] text-[#4A0E17] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{isAr ? "عضو مميز" : "VIP Member"}</span>
                </span>
              </div>
              <p className="text-xs text-stone-300 font-medium mt-0.5">
                {isAr ? "رصيد النقاط: " : "Points: "}
                <strong className="text-[#E5C058] font-mono text-sm">{points}</strong> {isAr ? "نقطة" : "pts"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsProfileOpen(false)}
            aria-label={isAr ? "إغلاق" : "Close"}
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-90 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* شريط التبويبات الثلاثة */}
        <div className="bg-white border-b border-stone-200 grid grid-cols-3 p-1.5 text-xs font-bold gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => handleTabChange("info")}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "info"
                ? "bg-[#4A0E17] text-[#FAF5ED] shadow-sm font-black"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{isAr ? "البيانات" : "Profile"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("orders")}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === "orders"
                ? "bg-[#4A0E17] text-[#FAF5ED] shadow-sm font-black"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>{isAr ? `الطلبات (${orders.length})` : `Orders (${orders.length})`}</span>
            {targetOrderId && (
              <span className="w-2 h-2 rounded-full bg-[#E5C058] animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("addresses")}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === "addresses"
                ? "bg-[#4A0E17] text-[#FAF5ED] shadow-sm font-black"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{isAr ? `العناوين (${addresses.length})` : `Addresses (${addresses.length})`}</span>
          </button>
        </div>

        {/* جسم النافذة */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-4 flex-1 overscroll-contain">
          
          {/* 1. تبويب البيانات */}
          {activeTab === "info" && (
            <div className="bg-white p-5 rounded-3xl border border-stone-200/90 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h4 className="text-xs font-black text-[#4A0E17] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
                  <span>{isAr ? "المعلومات الشخصية المعتمدة" : "Personal Account Info"}</span>
                </h4>
                <span className="text-[10px] text-stone-400 font-bold">
                  {isAr ? "تستخدم لتسريع إتمام الطلبات" : "Used for quick checkout"}
                </span>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isAr ? "الاسم الكامل:" : "Full Name:"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={localName}
                      placeholder={isAr ? "أدخل اسمك الكريم..." : "Enter your name..."}
                      onChange={(e) => setLocalName(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
                    />
                    <User className="w-3.5 h-3.5 text-stone-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    {isAr ? "رقم الجوال (واتساب):" : "Phone Number (WhatsApp):"}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={localPhone}
                      placeholder="05XXXXXXXX"
                      onChange={(e) => setLocalPhone(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
                    />
                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute top-1/2 -translate-y-1/2 left-3 rtl:left-3 rtl:right-auto ltr:right-3 ltr:left-auto pointer-events-none" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#4A0E17] hover:bg-[#36070E] active:scale-95 text-white font-black py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  {isAr ? "حفظ وتحديث البيانات" : "Save & Update Profile"}
                </button>
              </form>

              <div className="pt-3 border-t border-stone-100 flex justify-between items-center">
                <span className="text-[10px] text-stone-400">
                  {isAr ? "البيانات محفوظة بأمان في متصفحك" : "Stored securely in your local browser"}
                </span>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="text-[10px] font-bold text-stone-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{isAr ? "تصفير الذاكرة" : "Reset Data"}</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. تبويب الطلبات (مع تتبع الحالة والتحديد الفوري) */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 border border-stone-200 text-center space-y-2 text-stone-400 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-[#4A0E17]/5 flex items-center justify-center mx-auto text-stone-400 mb-2">
                    <Package className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <p className="text-xs font-bold text-stone-700">
                    {isAr ? "لا توجد طلبات سابقة مسجلة حتى الآن." : "No past orders registered yet."}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {isAr ? "عند إتمام أي طلب عبر الموقع سيتم توثيق فاتورته وتتبعها هنا." : "Orders will be recorded and tracked here."}
                  </p>
                </div>
              ) : (
                (orders as UserOrderRecord[]).map((order) => {
                  const isTargeted = order.id === targetOrderId;

                  return (
                    <div
                      key={order.id}
                      id={`order-${order.id}`}
                      className={`bg-white p-4 rounded-2xl border transition-all duration-300 shadow-2xs space-y-2.5 ${
                        isTargeted
                          ? "border-[#C59B27] ring-4 ring-[#C59B27]/25 shadow-lg scale-[1.01] bg-[#FAF5ED]/30"
                          : "border-stone-200/90 hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#4A0E17] font-mono">
                              #{order.id}
                            </span>
                            {isTargeted && (
                              <span className="text-[9px] bg-[#C59B27] text-white font-black px-1.5 py-0.5 rounded-md shadow-2xs animate-pulse">
                                ✨ {isAr ? "الطلب المحدد" : "Selected"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-stone-400">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{order.date || new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US")}</span>
                          </div>
                        </div>

                        {/* شارة حالة الطلب الحية */}
                        {renderStatusBadge(order.status)}
                      </div>

                      <div className="space-y-1 text-xs text-stone-600 divide-y divide-stone-50">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center pt-1 first:pt-0">
                            <span className="truncate max-w-[220px]">
                              {item.quantity}× {item.title}
                            </span>
                            <span className="font-mono font-bold text-stone-800 shrink-0">
                              {(Number(item.price) * item.quantity).toFixed(2)} {isAr ? "ر.س" : "SAR"}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs font-black">
                        <span className="text-stone-700">{isAr ? "المجموع الكلي:" : "Total Amount:"}</span>
                        <span className="text-[#4A0E17] font-mono text-sm">
                          {Number(order.totalAmount).toFixed(2)} {isAr ? "ر.س" : "SAR"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 3. تبويب العناوين المحفوظة */}
          {activeTab === "addresses" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#4A0E17]">
                  {isAr ? "عناوين التوصيل المسجلة:" : "Registered Delivery Addresses:"}
                </span>

                <button
                  type="button"
                  onClick={() => setShowAddAddr(!showAddAddr)}
                  className="px-3 py-1.5 bg-[#4A0E17] hover:bg-[#34050D] text-white rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#E5C058]" />
                  <span>{showAddAddr ? (isAr ? "إلغاء" : "Cancel") : isAr ? "إضافة عنوان جديد" : "Add Address"}</span>
                </button>
              </div>

              {/* فورم الإضافة السريعة */}
              {showAddAddr && (
                <form
                  id={addressFormId}
                  onSubmit={handleSaveNewAddress}
                  className="bg-white p-4 rounded-2xl border border-[#4A0E17]/20 space-y-3 shadow-xs animate-in fade-in duration-200"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">
                        {isAr ? "نوع العنوان:" : "Label:"}
                      </label>
                      <select
                        value={addrTitle}
                        onChange={(e) => setAddrTitle(e.target.value)}
                        className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-bold focus:outline-hidden"
                      >
                        <option value={isAr ? "المنزل" : "Home"}>{isAr ? "المنزل" : "Home"}</option>
                        <option value={isAr ? "العمل" : "Work"}>{isAr ? "مقر العمل" : "Work"}</option>
                        <option value={isAr ? "الديوان" : "Diwan"}>{isAr ? "الديوان / الاستراحة" : "Diwan"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-stone-600 block mb-1">
                        {isAr ? "المدينة:" : "City:"}
                      </label>
                      <input
                        type="text"
                        disabled
                        value="الرياض (التوصيل الحصري)"
                        className="w-full bg-stone-100 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">
                      {isAr ? "الحي السكني *:" : "District *:"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? "مثال: حي المحمدية" : "e.g., Al Mohammadiyah"}
                      value={addrDistrict}
                      onChange={(e) => setAddrDistrict(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block mb-1">
                      {isAr ? "الشارع وتفاصيل المنزل *:" : "Street / House details *:"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isAr ? "اسم الشارع، رقم الفيلا أو الشقة" : "Street name, villa #"}
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#4A0E17] hover:bg-[#34050D] active:scale-95 text-white font-black py-2 rounded-xl text-xs shadow transition cursor-pointer"
                  >
                    {isAr ? "حفظ العنوان" : "Save Address"}
                  </button>
                </form>
              )}

              {/* قائمة العناوين المحفوظة */}
              {addresses.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center text-stone-400 text-xs shadow-2xs space-y-1">
                  <MapPin className="w-8 h-8 mx-auto text-stone-300 stroke-1 mb-1" />
                  <p className="font-bold text-stone-600">
                    {isAr ? "لا توجد عناوين محفوظة بعد." : "No saved addresses."}
                  </p>
                  <p className="text-[10px]">
                    {isAr ? "سيتم حفظ أي عنوان تدخله عند إتمام طلبك تلقائياً هنا." : "Addresses entered during checkout will be saved here automatically."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {addresses.map((addr, idx) => (
                    <div
                      key={addr.id || idx}
                      className="bg-white p-3.5 rounded-2xl border border-stone-200/90 flex items-center justify-between shadow-2xs hover:border-[#4A0E17]/40 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-[#FAF5ED] text-[#4A0E17] border border-[#4A0E17]/15">
                            {getAddressIcon(addr.title)}
                          </span>
                          <span className="text-xs font-black text-[#4A0E17]">{addr.title}</span>
                          {idx === 0 && (
                            <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-1.5 py-0.5 rounded-md">
                              العنوان الافتراضي
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-600 font-bold leading-relaxed">
                          {addr.city} - {addr.district}
                        </p>
                        <p className="text-[10px] text-stone-400 font-medium">
                          {addr.street}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteAddress(addr.id)}
                        className="text-stone-300 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title={isAr ? "حذف" : "Delete"}
                        aria-label="Delete address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};