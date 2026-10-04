"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { 
  PackagePlus, Save, Layers, 
  DollarSign, Loader2, Eye, EyeOff 
} from "lucide-react";

// تعريف النوع محلياً لضمان عدم حدوث أي تعارض مع ملفات أخرى
export interface BoxTier {
  id: string;
  name_ar: string;
  name_en: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  capacity: number;
  price: number;
  is_active?: boolean;
}

interface BoxSettings {
  pricing_mode: "dynamic" | "fixed";
  packaging_fee: number;
  is_enabled: boolean;
}

const defaultTiers: BoxTier[] = [
  { 
    id: "box_250g", 
    name_ar: "بوكس ربع كيلو (250g)", 
    name_en: "Box (250g)", 
    subtitle_ar: "8 - 10 قطع",
    capacity: 2, 
    price: 25,
    is_active: true
  },
  { 
    id: "box_500g", 
    name_ar: "بوكس نصف كيلو (500g)", 
    name_en: "Box (500g)", 
    subtitle_ar: "16 - 20 قطعة",
    capacity: 4, 
    price: 45,
    is_active: true
  },
  { 
    id: "box_1000g", 
    name_ar: "بوكس 1 كيلو (1000g)", 
    name_en: "Box (1kg)", 
    subtitle_ar: "30 - 36 قطعة",
    capacity: 8, 
    price: 85,
    is_active: true
  },
];

export const BoxBuilderSettings: React.FC = () => {
  const [tiers, setTiers] = useState<BoxTier[]>(defaultTiers);
  const [settings, setSettings] = useState<BoxSettings>({
    pricing_mode: "dynamic",
    packaging_fee: 0,
    is_enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: sData }, { data: tData }] = await Promise.all([
        supabase.from("box_builder_settings").select("*").eq("id", "default").maybeSingle(),
        supabase.from("custom_box_tiers").select("*").order("capacity", { ascending: true }),
      ]);

      if (sData) {
        setSettings({
          pricing_mode: sData.pricing_mode || "dynamic",
          packaging_fee: Number(sData.packaging_fee) || 0,
          is_enabled: sData.is_enabled ?? true,
        });
      }

      if (tData && tData.length > 0) {
        setTiers(tData);
      } else {
        setTiers(defaultTiers);
      }
    } catch (e) {
      console.error("Error fetching box settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // جلب البيانات بشكل غير متزامن لتفادي تحذيرات ESLint
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        void fetchSettings();
      }
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. حفظ الإعدادات العامة
      const { error: sErr } = await supabase.from("box_builder_settings").upsert({
        id: "default",
        pricing_mode: settings.pricing_mode,
        packaging_fee: Number(settings.packaging_fee),
        is_enabled: settings.is_enabled,
        
      });
      if (sErr) throw new Error(`خطأ في حفظ الإعدادات: ${sErr.message}`);

      // 2. حفظ مقاسات البوكسات
      for (const t of tiers) {
        const { error: tErr } = await supabase.from("custom_box_tiers").upsert({
          id: t.id,
          name_ar: t.name_ar,
          name_en: t.name_en,
          subtitle_ar: t.subtitle_ar || "",
          capacity: Number(t.capacity),
          price: Number(t.price),
          is_active: t.is_active ?? true,
          updated_at: new Date().toISOString(),
        });
        if (tErr) throw new Error(`خطأ في حفظ ${t.name_ar}: ${tErr.message}`);
      }

      alert("تم حفظ إعدادات ومقاسات البوكسات بنجاح! 📦✨");
      await fetchSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      alert("تعذر الحفظ: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const updateTier = (id: string, field: keyof BoxTier, val: string | number | boolean) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: val } : t))
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-stone-200">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#4A0E17]" />
        <span className="text-xs text-stone-400 mt-2 block font-bold">جاري تحميل إعدادات البوكسات...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17]">
            <PackagePlus className="w-5 h-5 text-[#C59B27]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#4A0E17]">إعدادات خدمة صانع البوكسات المخصصة</h3>
            <p className="text-[11px] text-stone-400">التحكم في طريقة التسعير، رسوم التغليف، والمقاسات والملاحظات</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[#4A0E17] hover:bg-[#34050D] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#E5C058]" />}
          <span>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#FAF5ED] p-4 rounded-2xl border border-stone-200/80 space-y-2">
          <label className="text-xs font-black text-[#4A0E17] block">نظام تسعير البوكس:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, pricing_mode: "dynamic" })}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                settings.pricing_mode === "dynamic"
                  ? "bg-[#4A0E17] text-white border-[#4A0E17]"
                  : "bg-white text-stone-700 border-stone-200"
              }`}
            >
              ديناميكي (مجموع الحبات)
            </button>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, pricing_mode: "fixed" })}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                settings.pricing_mode === "fixed"
                  ? "bg-[#4A0E17] text-white border-[#4A0E17]"
                  : "bg-white text-stone-700 border-stone-200"
              }`}
            >
              ثابت (سعر محدد للبوكس)
            </button>
          </div>
        </div>

        <div className="bg-[#FAF5ED] p-4 rounded-2xl border border-stone-200/80 space-y-2">
          <label className="text-xs font-black text-[#4A0E17] flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>رسوم التغليف الإضافية (ر.س):</span>
          </label>
          <input
            type="number"
            min="0"
            value={settings.packaging_fee}
            onChange={(e) => setSettings({ ...settings, packaging_fee: Number(e.target.value) })}
            className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-black text-[#4A0E17] block flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#C59B27]" />
          <span>مقاسات البوكسات وتفاصيلها:</span>
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tiers.map((tier) => (
            <div key={tier.id} className="p-4 bg-[#FAF5ED]/50 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-stone-400 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                  {tier.id}
                </span>
                <button
                  type="button"
                  onClick={() => updateTier(tier.id, "is_active", !(tier.is_active ?? true))}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition ${
                    tier.is_active ?? true
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {tier.is_active ?? true ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{tier.is_active ?? true ? "مفعّل" : "معطل"}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">الاسم بالعربي:</label>
                <input
                  type="text"
                  value={tier.name_ar}
                  onChange={(e) => updateTier(tier.id, "name_ar", e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">الاسم بالإنجليزي:</label>
                <input
                  type="text"
                  value={tier.name_en}
                  onChange={(e) => updateTier(tier.id, "name_en", e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  ملاحظة / عدد القطع (تظهر تحت البوكس):
                </label>
                <input
                  type="text"
                  placeholder="مثال: 8 - 10 قطع"
                  value={tier.subtitle_ar || ""}
                  onChange={(e) => updateTier(tier.id, "subtitle_ar", e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">السعة (قطع):</label>
                  <input
                    type="number"
                    min="1"
                    value={tier.capacity}
                    onChange={(e) => updateTier(tier.id, "capacity", Number(e.target.value))}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">السعر الثابت (ر.س):</label>
                  <input
                    type="number"
                    min="0"
                    value={tier.price}
                    onChange={(e) => updateTier(tier.id, "price", Number(e.target.value))}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};