"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Trash2,
  Star,
  MessageSquare,
  ShieldAlert,
  RefreshCw,
  CheckCircle,
  Edit3,
  X,
  Save,
  Phone,
  Search,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";

export interface Review {
  id: string;
  customer_name: string;
  customer_phone?: string;
  phone?: string;
  rating: number;
  comment: string;
  created_at?: string;
  is_approved?: boolean;
}

export const ReviewsManager: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // أدوات البحث والفلترة
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | "all">("all");

  // حالات نافذة التعديل
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [savingEdit, setSavingEdit] = useState(false);

  // إظهار رسائل مؤقتة
  const showNotice = (text: string, isError = false) => {
    setFeedbackMessage({ text, isError });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // 1. دالة التحديث اليدوي عند النقر على زر التحديث
  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. الجلب التلقائي النظيف عند تحميل الصفحة دون تحذيرات أو تعليق
  useEffect(() => {
    let isMounted = true;

    const loadInitialReviews = async () => {
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data && isMounted) setReviews(data);
      } catch (err) {
        console.error("Error loading reviews:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق نهائياً؟")) return;

    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showNotice("تم حذف التعليق بنجاح");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "فشل الحذف";
      showNotice("تعذر حذف التعليق: " + errorMsg, true);
    }
  };

  const handleOpenEdit = (rev: Review) => {
    setEditingReview(rev);
    setEditComment(rev.comment || "");
    setEditRating(Number(rev.rating) || 5);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !editComment.trim()) return;

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          comment: editComment.trim(),
          rating: editRating,
        })
        .eq("id", editingReview.id);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.id
            ? { ...r, comment: editComment.trim(), rating: editRating }
            : r
        )
      );

      setEditingReview(null);
      showNotice("تم تحديث التعليق بنجاح");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "فشل التعديل";
      showNotice("تعذر حفظ التعديل: " + errorMsg, true);
    } finally {
      setSavingEdit(false);
    }
  };

  // تصفية التعليقات بحسب البحث والتقييم
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const matchQuery =
        (rev.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rev.customer_phone || rev.phone || "").includes(searchQuery) ||
        (rev.comment || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchRating =
        selectedRatingFilter === "all" || Number(rev.rating) === selectedRatingFilter;

      return matchQuery && matchRating;
    });
  }, [reviews, searchQuery, selectedRatingFilter]);

  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-5 select-none relative">
      
      {/* الترويسة العلوية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-[#C59B27]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-stone-900">إدارة تعليقات وتقييمات العملاء </h3>
            <p className="text-[10px] text-stone-400 mt-0.5">متابعة ومراجعة آراء الذواقين والتحكم بها</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            type="button"
            onClick={fetchReviews}
            className="p-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="text-xs bg-[#FAF5ED] text-[#4A0E17] font-black px-3.5 py-1.5 rounded-2xl border border-stone-200/80 font-mono">
            العدد: {filteredReviews.length} من {reviews.length}
          </span>
        </div>
      </div>

      {/* شريط الإشعارات اللحظية */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 ${
            feedbackMessage.isError
              ? "bg-rose-50 border border-rose-200 text-rose-800"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800"
          }`}
        >
          {feedbackMessage.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* أدوات البحث والتصفية */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم العميل، رقم الهاتف، أو نص الرأي..."
            className="w-full bg-[#FAF5ED] border border-stone-200 rounded-2xl pr-9 pl-3 py-2 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-[#4A0E17]"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#FAF5ED] p-1 rounded-2xl border border-stone-200 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedRatingFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer ${
              selectedRatingFilter === "all"
                ? "bg-[#4A0E17] text-[#E5C058] shadow-xs"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            الكل
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => setSelectedRatingFilter(stars)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
                selectedRatingFilter === stars
                  ? "bg-[#4A0E17] text-[#E5C058] shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>{stars}</span>
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            </button>
          ))}
        </div>
      </div>

      {/* قائمة التعليقات */}
      {loading ? (
        <div className="py-12 text-center text-xs text-stone-400 flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#4A0E17]" />
          <span>جاري تحميل التعليقات...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-16 text-center text-stone-400 text-xs space-y-2 bg-[#FAF5ED]/30 rounded-2xl border border-dashed border-stone-200">
          <ShieldAlert className="w-8 h-8 mx-auto text-stone-300 stroke-[1.5]" />
          <p className="font-bold text-stone-700">لا توجد نتائج مطابقة لبحثك.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 rounded-2xl border border-stone-200/90 bg-[#FAF5ED]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs transition hover:bg-[#FAF5ED]/80"
            >
              {/* التفاصيل */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="w-7 h-7 rounded-full bg-[#4A0E17] text-[#E5C058] flex items-center justify-center font-black text-xs">
                    {(rev.customer_name || "ع")[0]}
                  </div>
                  <span className="text-xs font-black text-stone-900">{rev.customer_name}</span>

                  <span className="inline-flex items-center gap-1 text-[10px] bg-white text-stone-700 font-bold px-2.5 py-0.5 rounded-lg border border-stone-200 font-mono shadow-2xs">
                    <Phone className="w-3 h-3 text-[#C59B27]" />
                    <span>{rev.customer_phone || rev.phone || "رقم غير متوفر"}</span>
                  </span>

                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                    <span>مشتري مؤكد</span>
                  </span>

                  <div className="flex items-center gap-0.5 mr-auto sm:mr-0">
                    {Array.from({ length: Number(rev.rating) || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed bg-white p-3 rounded-xl border border-stone-200/70 font-medium">
                  {rev.comment}
                </p>

                <span className="text-[10px] text-stone-400 block font-mono">
                  {rev.created_at ? new Date(rev.created_at).toLocaleString("ar-SA") : ""}
                </span>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(rev)}
                  className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-[#4A0E17] hover:border-[#4A0E17] active:scale-95 transition cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                  title="تعديل التعليق"
                >
                  <Edit3 className="w-4 h-4 text-[#C59B27]" />
                  <span className="sm:hidden">تعديل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteReview(rev.id)}
                  className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 active:scale-95 transition cursor-pointer shadow-2xs flex items-center gap-1.5 text-xs font-bold"
                  title="حذف التعليق"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="sm:hidden">حذف</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* نافذة Modal لتعديل التعليق */}
      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF5ED] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#4A0E17]/20 space-y-4 relative text-[#2D2321] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#4A0E17]" />
                <h4 className="text-sm font-black text-[#4A0E17]">
                  تعديل تعليق: {editingReview.customer_name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingReview(null)}
                className="w-8 h-8 rounded-full bg-stone-200/80 hover:bg-stone-300 text-stone-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">تقييم النجوم:</label>
                <div className="flex gap-1.5 bg-white p-3 rounded-2xl border border-stone-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="cursor-pointer hover:scale-110 transition"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= editRating ? "text-amber-400 fill-amber-400" : "text-stone-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">نص التعليق:</label>
                <textarea
                  rows={4}
                  required
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-2xl p-3 text-xs focus:outline-hidden focus:border-[#4A0E17] font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-700 text-xs font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#4A0E17] hover:bg-[#36070E] text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {savingEdit ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>حفظ التعديلات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};