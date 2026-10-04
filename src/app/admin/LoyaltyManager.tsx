"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit3, Coins, Sparkles, Medal, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";
import { translateToGourmetEnglish } from "@/lib/gourmetTranslator";

export interface LoyaltyRewardItem {
  id: string;
  title_ar: string;
  title_en: string;
  discount_percent: number;
  points_required: number;
}

interface LoyaltyManagerProps {
  loyaltyRewards: LoyaltyRewardItem[];
  pointsPerSar: number;
  setPointsPerSar: React.Dispatch<React.SetStateAction<number>>;
  fetchData: () => Promise<void>;
}

export const LoyaltyManager: React.FC<LoyaltyManagerProps> = ({
  loyaltyRewards,
  pointsPerSar,
  setPointsPerSar,
  fetchData,
}) => {
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [newLoyaltyReward, setNewLoyaltyReward] = useState({
    title_ar: "",
    title_en: "",
    discount_percent: "",
    points_required: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSavePointsRate = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("store_settings").upsert({
        id: "loyalty",
        points_per_sar: Number(pointsPerSar),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      alert("تم تحديث معدل احتساب النقاط بنجاح! 🪙");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ أثناء الحفظ";
      alert("تعذر حفظ الإعدادات: " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveLoyaltyReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoyaltyReward.title_ar || !newLoyaltyReward.discount_percent || !newLoyaltyReward.points_required) {
      return alert("يرجى إكمال بيانات المكافأة");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title_ar: newLoyaltyReward.title_ar.trim(),
        title_en: newLoyaltyReward.title_en.trim() || translateToGourmetEnglish(newLoyaltyReward.title_ar),
        discount_percent: parseInt(newLoyaltyReward.discount_percent),
        points_required: parseInt(newLoyaltyReward.points_required),
      };

      if (editingRewardId) {
        const { error } = await supabase.from("loyalty_rewards").update(payload).eq("id", editingRewardId);
        if (error) throw error;
        alert("تم تحديث المكافأة بنجاح! ✏️");
      } else {
        const { error } = await supabase.from("loyalty_rewards").insert([payload]);
        if (error) throw error;
        alert("تمت إضافة المكافأة بنجاح! 👑");
      }

      setEditingRewardId(null);
      setNewLoyaltyReward({ title_ar: "", title_en: "", discount_percent: "", points_required: "" });
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ أثناء الحفظ";
      alert("تعذر حفظ المكافأة: " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذه المكافأة نهائياً؟")) {
      try {
        const { error } = await supabase.from("loyalty_rewards").delete().eq("id", id);
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
      {/* بطاقة معدل احتساب النقاط */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17] border border-[#C59B27]/30 shadow-2xs shrink-0">
            <Coins className="w-6 h-6 text-[#C59B27]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#4A0E17]">معدل احتساب نقاط المشتريات التلقائي</h3>
              <Sparkles className="w-4 h-4 text-[#C59B27]" />
            </div>
            <p className="text-[11px] text-stone-500 mt-0.5">
              حدد عدد النقاط التي يكتسبها العميل تلقائياً عند إنفاق كل 1 ريال سعودي:
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 max-w-md pt-2">
          <div className="w-full sm:flex-1 relative">
            <input
              type="number"
              min="1"
              value={pointsPerSar}
              onChange={(e) => setPointsPerSar(Number(e.target.value))}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-2xl px-4 py-3 text-xs font-black text-[#4A0E17] focus:outline-hidden focus:border-[#4A0E17] shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 pointer-events-none">
              نقطة / 1 ر.س
            </span>
          </div>
          
          <button
            type="button"
            onClick={handleSavePointsRate}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-3 bg-[#4A0E17] hover:bg-[#36070E] text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer shrink-0"
          >
            {isSubmitting ? "جاري الحفظ..." : "حفظ المعدل 🪙"}
          </button>
        </div>
      </div>

      {/* استمارة إضافة وتعديل مكافأة النقاط */}
      <form onSubmit={handleSaveLoyaltyReward} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#4A0E17] flex items-center gap-2">
            {editingRewardId ? <Edit3 className="w-4 h-4 text-amber-600" /> : <Plus className="w-4 h-4" />}
            <span>{editingRewardId ? "تعديل مكافأة النقاط" : "إضافة مكافأة استبدال نقاط جديدة"}</span>
          </h3>
          {editingRewardId && (
            <button
              type="button"
              onClick={() => {
                setEditingRewardId(null);
                setNewLoyaltyReward({ title_ar: "", title_en: "", discount_percent: "", points_required: "" });
              }}
              className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
            >
              إلغاء التعديل ✕
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold mb-1">اسم المكافأة بالعربي *:</label>
            <input
              type="text"
              required
              placeholder="مثال: خصم 15% للملوك"
              value={newLoyaltyReward.title_ar}
              onChange={(e) => {
                setNewLoyaltyReward({
                  ...newLoyaltyReward,
                  title_ar: e.target.value,
                  title_en: translateToGourmetEnglish(e.target.value),
                });
              }}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">الاسم بالإنجليزي (ترجمة فورية):</label>
            <input
              type="text"
              placeholder="15% Royal Discount"
              value={newLoyaltyReward.title_en}
              onChange={(e) => setNewLoyaltyReward({ ...newLoyaltyReward, title_en: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-medium"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">نسبة الخصم الممنوحة (%) *:</label>
            <input
              type="number"
              required
              placeholder="15"
              value={newLoyaltyReward.discount_percent}
              onChange={(e) => setNewLoyaltyReward({ ...newLoyaltyReward, discount_percent: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">عدد النقاط المطلوبة للاستبدال *:</label>
            <input
              type="number"
              required
              placeholder="150"
              value={newLoyaltyReward.points_required}
              onChange={(e) => setNewLoyaltyReward({ ...newLoyaltyReward, points_required: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow cursor-pointer flex items-center gap-2 ${
            editingRewardId ? "bg-amber-700 hover:bg-amber-800" : "bg-[#4A0E17] hover:bg-[#36070E]"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : editingRewardId ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>{editingRewardId ? "حفظ تعديلات المكافأة" : "حفظ المكافأة"}</span>
        </button>
      </form>

      {/* قائمة بطاقات المكافآت */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {loyaltyRewards.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                <Medal className="w-5 h-5 text-[#C59B27]" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[#4A0E17]">{r.title_ar}</h4>
                <span className="text-[10px] text-stone-400 block">{r.title_en}</span>
                <span className="text-[10px] text-emerald-700 font-bold block">خصم {r.discount_percent}%</span>
                <span className="text-[10px] text-stone-500 font-bold">مطلوب: {r.points_required} نقطة</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditingRewardId(r.id);
                  setNewLoyaltyReward({
                    title_ar: r.title_ar,
                    title_en: r.title_en,
                    discount_percent: String(r.discount_percent),
                    points_required: String(r.points_required),
                  });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                title="تعديل"
                className="text-stone-400 hover:text-amber-600 p-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDeleteReward(r.id)}
                title="حذف"
                className="text-stone-400 hover:text-rose-600 p-2 cursor-pointer"
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