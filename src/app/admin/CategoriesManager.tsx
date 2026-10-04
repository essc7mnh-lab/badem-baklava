"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit3, Upload, Loader2, Check, Wand2 } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { translateToGourmetEnglish, generateCleanSlug } from "@/lib/gourmetTranslator";

export interface CategoryItem {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  image_url: string;
  sort_order?: number;
}

interface CategoriesManagerProps {
  categories: CategoryItem[];
  fetchData: () => Promise<void>;
}

export const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  fetchData,
}) => {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [newCat, setNewCat] = useState({
    slug: "",
    name_ar: "",
    name_en: "",
    image_url: "",
    sort_order: 0,
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCategoryNameArChange = (value: string) => {
    const translated = translateToGourmetEnglish(value);
    setNewCat((prev) => ({
      ...prev,
      name_ar: value,
      name_en: translated,
      slug: generateCleanSlug(translated),
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
      formData.append("target", "category");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "فشل رفع الصورة");

      setNewCat((prev) => ({ ...prev, image_url: data.url }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ غير متوقع";
      alert("خطأ أثناء رفع الصورة: " + message);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name_ar || !newCat.image_url) return alert("يرجى إدخال اسم القسم وصورته");

    setIsSubmitting(true);
    try {
      const payload = {
        slug: newCat.slug.trim() || generateCleanSlug(newCat.name_en || newCat.name_ar),
        name_ar: newCat.name_ar.trim(),
        name_en: newCat.name_en.trim() || newCat.name_ar.trim(),
        image_url: newCat.image_url.trim(),
        sort_order: Number(newCat.sort_order) || categories.length + 1,
      };

      if (editingCatId) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editingCatId);
        if (error) throw error;
        alert("تم تحديث بيانات القسم بنجاح! ✏️");
      } else {
        const { error } = await supabase.from("categories").insert([payload]);
        if (error) throw error;
        alert("تمت إضافة القسم بنجاح! 🎉");
      }

      setEditingCatId(null);
      setNewCat({ slug: "", name_ar: "", name_en: "", image_url: "", sort_order: 0 });
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ أثناء الحفظ";
      alert("تعذر حفظ القسم: " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("هل أنت متأكد من الحذف النهائي لهذا القسم؟")) {
      try {
        const { error } = await supabase.from("categories").delete().eq("id", id);
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
      {/* استمارة إضافة / تعديل قسم */}
      <form onSubmit={handleSaveCategory} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#4A0E17] flex items-center gap-2">
            {editingCatId ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4" />}
            <span>{editingCatId ? "تعديل بيانات القسم الحالي" : "إضافة قسم جديد للمتجر"}</span>
          </h3>
          {editingCatId && (
            <button
              type="button"
              onClick={() => {
                setEditingCatId(null);
                setNewCat({ slug: "", name_ar: "", name_en: "", image_url: "", sort_order: 0 });
              }}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
            >
              إلغاء التعديل ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold mb-1">اسم القسم بالعربي *:</label>
            <input
              type="text"
              required
              placeholder="مثال: بقلاوة عنتابية"
              value={newCat.name_ar}
              onChange={(e) => handleCategoryNameArChange(e.target.value)}
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
              placeholder="Antep Signature Baklava"
              value={newCat.name_en}
              onChange={(e) => setNewCat({ ...newCat, name_en: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">معرّف الرابط (Slug تلقائي):</label>
            <input
              type="text"
              placeholder="antep-signature-baklava"
              value={newCat.slug}
              onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-medium"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="block font-bold mb-1">صورة القسم مفرغة PNG *:</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 bg-[#4A0E17] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#36070E] transition shrink-0">
                <Upload className="w-4 h-4" />
                <span>{uploadingImage ? "جاري الرفع..." : "اختر صورة مفرغة"}</span>
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
                value={newCat.image_url}
                onChange={(e) => setNewCat({ ...newCat, image_url: e.target.value })}
                className="flex-1 bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 text-xs font-medium"
              />
              {newCat.image_url && (
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border bg-stone-100 shrink-0">
                  <Image src={newCat.image_url} alt="" fill sizes="40px" className="object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || uploadingImage}
          className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer flex items-center gap-2 ${
            editingCatId ? "bg-amber-700 hover:bg-amber-800" : "bg-[#4A0E17] hover:bg-[#36070E]"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : editingCatId ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>{editingCatId ? "حفظ التعديلات" : "حفظ القسم"}</span>
        </button>
      </form>

      {/* قائمة شبكة الأقسام */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white p-4 rounded-3xl border border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 shrink-0">
              <Image src={cat.image_url} alt={cat.name_ar} fill sizes="48px" className="object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs truncate">{cat.name_ar}</h4>
              <span className="text-[10px] text-stone-400 block truncate">{cat.name_en}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditingCatId(cat.id);
                  setNewCat({
                    slug: cat.slug,
                    name_ar: cat.name_ar,
                    name_en: cat.name_en,
                    image_url: cat.image_url,
                    sort_order: cat.sort_order || 0,
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title="تعديل"
                className="p-1.5 text-stone-400 hover:text-amber-600 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id)}
                title="حذف"
                className="p-1.5 text-stone-400 hover:text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};