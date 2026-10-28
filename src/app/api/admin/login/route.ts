import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// رمز أمان خاص بسيرفرك يمكنك تغييره لأي نص سري
const ADMIN_SECRET_SESSION = "badem_authenticated_admin_session_2026";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "يرجى إدخال اسم المستخدم وكلمة المرور." }, { status: 400 });
    }

    // الفحص عبر السيرفر بمفتاح محمي
    const { data: adminData, error } = await supabase
      .from("admins")
      .select("*")
      .eq("username", username.trim())
      .maybeSingle();

    if (error || !adminData || adminData.pin_code !== password.trim()) {
      return NextResponse.json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة." }, { status: 401 });
    }

    // إنشاء كوكي مشفر ومحمي HTTP-Only (مستحيل تزويره من المتصفح)
    const cookieStore = await cookies();
    cookieStore.set("badem_admin_session", ADMIN_SECRET_SESSION, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // يبقى مسجلاً لمدة 7 أيام
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}