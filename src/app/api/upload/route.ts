import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// الحد الأقصى للحجم: 5 ميجابايت
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// أنواع الصور الآمنة المسموح بها فقط
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
// الأقسام المسموح برفع الصور إليها
const ALLOWED_TARGETS = ["product", "banner", "category"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    let target = (formData.get("target") as string) || "product";

    if (!file) {
      return NextResponse.json({ error: "لم يتم اختيار أي ملف" }, { status: 400 });
    }

    // 🔒 1. فحص الحجم لمنع استهلاك الذاكرة
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "حجم الصورة كبير جداً، الحد الأقصى المسموح به هو 5 ميجابايت" },
        { status: 400 }
      );
    }

    // 🔒 2. فحص نوع الملف المسموح حصراً
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "نوع الملف غير مدعوم، يرجى رفع صور بصيغة JPG أو PNG أو WebP فقط" },
        { status: 400 }
      );
    }

    // 🔒 3. حماية مسار المجلد
    if (!ALLOWED_TARGETS.includes(target)) {
      target = "product";
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // تحديد أبعاد وضغط الصورة بحسب الاستخدام
    let maxWidth = 800;
    let maxHeight = 800;
    let quality = 80;

    if (target === "banner") {
      maxWidth = 1200;
      maxHeight = 600;
      quality = 85;
    } else if (target === "category") {
      maxWidth = 400;
      maxHeight = 400;
      quality = 80;
    }

    // ضغط ومعالجة سريعة
    const optimizedBuffer = await sharp(buffer)
      .rotate() // تصحيح اتجاه صور الجوال
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality,
        effort: 3, // توازن مثالي بين سرعة المعالجة وجودة الضغط
        smartSubsample: true,
      })
      .toBuffer();

    const fileName = `${target}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
    const filePath = `${target}/${fileName}`;

    // الرفع لكلاود Supabase مع كاش طويل الأمد
    const { error: uploadError } = await supabase.storage
      .from("store-images")
      .upload(filePath, optimizedBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000, immutable",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("store-images").getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
    console.error("Upload & optimize error:", err);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}