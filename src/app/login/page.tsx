"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, KeyRound, User, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const cleanUser = usernameInput.trim();
      const cleanPass = passwordInput.trim();

      if (!cleanUser || !cleanPass) {
        setLoginError("يرجى إدخال اسم المستخدم وكلمة المرور.");
        setIsLoggingIn(false);
        return;
      }

      // التحقق المباشر من جدول المشرفين في Supabase
      const { data: adminData, error } = await supabase
        .from("admins")
        .select("*")
        .eq("username", cleanUser)
        .maybeSingle();

      if (error) {
        console.error("Supabase Login Error:", error);
        setLoginError("حدث خطأ أثناء الاتصال بقاعدة البيانات.");
        setIsLoggingIn(false);
        return;
      }

      if (!adminData || adminData.pin_code !== cleanPass) {
        setLoginError("❌ اسم المستخدم أو كلمة المرور غير صحيحة.");
        setIsLoggingIn(false);
        return;
      }

      // الدخول بنجاح والانتقال فوراً للوحة الإدارة
      sessionStorage.setItem("badem_admin_auth", "true");
      router.replace("/admin");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "خطأ غير متوقع";
      setLoginError("حدث خطأ أثناء الدخول: " + message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF5ED] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#4A0E17]/20 shadow-2xl text-center space-y-6 animate-in fade-in duration-200">
        
        <div className="w-16 h-16 bg-[#4A0E17] text-[#E5C058] rounded-3xl mx-auto flex items-center justify-center shadow-lg border border-[#C59B27]/40">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] tracking-widest text-[#C59B27] font-black uppercase font-brand">
            BADEM SECURE ACCESS
          </span>
          <h2 className="text-xl font-black text-[#4A0E17] mt-1">تسجيل دخول الإدارة</h2>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4 text-right">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">اسم المستخدم:</label>
            <div className="relative">
              <input
                type="text"
                required
                value={usernameInput}
                autoFocus
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="اسم المستخدم"
                className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
              />
              <User className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">كلمة المرور:</label>
            <div className="relative">
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
              />
              <KeyRound className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-start gap-2 text-rose-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full bg-[#4A0E17] hover:bg-[#36070E] active:scale-95 text-white font-black py-3.5 rounded-2xl text-xs shadow-lg cursor-pointer flex items-center justify-center gap-2 transition"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>تسجيل الدخول</span>}
          </button>
        </form>

      </div>
    </div>
  );
}