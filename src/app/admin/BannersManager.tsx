"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit3, Upload, Loader2, Check, Wand2 } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { translateToGourmetEnglish } from "@/lib/gourmetTranslator";
import type { CategoryItem } from "./CategoriesManager";

export interface BannerItem {
  id: string;
  title_ar: string;
  title_en: string;
  subtitle_ar?: string | null;
  subtitle_en?: string | null;
  tag_ar?: string | null;
  image_url: string;
  target_category_slug?: string | null;
}

interface BannersManagerProps {
  banners: BannerItem[];
  categories: CategoryItem[];
  fetchData: () => Promise<void>;
}

export const BannersManager: React.FC<BannersManagerProps> = ({
  banners,
  categories,
  fetchData,
}) => {
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState({
    title_ar: "",
    title_en: "",
    subtitle_ar: "",
    subtitle_en: "",
    tag_ar: "عرض حصري",
    image_url: "",
    target_category_slug: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBannerTitleArChange = (value: string) => {
    const translated = translateToGourmetEnglish(value);
    setNewBanner((prev) => ({
      ...prev,
      title_ar: value,
      title_en: translated,
    }));
  };

  const handleBannerSubtitleArChange = (value: string) => {
    const translated = translateToGourmetEnglish(value);
    setNewBanner((prev) => ({
      ...prev,
      subtitle_ar: value,
      subtitle_en: translated,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const file = files[0];
      if (file.size > 8 * 1024 * 1024) {
        alert(`الملف ${file.name} كبير جداً، يرجى اختيار صور أقل من 8 ميجابايت`);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("target", "banner");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "فشل رفع الصورة");

      setNewBanner((prev) => ({ ...prev, image_url: data.url }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ غير متوقع";
      alert("خطأ أثناء رفع الصورة: " + message);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.image_url) return alert("يرجى رفع صورة الإعلان أولاً");

    setIsSubmitting(true);
    try {
      const payload = {
        title_ar: newBanner.title_ar.trim(),
        title_en: newBanner.title_en.trim() || translateToGourmetEnglish(newBanner.title_ar),
        subtitle_ar: newBanner.subtitle_ar.trim(),
        subtitle_en: newBanner.subtitle_en.trim() || translateToGourmetEnglish(newBanner.subtitle_ar),
        tag_ar: newBanner.tag_ar.trim(),
        image_url: newBanner.image_url.trim(),
        target_category_slug: newBanner.target_category_slug || null,
      };

      if (editingBannerId) {
        const { error } = await supabase.from("banners").update(payload).eq("id", editingBannerId);
        if (error) throw error;
        alert("تم تحديث العرض بنجاح! ✏️");
      } else {
        const { error } = await supabase.from("banners").insert([payload]);
        if (error) throw error;
        alert("تم نشر العرض بنجاح! 🎊");
      }

      setEditingBannerId(null);
      setNewBanner({
        title_ar: "",
        title_en: "",
        subtitle_ar: "",
        subtitle_en: "",
        tag_ar: "عرض حصري",
        image_url: "",
        target_category_slug: "",
      });
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ أثناء الحفظ";
      alert("تعذر حفظ البانر: " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا العرض؟")) {
      try {
        const { error } = await supabase.from("banners").delete().eq("id", id);
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
      <form onSubmit={handleSaveBanner} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#4A0E17] flex items-center gap-2">
            {editingBannerId ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4" />}
            <span>{editingBannerId ? "تعديل بيانات العرض الترويجي" : "إضافة بانر / عرض ترويجي جديد"}</span>
          </h3>
          {editingBannerId && (
            <button
              type="button"
              onClick={() => {
                setEditingBannerId(null);
                setNewBanner({
                  title_ar: "",
                  title_en: "",
                  subtitle_ar: "",
                  subtitle_en: "",
                  tag_ar: "عرض حصري",
                  image_url: "",
                  target_category_slug: "",
                });
              }}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
            >
              إلغاء التعديل ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold mb-1">العنوان بالعربي (اختياري):</label>
            <textarea
              rows={2}
              placeholder={"سارما ملكية\nفستق عنتاب خالص"}
              value={newBanner.title_ar}
              onChange={(e) => handleBannerTitleArChange(e.target.value)}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs font-bold resize-none"
            />
          </div>

          <div>
            <label className="flex items-center justify-between font-bold mb-1">
              <span>العنوان بالإنجليزي (ترجمة فورية):</span>
              <Wand2 className="w-3 h-3 text-[#C59B27]" />
            </label>
            <textarea
              rows={2}
              placeholder={"ROYAL SARMA.\nPURE ANTEP PISTACHIO."}
              value={newBanner.title_en}
              onChange={(e) => setNewBanner({ ...newBanner, title_en: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs font-bold uppercase resize-none"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">الوصف المختصر (عربي):</label>
            <input
              type="text"
              placeholder="رولات خضراء فاخرة بأكثر من 85% فستق نقي"
              value={newBanner.subtitle_ar}
              onChange={(e) => handleBannerSubtitleArChange(e.target.value)}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs"
            />
          </div>

          <div>
            <label className="flex items-center justify-between font-bold mb-1">
              <span>الوصف المختصر بالإنجليزي:</span>
              <Wand2 className="w-3 h-3 text-[#C59B27]" />
            </label>
            <input
              type="text"
              placeholder="Royal green rolls with over 85% pure Antep pistachios."
              value={newBanner.subtitle_en}
              onChange={(e) => setNewBanner({ ...newBanner, subtitle_en: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-bold mb-1 text-xs text-stone-700">
              🔗 توجيه العميل عند النقر على هذا الإعلان (اختياري):
            </label>
            <select
              value={newBanner.target_category_slug || ""}
              onChange={(e) => setNewBanner({ ...newBanner, target_category_slug: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold text-xs cursor-pointer focus:outline-hidden focus:border-[#4A0E17]"
            >
              <option value="">بدون توجيه (عرض الصفحة الرئيسية فقط)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  الانتقال فوراً لقسم: {cat.name_ar} ({cat.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="block font-bold mb-1">صورة العرض *:</label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#4A0E17] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#36070E] shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingImage ? "جاري الرفع..." : "رفع من الجهاز"}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingImage}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                placeholder="رابط الصورة أو مسار الملف..."
                value={newBanner.image_url}
                onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })}
                className="flex-1 bg-[#FAF5ED] border border-stone-200 rounded-xl p-2 text-xs font-medium"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || uploadingImage}
          className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow cursor-pointer flex items-center gap-2 ${
            editingBannerId ? "bg-amber-700 hover:bg-amber-800" : "bg-[#4A0E17] hover:bg-[#36070E]"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : editingBannerId ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>{editingBannerId ? "حفظ تعديلات العرض" : "نشر العرض"}</span>
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b) => (
          <div key={b.id} className="relative rounded-3xl overflow-hidden shadow-md h-40 border border-stone-200 bg-[#380E14] text-white p-4 flex items-center justify-between">
            <div className="max-w-[60%] space-y-1">
              <h4 className="font-bold text-xs leading-tight line-clamp-2">{b.title_ar || b.title_en}</h4>
              <p className="text-[10px] text-stone-300 line-clamp-2">{b.subtitle_ar || b.subtitle_en}</p>
            </div>
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/10 shrink-0">
              <Image src={b.image_url} alt="" fill sizes="96px" className="object-cover" />
            </div>
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditingBannerId(b.id);
                  setNewBanner({
                    title_ar: b.title_ar || "",
                    title_en: b.title_en || "",
                    subtitle_ar: b.subtitle_ar || "",
                    subtitle_en: b.subtitle_en || "",
                    tag_ar: b.tag_ar || "عرض حصري",
                    image_url: b.image_url || "",
                    target_category_slug: b.target_category_slug || "",
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title="تعديل"
                className="bg-black/60 hover:bg-amber-600 text-white p-1.5 rounded-lg transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBanner(b.id)}
                title="حذف"
                className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};