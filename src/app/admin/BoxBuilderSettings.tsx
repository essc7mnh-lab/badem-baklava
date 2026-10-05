"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/supabase";
import { 
  PackagePlus, 
  Save, 
  Layers, 
  DollarSign, 
  Loader2, 
  Eye, 
  EyeOff,
  Check,
  CheckCheck,
  XCircle,
  Sparkles,
  Tag
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
  allowed_categories: string[];
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
    allowed_categories: [],
  });
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      // 🎯 جلب جدول الأقسام الحقيقي (الذي يظهر في الترويسة: الأقسام 3) مع بقية الإعدادات
      const [
        { data: sData }, 
        { data: tData },
        { data: cData },
        { data: pData }
      ] = await Promise.all([
        supabase.from("box_builder_settings").select("*").eq("id", "default").maybeSingle(),
        supabase.from("custom_box_tiers").select("*").order("capacity", { ascending: true }),
        supabase.from("categories").select("*"), // 👈 جدول الأقسام الفعلي
        supabase.from("products").select("category_ar, category, category_id"),
      ]);

      // 1. تعيين إعدادات البوكس
      if (sData) {
        setSettings({
          pricing_mode: sData.pricing_mode || "dynamic",
          packaging_fee: Number(sData.packaging_fee) || 0,
          is_enabled: sData.is_enabled ?? true,
          allowed_categories: Array.isArray(sData.allowed_categories) ? sData.allowed_categories : [],
        });
      }

      // 2. تعيين مقاسات البوكسات
      if (tData && tData.length > 0) {
        setTiers(tData);
      } else {
        setTiers(defaultTiers);
      }

      // 3. 🌟 استخراج الأقسام الثلاثة من جدول categories مباشرة
      const uniqueCats = new Set<string>();

      if (cData && Array.isArray(cData) && cData.length > 0) {
        cData.forEach((c: { name_ar?: string; title_ar?: string; name?: string; title?: string }) => {
          const catName = c.name_ar || c.title_ar || c.name || c.title;
          if (catName && typeof catName === "string" && catName.trim()) {
            uniqueCats.add(catName.trim());
          }
        });
      }

      // كاحتياط في حال لم يجد شيئاً في جدول categories
      if (uniqueCats.size === 0 && pData && Array.isArray(pData)) {
        pData.forEach((p: { category_ar?: string; category?: string }) => {
          const catName = p.category_ar || p.category;
          if (catName && typeof catName === "string" && catName.trim()) {
            uniqueCats.add(catName.trim());
          }
        });
      }

      setAllCategories(Array.from(uniqueCats));
    } catch (e) {
      console.error("Error fetching box settings:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // جلب البيانات بشكل غير متزامن لتفادي تحذيرات دورة حياة React
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

  // إدارة تبديل اختيار القسم المعتمد
  const toggleCategory = (catName: string) => {
    setSettings((prev) => {
      const exists = prev.allowed_categories.includes(catName);
      return {
        ...prev,
        allowed_categories: exists
          ? prev.allowed_categories.filter((c) => c !== catName)
          : [...prev.allowed_categories, catName],
      };
    });
  };

  const handleSelectAllCategories = () => {
    setSettings((prev) => ({
      ...prev,
      allowed_categories: [...allCategories],
    }));
  };

  const handleClearAllCategories = () => {
    setSettings((prev) => ({
      ...prev,
      allowed_categories: [],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. حفظ الإعدادات العامة والأقسام المعتمدة
      const { error: sErr } = await supabase.from("box_builder_settings").upsert({
        id: "default",
        pricing_mode: settings.pricing_mode,
        packaging_fee: Number(settings.packaging_fee),
        is_enabled: settings.is_enabled,
        allowed_categories: settings.allowed_categories,
        updated_at: new Date().toISOString(),
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

      alert("تم حفظ إعدادات البوكسات والأقسام المعتمدة بنجاح! 📦✨");
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
      
      {/* الترويسة الرئيسية وزر الحفظ */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17]">
            <PackagePlus className="w-5 h-5 text-[#C59B27]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#4A0E17]">إعدادات خدمة صانع البوكسات المخصصة</h3>
            <p className="text-[11px] text-stone-400">التحكم في طريقة التسعير، رسوم التغليف، الأقسام المعتمدة، والمقاسات</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[#4A0E17] hover:bg-[#34050D] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-[#E5C058]" />}
          <span>{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
        </button>
      </div>

      {/* 1. إعدادات التسعير والتغليف */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#FAF5ED] p-4 rounded-2xl border border-stone-200/80 space-y-2">
          <label className="text-xs font-black text-[#4A0E17] block">نظام تسعير البوكس:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, pricing_mode: "dynamic" })}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                settings.pricing_mode === "dynamic"
                  ? "bg-[#4A0E17] text-white border-[#4A0E17] shadow-xs"
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
                  ? "bg-[#4A0E17] text-white border-[#4A0E17] shadow-xs"
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
            className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* 2. 🌟 قسم اختيار الأقسام المعتمدة لصانع البوكسات */}
      <div className="bg-[#FAF5ED]/70 p-4 sm:p-5 rounded-2xl border border-[#C59B27]/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
          <div>
            <h4 className="text-xs font-black text-[#4A0E17] flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#C59B27]" />
              <span>الأقسام المعتمدة التي تظهر في صانع البوكسات:</span>
            </h4>
            <p className="text-[10.5px] text-stone-500 font-medium mt-0.5">
              اختر الأقسام التي ترغب بعرض منتجاتها للعميل عند تشكيل البوكس (مثلاً: استبعاد المشروبات أو الأقسام غير المناسبة).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSelectAllCategories}
              className="text-[10.5px] font-bold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <CheckCheck className="w-3 h-3 text-emerald-600" />
              <span>تحديد الكل</span>
            </button>
            <button
              type="button"
              onClick={handleClearAllCategories}
              className="text-[10.5px] font-bold text-stone-600 hover:text-rose-600 bg-white border border-stone-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <XCircle className="w-3 h-3 text-rose-500" />
              <span>إلغاء الكل</span>
            </button>
          </div>
        </div>

        {allCategories.length === 0 ? (
          <div className="p-4 text-center text-xs text-stone-400 bg-white rounded-xl border border-stone-200">
            لم يتم العثور على أقسام مسجلة في المنتجات حالياً.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 pt-1">
            {allCategories.map((cat) => {
              const isSelected = settings.allowed_categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-[#4A0E17] text-white border-[#4A0E17] shadow-xs scale-[1.02]"
                      : "bg-white text-stone-700 border-stone-200 hover:border-[#4A0E17]/40 hover:bg-[#FAF5ED]"
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[9px] border transition ${
                      isSelected
                        ? "bg-[#E5C058] text-[#4A0E17] border-[#E5C058]"
                        : "border-stone-300 bg-stone-50"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="text-[10px] text-stone-400 pt-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#C59B27]" />
          <span>
            {settings.allowed_categories.length === 0
              ? "ملاحظة: عند عدم تحديد أي قسم، ستظهر جميع أصناف المتجر المتوفرة تلقائياً."
              : `تم تفعيل (${settings.allowed_categories.length}) من أصل (${allCategories.length}) قسم.`}
          </span>
        </div>
      </div>

      {/* 3. مقاسات البوكسات وتفاصيلها */}
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
                  className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">الاسم بالإنجليزي:</label>
                <input
                  type="text"
                  value={tier.name_en}
                  onChange={(e) => updateTier(tier.id, "name_en", e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-medium focus:outline-hidden focus:border-[#4A0E17]"
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
                  className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
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
                    className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">السعر الثابت (ر.س):</label>
                  <input
                    type="number"
                    min="0"
                    value={tier.price}
                    onChange={(e) => updateTier(tier.id, "price", Number(e.target.value))}
                    className="w-full bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
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