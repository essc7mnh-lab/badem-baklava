"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Plus, Trash2, Edit3, ImageIcon, 
  Upload, Loader2, Sparkles, Wand2, Check, Eye, EyeOff, X, Scale, Coffee
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { 
  translateToGourmetEnglish, 
  QUICK_INGREDIENT_ICONS 
} from "@/lib/gourmetTranslator";
import type { CategoryItem } from "./CategoriesManager";

export interface WeightPrices {
  quarter?: number | string;
  half?: number | string;
  kilo?: number | string;
}

export interface ProductItem {
  id: string;
  title_ar: string;
  title_en: string;
  category_slug: string;
  base_price: number | string;
  original_price?: number | string | null;
  weight_prices?: WeightPrices | null; // 👈 أسعار الأوزان المخصصة
  image_url?: string;
  images?: string[];
  is_available?: boolean;
  has_weights?: boolean;
  description_ar?: string | null;
  description_en?: string | null;
  ingredients?: { nameAr: string; nameEn: string; icon: string }[];
}

interface ProductsManagerProps {
  products: ProductItem[];
  categories: CategoryItem[];
  fetchData: () => Promise<void>;
  setProducts: React.Dispatch<React.SetStateAction<ProductItem[]>>;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({
  products,
  categories,
  fetchData,
  setProducts,
}) => {
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [newProd, setNewProd] = useState({
    title_ar: "", 
    title_en: "", 
    category_slug: categories[0]?.slug || "", 
    base_price: "", 
    original_price: "", 
    image_url: "", 
    is_available: true, 
    has_weights: true, 
    description_ar: "", 
    description_en: ""
  });

  // حالات أسعار الأوزان الثلاثة
  const [weightPricesInput, setWeightPricesInput] = useState({
    quarter: "",
    half: "",
    kilo: "",
  });

  const [productImages, setProductImages] = useState<string[]>([]);
  const [productIngredients, setProductIngredients] = useState<{ nameAr: string; nameEn: string; icon: string }[]>([]);
  const [currIngNameAr, setCurrIngNameAr] = useState("");
  const [currIngNameEn, setCurrIngNameEn] = useState("");
  const [currIngIcon, setCurrIngIcon] = useState("🥜");

  const [inlineEditingPriceId, setInlineEditingPriceId] = useState<string | null>(null);
  const [tempPriceValue, setTempPriceValue] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductNameArChange = (value: string) => {
    const translated = translateToGourmetEnglish(value);
    setNewProd((prev) => ({
      ...prev,
      title_ar: value,
      title_en: translated,
    }));
  };

  const handleProductDescArChange = (value: string) => {
    const translated = translateToGourmetEnglish(value);
    setNewProd((prev) => ({
      ...prev,
      description_ar: value,
      description_en: translated,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 8 * 1024 * 1024) {
          alert(`الملف ${file.name} كبير جداً، يرجى اختيار صور أقل من 8 ميجابايت`);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("target", "product");

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || "فشل رفع الصورة");

        setProductImages((prev) => [...prev, data.url]);
        setNewProd((prev) => ({
          ...prev,
          image_url: prev.image_url || data.url,
        }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ غير متوقع";
      alert("خطأ أثناء رفع الصورة: " + message);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryImg = productImages[0] || newProd.image_url.trim();

    // السعر الأساسي هو سعر الربع كيلو (في حالة الأوزان) أو سعر الحبة (في حالة الفردي)
    const effectiveBasePrice = newProd.has_weights 
      ? (weightPricesInput.quarter || newProd.base_price) 
      : newProd.base_price;

    const parsedBasePrice = parseFloat(String(effectiveBasePrice).replace(/[,،]/g, "."));
    const parsedOriginalPrice = newProd.original_price 
      ? parseFloat(String(newProd.original_price).replace(/[,،]/g, ".")) 
      : null;

    if (!newProd.title_ar || isNaN(parsedBasePrice) || parsedBasePrice <= 0 || !primaryImg) {
      return alert("يرجى إكمال بيانات الصنف والسعر وصورة واحدة على الأقل.");
    }

    // تجهيز أسعار الأوزان الثلاثة
    const customWeightPrices = newProd.has_weights ? {
      quarter: parsedBasePrice,
      half: parseFloat(String(weightPricesInput.half || (parsedBasePrice * 1.85)).replace(/[,،]/g, ".")),
      kilo: parseFloat(String(weightPricesInput.kilo || (parsedBasePrice * 3.5)).replace(/[,،]/g, ".")),
    } : null;

    setIsSubmitting(true);
    try {
      const finalImagesList = productImages.length > 0 ? productImages : [primaryImg];

      const payload = {
        title_ar: newProd.title_ar.trim(),
        title_en: newProd.title_en.trim() || translateToGourmetEnglish(newProd.title_ar),
        category_slug: newProd.category_slug || (categories[0]?.slug ?? "baklava"),
        base_price: parsedBasePrice,
        original_price: parsedOriginalPrice,
        weight_prices: customWeightPrices, // 👈 حفظ أسعار الأوزان المخصصة
        has_discount: Boolean(parsedOriginalPrice && parsedOriginalPrice > parsedBasePrice),
        image_url: primaryImg,
        images: finalImagesList,
        is_available: Boolean(newProd.is_available),
        has_weights: Boolean(newProd.has_weights),
        description_ar: newProd.description_ar.trim(),
        description_en: newProd.description_en.trim(),
        ingredients: productIngredients,
      };

      if (editingProdId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingProdId);
        if (error) throw error;
        alert("تم تحديث المنتج وأسعاره بنجاح! ✏️");
      } else {
        const { error } = await supabase.from("products").insert([payload]);
        if (error) throw error;
        alert("تم حفظ المنتج الجديد وأسعار أوزانه بنجاح! ✨");
      }

      setEditingProdId(null);
      setNewProd({
        title_ar: "", title_en: "", category_slug: categories[0]?.slug || "",
        base_price: "", original_price: "", image_url: "", is_available: true,
        has_weights: true, description_ar: "", description_en: ""
      });
      setWeightPricesInput({ quarter: "", half: "", kilo: "" });
      setProductImages([]);
      setProductIngredients([]);
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ أثناء الحفظ";
      alert("تعذر حفظ المنتج: " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveQuickPrice = async (prodId: string) => {
    const cleanNum = parseFloat(tempPriceValue.replace(/[,،]/g, "."));
    if (isNaN(cleanNum) || cleanNum <= 0) {
      alert("يرجى إدخال سعر صحيح أكبر من الصفر.");
      return;
    }

    setProducts((prev) =>
      prev.map((item) => (item.id === prodId ? { ...item, base_price: cleanNum } : item))
    );
    setInlineEditingPriceId(null);

    try {
      const { error } = await supabase
        .from("products")
        .update({ base_price: cleanNum })
        .eq("id", prodId);

      if (error) throw error;
    } catch (err: unknown) {
      console.error("Failed to update quick price:", err);
      alert("تعذر تحديث السعر، يرجى المحاولة مرة أخرى.");
      await fetchData();
    }
  };

  const handleQuickToggleAvailability = async (product: ProductItem) => {
    const nextStatus = !(product.is_available ?? true);

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_available: nextStatus } : p))
    );

    try {
      const { error } = await supabase
        .from("products")
        .update({ is_available: nextStatus })
        .eq("id", product.id);

      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "فشل التحديث";
      alert("تعذر تحديث حالة الصنف: " + msg);
      await fetchData();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المنتج نهائياً؟")) {
      try {
        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) throw error;
        await fetchData();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "خطأ أثناء الحذف";
        alert("تعذر الحذف: " + message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* استمارة إضافة / تعديل المنتج */}
      <form onSubmit={handleSaveProduct} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#4A0E17] flex items-center gap-2">
            {editingProdId ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4" />}
            <span>{editingProdId ? "تعديل بيانات وأسعار المنتج الحالي" : "إضافة منتج فاخر وتحديد أسعاره"}</span>
          </h3>
          {editingProdId && (
            <button
              type="button"
              onClick={() => {
                setEditingProdId(null);
                setNewProd({
                  title_ar: "", title_en: "", category_slug: categories[0]?.slug || "",
                  base_price: "", original_price: "", image_url: "", is_available: true,
                  has_weights: true, description_ar: "", description_en: ""
                });
                setWeightPricesInput({ quarter: "", half: "", kilo: "" });
                setProductImages([]);
                setProductIngredients([]);
              }}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
            >
              إلغاء التعديل ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold mb-1">اسم الصنف بالعربي *:</label>
            <input
              type="text"
              required
              placeholder="مثال: بقلاوة عنتابية بالفستق"
              value={newProd.title_ar}
              onChange={(e) => handleProductNameArChange(e.target.value)}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold"
            />
          </div>

          <div>
            <label className="flex items-center justify-between font-bold mb-1">
              <span>الاسم بالإنجليزي (ترجمة فورية):</span>
              <Wand2 className="w-3 h-3 text-[#C59B27]" />
            </label>
            <input
              type="text"
              placeholder="Antep Pistachio Baklava"
              value={newProd.title_en}
              onChange={(e) => setNewProd({ ...newProd, title_en: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">القسم / التصنيف *:</label>
            <select
              value={newProd.category_slug}
              onChange={(e) => setNewProd({ ...newProd, category_slug: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name_ar}</option>
              ))}
            </select>
          </div>

          {/* 🌟 زر التبديل الفاخر بين نظام البيع بالأوزان أو البيع الفردي */}
          <div className="md:col-span-3 p-3 bg-[#FAF5ED] border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-black text-xs text-[#4A0E17] block flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-[#C59B27]" />
                <span>طريقة بيع وتسعير هذا المنتج:</span>
              </span>
              <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                {newProd.has_weights 
                  ? "مفعّل بالأوزان: تحديد سعر خاص لكل وزن (ربع / نصف / كيلو) يدخل في السلة بدقة." 
                  : "مفعّل بيع فردي: سعر موحد وثابت للقطعة أو الحبة الواحدة."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewProd({ ...newProd, has_weights: true })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  newProd.has_weights 
                    ? "bg-[#4A0E17] text-[#E5C058] shadow-xs" 
                    : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>نظام الأوزان ⚖️</span>
              </button>

              <button
                type="button"
                onClick={() => setNewProd({ ...newProd, has_weights: false })}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  !newProd.has_weights 
                    ? "bg-[#4A0E17] text-[#E5C058] shadow-xs" 
                    : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>بيع فردي / بالحبة ☕</span>
              </button>
            </div>
          </div>

          {/* 🏷️ عرض حقول الأسعار بحسب الاختيار */}
          {newProd.has_weights ? (
            /* في حالة نظام الأوزان: 3 حقول دقيقة ومستقلة */
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl animate-in fade-in duration-200">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  سعر ربع كيلو (250g) * (ر.س):
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="مثال: 35"
                  value={weightPricesInput.quarter || newProd.base_price}
                  onChange={(e) => {
                    setWeightPricesInput({ ...weightPricesInput, quarter: e.target.value });
                    setNewProd({ ...newProd, base_price: e.target.value });
                  }}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-bold font-mono focus:border-[#4A0E17]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  سعر نصف كيلو (500g) * (ر.س):
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="مثال: 65"
                  value={weightPricesInput.half}
                  onChange={(e) => setWeightPricesInput({ ...weightPricesInput, half: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-bold font-mono focus:border-[#4A0E17]"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  سعر 1 كيلو فاخر (1000g) * (ر.س):
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="مثال: 120"
                  value={weightPricesInput.kilo}
                  onChange={(e) => setWeightPricesInput({ ...weightPricesInput, kilo: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-bold font-mono focus:border-[#4A0E17]"
                />
              </div>
            </div>
          ) : (
            /* في حالة البيع الفردي: حقل واحد لسعر الحبة */
            <div className="md:col-span-2 p-3 bg-blue-50/60 border border-blue-200/80 rounded-2xl animate-in fade-in duration-200">
              <label className="block font-bold text-stone-800 mb-1">
                سعر الحبة / القطعة الواحدة * (ر.س):
              </label>
              <input
                type="number"
                step="0.5"
                required
                placeholder="مثال: 12.00"
                value={newProd.base_price}
                onChange={(e) => setNewProd({ ...newProd, base_price: e.target.value })}
                className="w-full bg-white border border-stone-200 rounded-xl p-2.5 font-bold font-mono focus:border-[#4A0E17]"
              />
            </div>
          )}

          <div>
            <label className="block font-bold mb-1">السعر قبل الخصم (اختياري للعروض):</label>
            <input
              type="text"
              placeholder="مثال: 140.00"
              value={newProd.original_price ?? ""}
              onChange={(e) => setNewProd({ ...newProd, original_price: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-medium"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 bg-[#FAF5ED] border border-stone-200 rounded-xl md:col-span-3">
            <div>
              <span className="font-bold block text-stone-800">حالة التوفر بالمخزون:</span>
              <span className="text-[10px] text-stone-500 font-medium">
                {newProd.is_available ? "متوفر للطلب الفوري 🟢" : "نفذت الكمية مؤقتاً 🔴"}
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newProd.is_available}
                onChange={(e) => setNewProd({ ...newProd, is_available: e.target.checked })}
                className="w-5 h-5 accent-[#4A0E17] rounded-md cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* معرض صور المنتج */}
        <div className="bg-[#FAF5ED] p-4 rounded-2xl border border-stone-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-black text-[#4A0E17]">
              <ImageIcon className="w-4 h-4 text-[#C59B27]" />
              <span>صور الصنف (يمكنك رفع أو إضافة عدة صور):</span>
            </label>
            <span className="text-[10px] text-stone-400 font-bold">
              {productImages.length} صور مضافة
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#4A0E17] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#36070E] transition shrink-0">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploadingImage ? "جاري الرفع..." : "+ رفع صورة جديدة"}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingImage}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="flex-1 min-w-[200px] flex gap-2">
              <input
                type="text"
                placeholder="أو الصق رابط صورة هنا واضغط إضافة..."
                value={newProd.image_url}
                onChange={(e) => setNewProd({ ...newProd, image_url: e.target.value })}
                className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newProd.image_url.trim()) return;
                  setProductImages((prev) => [...prev, newProd.image_url.trim()]);
                  setNewProd({ ...newProd, image_url: "" });
                }}
                className="px-3.5 py-2 bg-stone-800 text-white rounded-xl text-xs font-bold hover:bg-black cursor-pointer"
              >
                إضافة الرابط
              </button>
            </div>
          </div>

          {productImages.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-2 border-t border-stone-200/60">
              {productImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-stone-200 bg-white group shadow-2xs"
                >
                  <Image src={imgUrl} alt="" fill sizes="64px" className="object-cover" />
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-[#4A0E17]/90 text-[#E5C058] text-[8px] font-black text-center py-0.5">
                      الرئيسية
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setProductImages((prev) => prev.filter((_, i) => i !== idx))}
                    title="حذف هذه الصورة"
                    className="absolute top-1 right-1 bg-rose-600/90 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold opacity-80 hover:opacity-100 cursor-pointer transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold mb-1">الوصف بالعربي:</label>
            <textarea
              rows={2}
              value={newProd.description_ar || ""}
              onChange={(e) => handleProductDescArChange(e.target.value)}
              placeholder="وصف مكونات ومميزات الصنف بالعربي..."
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs resize-none"
            />
          </div>

          <div>
            <label className="flex items-center justify-between font-bold mb-1 text-xs">
              <span>الوصف بالإنجليزي (ترجمة فورية):</span>
              <Wand2 className="w-3 h-3 text-[#C59B27]" />
            </label>
            <textarea
              rows={2}
              value={newProd.description_en || ""}
              onChange={(e) => setNewProd({ ...newProd, description_en: e.target.value })}
              placeholder="Gourmet English description..."
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs resize-none"
            />
          </div>
        </div>

        {/* تفكيك المكونات */}
        <div className="bg-[#FAF5ED] p-4 rounded-2xl border border-stone-200 space-y-3">
          <label className="flex items-center gap-1.5 text-xs font-black text-[#4A0E17]">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            <span>تفكيك المكونات الطبيعية (اختياري):</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-stone-200">
              <span className="text-base">{currIngIcon}</span>
              <select
                value={currIngIcon}
                onChange={(e) => setCurrIngIcon(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-hidden cursor-pointer"
              >
                {QUICK_INGREDIENT_ICONS.map((ic) => (<option key={ic} value={ic}>{ic}</option>))}
              </select>
            </div>
            <input
              type="text"
              placeholder="اسم المكون (عربي) مثل: سمن بلدي نقي"
              value={currIngNameAr}
              onChange={(e) => {
                setCurrIngNameAr(e.target.value);
                setCurrIngNameEn(translateToGourmetEnglish(e.target.value));
              }}
              className="flex-1 min-w-[140px] bg-white border border-stone-200 rounded-xl p-2 text-xs font-bold"
            />
            <input
              type="text"
              placeholder="ترجمة الإنجليزية..."
              value={currIngNameEn}
              onChange={(e) => setCurrIngNameEn(e.target.value)}
              className="flex-1 min-w-[120px] bg-white border border-stone-200 rounded-xl p-2 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!currIngNameAr.trim()) return;
                setProductIngredients((prev) => [
                  ...prev,
                  { nameAr: currIngNameAr.trim(), nameEn: currIngNameEn.trim() || currIngNameAr.trim(), icon: currIngIcon },
                ]);
                setCurrIngNameAr("");
                setCurrIngNameEn("");
              }}
              className="px-3 py-2 bg-[#4A0E17] text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              + إضافة مكون
            </button>
          </div>
          {productIngredients.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-200/60">
              {productIngredients.map((item, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 bg-white border border-stone-300 px-3 py-1 rounded-xl text-xs font-bold text-stone-800">
                  <span>{item.icon}</span>
                  <span>{item.nameAr}</span>
                  <span className="text-[10px] text-stone-400">({item.nameEn})</span>
                  <button
                    type="button"
                    onClick={() => setProductIngredients((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-stone-400 hover:text-rose-600 mr-1 text-sm cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || uploadingImage}
          className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow cursor-pointer flex items-center gap-2 ${
            editingProdId ? "bg-amber-700 hover:bg-amber-800" : "bg-[#4A0E17] hover:bg-[#36070E]"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : editingProdId ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>{editingProdId ? "حفظ تعديلات المنتج والأسعار" : "حفظ المنتج"}</span>
        </button>
      </form>

      {/* قائمة المنتجات مع محرر الأسعار الفوري وتفصيل الأوزان */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => {
          const isAvail = p.is_available ?? true;
          const isWeighted = p.has_weights ?? true;
          const imagesCount = Array.isArray(p.images) ? p.images.length : (p.image_url ? 1 : 0);
          const isEditingThisPrice = inlineEditingPriceId === p.id;
          const customPrices = p.weight_prices;

          return (
            <div key={p.id} className="bg-white p-4 rounded-3xl border border-stone-200 flex flex-col justify-between gap-3 shadow-2xs">
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-stone-100 bg-stone-50 shrink-0">
                  <Image src={p.image_url || "/hero-baklava.png"} alt={p.title_ar} fill sizes="64px" className="object-cover" />
                  {imagesCount > 1 && (
                    <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                      +{imagesCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs truncate">{p.title_ar}</h4>
                    <span className={`text-[8.5px] px-1.5 py-0.2 rounded-md font-bold shrink-0 ${
                      isWeighted 
                        ? "bg-amber-100 text-amber-900 border border-amber-200" 
                        : "bg-blue-100 text-blue-900 border border-blue-200"
                    }`}>
                      {isWeighted ? "بالوزن ⚖️" : "فردي ☕"}
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 block truncate">{p.title_en}</span>
                  
                  {isEditingThisPrice ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        value={tempPriceValue}
                        onChange={(e) => setTempPriceValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveQuickPrice(p.id);
                          if (e.key === "Escape") setInlineEditingPriceId(null);
                        }}
                        autoFocus
                        placeholder="0.00"
                        className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold bg-[#FAF5ED] border border-[#4A0E17] rounded-lg focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveQuickPrice(p.id)}
                        className="p-1 bg-[#4A0E17] hover:bg-[#34050D] text-white rounded-lg cursor-pointer"
                        title="تأكيد وحفظ السعر"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setInlineEditingPriceId(null)}
                        className="p-1 bg-stone-200 hover:bg-stone-300 text-stone-600 rounded-lg cursor-pointer"
                        title="إلغاء"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-1.5 mt-0.5 cursor-pointer group/price w-fit"
                      onClick={() => {
                        setInlineEditingPriceId(p.id);
                        setTempPriceValue(String(p.base_price));
                      }}
                      title="انقر لتعديل السعر الأساسي فورياً"
                    >
                      <span className="text-xs font-black text-[#4A0E17] font-mono group-hover/price:underline">
                        {Number(p.base_price).toFixed(2)} ر.س
                      </span>
                      <span className="text-[9px] bg-stone-100 text-stone-500 group-hover/price:bg-amber-100 group-hover/price:text-amber-900 px-1 py-0.2 rounded transition flex items-center gap-0.5">
                        <Edit3 className="w-2.5 h-2.5" />
                        <span>تعديل السعر</span>
                      </span>
                    </div>
                  )}

                  {/* 🌟 عرض تفصيلي لأسعار الأوزان المحددة إن وُجدت */}
                  {isWeighted && customPrices && (
                    <div className="text-[9.5px] text-stone-500 font-mono mt-0.5 space-x-1 rtl:space-x-reverse">
                      <span>¼ك: {Number(customPrices.quarter || p.base_price).toFixed(0)}</span>
                      <span>•</span>
                      <span>½ك: {Number(customPrices.half || 0).toFixed(0)}</span>
                      <span>•</span>
                      <span>1ك: {Number(customPrices.kilo || 0).toFixed(0)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProdId(p.id);
                      setNewProd({
                        title_ar: p.title_ar || "",
                        title_en: p.title_en || "",
                        category_slug: p.category_slug || categories[0]?.slug || "",
                        base_price: p.base_price ? String(p.base_price) : "",
                        original_price: p.original_price ? String(p.original_price) : "",
                        image_url: p.image_url || "",
                        is_available: p.is_available ?? true,
                        has_weights: p.has_weights ?? true,
                        description_ar: p.description_ar || "",
                        description_en: p.description_en || "",
                      });
                      // تحميل أسعار الأوزان المحفوظة
                      setWeightPricesInput({
                        quarter: String(p.weight_prices?.quarter || p.base_price || ""),
                        half: String(p.weight_prices?.half || ""),
                        kilo: String(p.weight_prices?.kilo || ""),
                      });
                      setProductImages(Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []));
                      setProductIngredients(p.ingredients || []);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    title="تعديل تفاصيل الصنف وأسعاره كاملاً"
                    className="p-2 text-stone-400 hover:text-amber-600 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p.id)}
                    title="حذف"
                    className="p-2 text-stone-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[10px] text-stone-400 font-bold">حالة الطلب:</span>
                <button
                  type="button"
                  onClick={() => handleQuickToggleAvailability(p)}
                  className={`text-[10.5px] px-3 py-1 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isAvail
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100"
                      : "bg-rose-50 text-rose-800 border border-rose-200/80 hover:bg-rose-100"
                  }`}
                >
                  {isAvail ? (
                    <>
                      <Eye className="w-3 h-3 text-emerald-600" />
                      <span>متوفر للطلب 🟢</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3 text-rose-600" />
                      <span>نفذت الكمية 🔴</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};