"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  AlertCircle,
  Eye,
  EyeOff,
  MessageCircle
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
  const [approvalFilter, setApprovalFilter] = useState<"all" | "approved" | "pending">("all");

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

  // 1. دالة موحدة لجلب وتحديث التعليقات
  const fetchReviews = useCallback(async () => {
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
      showNotice("تعذر تحميل التعليقات من قاعدة البيانات", true);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. الجلب التلقائي عند التحميل

  useEffect(() => {
    const load = async () => {
      await fetchReviews();
    };
    load();
  }, [fetchReviews]);
  // إغلاق نافذة التعديل بزر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditingReview(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 🛡️ تبديل حالة اعتماد التقييم ونشره في المتجر فورياً
  const handleToggleApproval = async (review: Review) => {
    const newStatus = !(review.is_approved ?? true);

    // تحديث تفاؤلي فوري في الواجهة
    setReviews((prev) =>
      prev.map((r) => (r.id === review.id ? { ...r, is_approved: newStatus } : r))
    );

    try {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: newStatus })
        .eq("id", review.id);

      if (error) throw error;
      showNotice(newStatus ? "تم اعتماد التقييم وظهوره في المتجر 🟢" : "تم إخفاء التقييم من المتجر 🔴");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "فشل التحديث";
      showNotice("تعذر تحديث حالة التقييم: " + errorMsg, true);
      void fetchReviews();
    }
  };

  // حذف التقييم
  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا التعليق نهائياً؟")) return;

    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      setReviews((prev) => prev.filter((r) => r.id !== id));
      showNotice("تم حذف التعليق بنجاح ✅");
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

  // حفظ التعديلات
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
      showNotice("تم تحديث التعليق بنجاح ✅");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "فشل التعديل";
      showNotice("تعذر حفظ التعديل: " + errorMsg, true);
    } finally {
      setSavingEdit(false);
    }
  };

  // 💬 مراسلة العميل بالواتساب للاستفسار أو حل أي شكوى
  const handleOpenWhatsApp = (rev: Review) => {
    const rawPhone = rev.customer_phone || rev.phone;
    if (!rawPhone) return;

    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("05")
      ? `966${cleanPhone.slice(1)}`
      : cleanPhone.startsWith("5")
      ? `966${cleanPhone}`
      : cleanPhone;

    const message = `مرحباً أستاذ ${rev.customer_name || ""}، نشكرك لتقييمك متجر بادَم للبقلاوة الفاخرة ✨ نسعد دائماً برأيك ونتطلع لخدمتك بأعلى معايير الضيافة الملكية.`;
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // حساب متوسط التقييم الإجمالي
  const averageRating = useMemo(() => {
    if (reviews.length === 0) return "5.0";
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // تصفية التعليقات بحسب البحث والتقييم وحالة الاعتماد
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        (rev.customer_name || "").toLowerCase().includes(query) ||
        (rev.customer_phone || rev.phone || "").includes(query) ||
        (rev.comment || "").toLowerCase().includes(query);

      const matchRating =
        selectedRatingFilter === "all" || Number(rev.rating) === selectedRatingFilter;

      const isApproved = rev.is_approved ?? true;
      const matchApproval =
        approvalFilter === "all" ||
        (approvalFilter === "approved" && isApproved) ||
        (approvalFilter === "pending" && !isApproved);

      return matchQuery && matchRating && matchApproval;
    });
  }, [reviews, searchQuery, selectedRatingFilter, approvalFilter]);

  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-5 select-none relative">
      
      {/* الترويسة العلوية مع معدل التقييم الإجمالي */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#C59B27]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-stone-900">إدارة تقييمات وآراء العملاء</h3>
              <span className="text-[10px] bg-amber-50 text-amber-900 font-black px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 font-mono">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{averageRating} / 5</span>
              </span>
            </div>
            <p className="text-[10.5px] text-stone-400 mt-0.5">مراجعة آراء الذواقين واعتماد النشر أو الإخفاء</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            type="button"
            onClick={fetchReviews}
            disabled={loading}
            className="p-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-stone-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
          <span className="text-xs bg-[#FAF5ED] text-[#4A0E17] font-black px-3.5 py-1.5 rounded-2xl border border-stone-200/80 font-mono">
            {filteredReviews.length} من {reviews.length} تقييم
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

      {/* أدوات البحث والتصفية المزدوجة */}
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

        {/* فلترة حالة الاعتماد */}
        <div className="flex items-center gap-1 bg-[#FAF5ED] p-1 rounded-2xl border border-stone-200 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setApprovalFilter("all")}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              approvalFilter === "all" ? "bg-[#4A0E17] text-white shadow-xs" : "text-stone-600"
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter("approved")}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              approvalFilter === "approved" ? "bg-emerald-700 text-white shadow-xs" : "text-stone-600"
            }`}
          >
            المنشورة 🟢
          </button>
          <button
            type="button"
            onClick={() => setApprovalFilter("pending")}
            className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              approvalFilter === "pending" ? "bg-amber-700 text-white shadow-xs" : "text-stone-600"
            }`}
          >
            المخفية 🔴
          </button>
        </div>

        {/* فلترة عدد النجوم */}
        <div className="flex items-center gap-1 bg-[#FAF5ED] p-1 rounded-2xl border border-stone-200 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedRatingFilter("all")}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer ${
              selectedRatingFilter === "all" ? "bg-[#4A0E17] text-[#E5C058] shadow-xs" : "text-stone-600"
            }`}
          >
            الكل
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => setSelectedRatingFilter(stars)}
              className={`px-2 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center gap-0.5 ${
                selectedRatingFilter === stars ? "bg-[#4A0E17] text-[#E5C058] shadow-xs" : "text-stone-600"
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
          {filteredReviews.map((rev) => {
            const isApproved = rev.is_approved ?? true;
            const hasPhone = Boolean(rev.customer_phone || rev.phone);

            return (
              <div
                key={rev.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs transition ${
                  isApproved 
                    ? "border-stone-200/90 bg-[#FAF5ED]/40 hover:bg-[#FAF5ED]/80" 
                    : "border-amber-300 bg-amber-50/30 hover:bg-amber-50/50"
                }`}
              >
                {/* التفاصيل */}
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="w-7 h-7 rounded-full bg-[#4A0E17] text-[#E5C058] flex items-center justify-center font-black text-xs">
                      {(rev.customer_name || "ع")[0]}
                    </div>
                    <span className="text-xs font-black text-stone-900">{rev.customer_name}</span>

                    {hasPhone && (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-white text-stone-700 font-bold px-2.5 py-0.5 rounded-lg border border-stone-200 font-mono shadow-2xs">
                        <Phone className="w-3 h-3 text-[#C59B27]" />
                        <span>{rev.customer_phone || rev.phone}</span>
                      </span>
                    )}

                    {/* حالة النشر في المتجر */}
                    <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                      isApproved 
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                        : "bg-amber-100 text-amber-900 border-amber-300"
                    }`}>
                      {isApproved ? "ظاهر في المتجر 🟢" : "مخفي مؤقتاً 🔴"}
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

                {/* أزرار الإجراءات السريعة */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  
                  {/* زر التبديل بين النشر والإخفاء */}
                  <button
                    type="button"
                    onClick={() => handleToggleApproval(rev)}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1 text-xs font-bold ${
                      isApproved
                        ? "bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                    }`}
                    title={isApproved ? "إخفاء التقييم من المتجر" : "اعتماد ونشر التقييم في المتجر"}
                  >
                    {isApproved ? <EyeOff className="w-4 h-4 text-stone-500" /> : <Eye className="w-4 h-4" />}
                    <span className="hidden md:inline">{isApproved ? "إخفاء" : "اعتماد"}</span>
                  </button>

                  {/* زر محادثة الواتساب */}
                  {hasPhone && (
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(rev)}
                      className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 active:scale-95 transition cursor-pointer shadow-2xs"
                      title="مراسلة العميل بالواتساب"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                    </button>
                  )}

                  {/* زر التعديل */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(rev)}
                    className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-[#4A0E17] hover:border-[#4A0E17] active:scale-95 transition cursor-pointer shadow-2xs"
                    title="تعديل التعليق"
                  >
                    <Edit3 className="w-4 h-4 text-[#C59B27]" />
                  </button>

                  {/* زر الحذف */}
                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 active:scale-95 transition cursor-pointer shadow-2xs"
                    title="حذف التعليق"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* نافذة Modal لتعديل التعليق */}
      {editingReview && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setEditingReview(null)}
        >
          <div 
            className="bg-[#FAF5ED] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#4A0E17]/20 space-y-4 relative text-[#2D2321] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
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