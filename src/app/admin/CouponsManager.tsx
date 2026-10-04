"use client";

import React, { useState } from "react";
import { 
  Plus, Trash2, Edit3, ShieldCheck, DollarSign, Users, 
  Calendar, CheckCircle2, Clock, Check, Loader2 
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";

export interface CouponItem {
  id: string;
  code: string;
  discount_percent: number;
  one_per_customer?: boolean | null;
  max_uses?: number | null;
  used_count?: number | null;
  min_order_amount?: number | null;
  expires_at?: string | null;
  is_active?: boolean | null;
}

interface CouponsManagerProps {
  coupons: CouponItem[];
  fetchData: () => Promise<void>;
}

export const CouponsManager: React.FC<CouponsManagerProps> = ({
  coupons,
  fetchData,
}) => {
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_percent: "",
    one_per_customer: false,
    max_uses: "",
    min_order_amount: "",
    expires_at: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount_percent) {
      return alert("يرجى إدخال رمز الكوبون ونسبة الخصم");
    }

    setIsSubmitting(true);
    try {
      const payload = {
        code: newCoupon.code.toUpperCase().trim(),
        discount_percent: parseInt(newCoupon.discount_percent),
        one_per_customer: Boolean(newCoupon.one_per_customer),
        max_uses: newCoupon.max_uses ? parseInt(newCoupon.max_uses) : null,
        min_order_amount: newCoupon.min_order_amount ? parseFloat(newCoupon.min_order_amount) : null,
        expires_at: newCoupon.expires_at ? new Date(newCoupon.expires_at).toISOString() : null,
        is_active: true,
      };

      if (editingCouponId) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", editingCouponId);
        if (error) throw error;
        alert("تم تحديث شروط الكوبون بنجاح! ✏️");
      } else {
        const { error } = await supabase.from("coupons").insert([payload]);
        if (error) throw error;
        alert("تم تفعيل الكوبون المتقدم بنجاح! 🏷️");
      }

      setEditingCouponId(null);
      setNewCoupon({
        code: "",
        discount_percent: "",
        one_per_customer: false,
        max_uses: "",
        min_order_amount: "",
        expires_at: "",
      });
      await fetchData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ أثناء الحفظ";
      alert("تعذر حفظ الكوبون: " + message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditCoupon = (c: CouponItem) => {
    setEditingCouponId(c.id);
    setNewCoupon({
      code: c.code || "",
      discount_percent: String(c.discount_percent ?? ""),
      one_per_customer: Boolean(c.one_per_customer),
      max_uses: c.max_uses ? String(c.max_uses) : "",
      min_order_amount: c.min_order_amount ? String(c.min_order_amount) : "",
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 16) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الكوبون نهائياً؟")) {
      try {
        const { error } = await supabase.from("coupons").delete().eq("id", id);
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
      {/* استمارة إضافة وتعديل الكوبونات */}
      <form onSubmit={handleSaveCoupon} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17]">
              <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#4A0E17]">
                {editingCouponId ? "تعديل بيانات وشروط الكوبون" : "إنشاء كود خصم ذكي ومحمي"}
              </h3>
              <p className="text-[10px] text-stone-400">حدد رمز الكوبون ونسبة الخصم مع شروط الاستخدام المتقدمة</p>
            </div>
          </div>

          {editingCouponId && (
            <button
              type="button"
              onClick={() => {
                setEditingCouponId(null);
                setNewCoupon({
                  code: "",
                  discount_percent: "",
                  one_per_customer: false,
                  max_uses: "",
                  min_order_amount: "",
                  expires_at: "",
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
            <label className="block font-bold mb-1">رمز الكوبون (الكود) *:</label>
            <input
              type="text"
              required
              placeholder="SARAH15 أو ROYAL20"
              value={newCoupon.code}
              onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 uppercase font-mono font-bold"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">نسبة الخصم (%) *:</label>
            <input
              type="number"
              required
              min="1"
              max="100"
              placeholder="15"
              value={newCoupon.discount_percent}
              onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: e.target.value })}
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl p-2.5 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        <div className="bg-[#FAF5ED] p-4 rounded-2xl border border-stone-200/80 space-y-4">
          <span className="flex items-center gap-1.5 text-xs font-black text-[#4A0E17]">
            <ShieldCheck className="w-4 h-4 text-[#C59B27]" />
            <span>شروط الاستخدام والقيود الأمنية (اختياري):</span>
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="flex items-center gap-1 font-bold mb-1 text-stone-700">
                <DollarSign className="w-3.5 h-3.5 text-[#4A0E17]" />
                <span>الحد الأدنى لقيمة السلة (ر.س):</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="مثال: 100"
                value={newCoupon.min_order_amount}
                onChange={(e) => setNewCoupon({ ...newCoupon, min_order_amount: e.target.value })}
                className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#4A0E17] shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 font-bold mb-1 text-stone-700">
                <Users className="w-3.5 h-3.5 text-[#4A0E17]" />
                <span>العدد الإجمالي المسموح به:</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="مثال: 50"
                value={newCoupon.max_uses}
                onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: e.target.value })}
                className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#4A0E17] shadow-2xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 font-bold mb-1 text-stone-700">
                <Calendar className="w-3.5 h-3.5 text-[#C59B27]" />
                <span>تاريخ انتهاء الكوبون:</span>
              </label>
              <input
                type="date"
                value={newCoupon.expires_at ? newCoupon.expires_at.slice(0, 10) : ""}
                onChange={(e) => {
                  const fullDateTime = e.target.value ? `${e.target.value}T23:59` : "";
                  setNewCoupon({ ...newCoupon, expires_at: fullDateTime });
                }}
                className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#4A0E17] shadow-2xs cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-200/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-stone-800 block">تقييد الاستخدام لمرة واحدة فقط لكل رقم جوال</span>
                <span className="text-[10px] text-stone-500">يفحص سجل الطلبات برقم العميل لمنع استغلال الخصم أكثر من مرة.</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={newCoupon.one_per_customer || false}
              onChange={(e) => setNewCoupon({ ...newCoupon, one_per_customer: e.target.checked })}
              className="w-5 h-5 accent-[#4A0E17] rounded-md cursor-pointer"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-6 py-2.5 text-white rounded-xl text-xs font-bold shadow cursor-pointer flex items-center gap-2 ${
            editingCouponId ? "bg-amber-700 hover:bg-amber-800" : "bg-[#4A0E17] hover:bg-[#36070E]"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : editingCouponId ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          <span>{editingCouponId ? "حفظ تعديلات الكوبون" : "تفعيل الكوبون المتقدم"}</span>
        </button>
      </form>

      {/* قائمة الكوبونات المعروضة */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {coupons.map((c) => {
          const isExpired = Boolean(c.expires_at && new Date(c.expires_at) < new Date());
          const isLimitReached = Boolean(c.max_uses && (c.used_count || 0) >= c.max_uses);

          return (
            <div
              key={c.id}
              className={`bg-white p-4 rounded-2xl border shadow-2xs space-y-2 relative transition ${
                isExpired || isLimitReached ? "border-rose-200 bg-rose-50/30 opacity-80" : "border-stone-200"
              }`}
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-[#4A0E17] bg-[#FAF5ED] px-2.5 py-0.5 rounded-lg border border-stone-200">
                    {c.code}
                  </span>
                  <span className="text-xs font-black text-emerald-700">
                    خصم {c.discount_percent}%
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEditCoupon(c)}
                    title="تعديل"
                    className="text-stone-400 hover:text-amber-600 p-1 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCoupon(c.id)}
                    title="حذف"
                    className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-stone-600">
                {c.one_per_customer && (
                  <div className="flex items-center gap-1 text-emerald-800 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>مرة واحدة لكل رقم جوال</span>
                  </div>
                )}
                {c.min_order_amount && (
                  <div className="flex items-center gap-1 text-stone-500">
                    <DollarSign className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>الحد الأدنى: <strong>{c.min_order_amount} ر.س</strong></span>
                  </div>
                )}
                {c.max_uses && (
                  <div className="flex items-center gap-1 text-stone-500">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>الاستخدام: <strong>{c.used_count || 0} / {c.max_uses}</strong></span>
                  </div>
                )}
                {c.expires_at && (
                  <div className={`flex items-center gap-1 ${isExpired ? "text-rose-600 font-bold" : "text-stone-500"}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isExpired ? "انتهى في:" : "ينتهي في:"} {new Date(c.expires_at).toLocaleDateString("ar-SA")}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};