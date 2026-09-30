import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ تنبيه أمني: مفاتيح Supabase غير موجودة في ملف .env.local أو لم يتم إعادة تشغيل السيرفر.");
}

export const supabase = createClient(
  supabaseUrl || "",
  supabaseAnonKey || ""
);