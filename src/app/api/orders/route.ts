import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// الاتصال بـ Supabase باستخدام مفتاح السيرفر
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SAUDI_CITIES = ["الرياض"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      phone,
      city,
      district,
      street,
      notes,
      mapsLink,
      isGift,
      recipientName,
      giftMessage,
      deliveryMode,
      paymentMethod,
      appliedCouponCode,
      cart,
    } = body;

    // 1. التحقق من صحة المدخلات الأساسية
    if (!customerName?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "بيانات العميل غير مكتملة." }, { status: 400 });
    }

    if (deliveryMode === "delivery") {
      if (!city || !SAUDI_CITIES.includes(city.trim())) {
        return NextResponse.json({ error: "التوصيل متاح حالياً داخل مدينة الرياض فقط." }, { status: 400 });
      }
      if (!district?.trim() || !street?.trim()) {
        return NextResponse.json({ error: "يرجى إدخال تفاصيل العنوان والحي بدقة." }, { status: 400 });
      }
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "السلة فارغة." }, { status: 400 });
    }

    // 2. التحقق من أسعار المنتجات والتمييز بين المنتجات الفردية ومنتجات الأوزان
    let verifiedSubtotal = 0;
    const verifiedItems: Array<{
      title: string;
      portion?: string;
      portionNote?: string;
      quantity: number;
      price: number;
      is_custom_box?: boolean;
    }> = [];

    // جلب إعدادات البوكسات
    const { data: boxSettings } = await supabase
      .from("box_builder_settings")
      .select("pricing_mode, packaging_fee")
      .eq("id", "default")
      .maybeSingle();

    const isDynamicBoxPricing = boxSettings?.pricing_mode === "dynamic";
    const boxPackagingFee = Number(boxSettings?.packaging_fee) || 0;

    for (const item of cart) {
      const quantity = Math.max(1, Number(item.quantity) || 1);

      if (item.type === "custom_box" || item.tierId) {
        const { data: tierData } = await supabase
          .from("custom_box_tiers")
          .select("price, capacity, name_ar")
          .eq("id", item.tierId)
          .maybeSingle();

        let officialBoxPrice = Number(tierData?.price) || 0;

        if (isDynamicBoxPricing && Array.isArray(item.items) && item.items.length > 0) {
          const dynamicSum = item.items.reduce(
            (sum: number, it: { unitPrice?: number; quantity?: number }) =>
              sum + Number(it.unitPrice || 0) * Number(it.quantity || 0),
            0
          );
          officialBoxPrice = dynamicSum > 0 ? dynamicSum + boxPackagingFee : officialBoxPrice;
        }

        const boxPortionText = item.portionNote || item.portion || "تشكيلة مخصصة";

        verifiedSubtotal += officialBoxPrice * quantity;
        verifiedItems.push({
          title: item.title || "بوكس مخصص",
          portion: boxPortionText,
          portionNote: boxPortionText,
          quantity,
          price: officialBoxPrice,
          is_custom_box: true,
        });
      } else {
        const { data: dbProduct } = await supabase
          .from("products")
          .select("*")
          .eq("id", item.id)
          .maybeSingle();

        if (!dbProduct) {
          return NextResponse.json(
            { error: `المنتج (${item.title}) غير موجود في قائمة المتجر.` },
            { status: 400 }
          );
        }

        if (dbProduct.is_available === false) {
          return NextResponse.json(
            { error: `عذراً، منتج (${dbProduct.title_ar || item.title}) غير متوفر حالياً بالمخزون.` },
            { status: 400 }
          );
        }

        // ⚖️ فحص: هل المنتج يباع بالأوزان أم بيع فردي بالحبة؟
        const hasWeights = dbProduct.has_weights !== false;
        const dbBase = Number(dbProduct.base_price || dbProduct.price || dbProduct.price_250g || 0);

        let officialPrice = dbBase;
        let finalPortionName: string | undefined = undefined;

        if (hasWeights) {
          // منتج بالأوزان (بقلاوة، معمول، حلا...)
          const rawPortion = String(item.portionNote || item.portion || "");
          const isHalfKilo = /نصف|500|half/i.test(rawPortion);
          const isOneKilo = /(1\s*كجم|1\s*كيلو|كيلو|1000|1\s*kg|kilo)/i.test(rawPortion) && !/ربع|نصف/i.test(rawPortion);

          if (isHalfKilo) {
            officialPrice = Number(dbProduct.price_500g) > 0 ? Number(dbProduct.price_500g) : dbBase * 2;
            finalPortionName = "نصف كيلو (500g)";
          } else if (isOneKilo) {
            officialPrice = Number(dbProduct.price_1kg) > 0 ? Number(dbProduct.price_1kg) : dbBase * 4;
            finalPortionName = "1 كيلو (1000g)";
          } else {
            officialPrice = Number(dbProduct.price_250g) > 0 ? Number(dbProduct.price_250g) : dbBase;
            finalPortionName = item.portionNote || item.portion || "ربع كيلو (250g)";
          }
        } else {
          // ☕ منتج فردي / بالحبة (شاي، قهوة، ماء، علبة مفردة)
          officialPrice = Number(dbProduct.base_price || dbProduct.price || 0);
          finalPortionName = undefined; // لا يوجد وزن نهائياً
        }

        verifiedSubtotal += officialPrice * quantity;
        verifiedItems.push({
          title: dbProduct.title_ar || item.title,
          portion: finalPortionName,
          portionNote: finalPortionName || "",
          quantity,
          price: officialPrice,
        });
      }
    }

    // 3. التحقق الأمني من الكوبون وتطبيقه
    let verifiedDiscount = 0;
    if (appliedCouponCode?.trim()) {
      const code = appliedCouponCode.trim();
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .maybeSingle();

      if (coupon && coupon.is_active !== false) {
        const notExpired = !coupon.expires_at || new Date(coupon.expires_at) >= new Date();
        const underLimit = !coupon.max_uses || (coupon.used_count || 0) < coupon.max_uses;
        const meetsMin = !coupon.min_order_amount || verifiedSubtotal >= Number(coupon.min_order_amount);

        let allowedForUser = true;
        if (coupon.one_per_customer) {
          const { count } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("customer_phone", phone.trim())
            .ilike("notes", `%${code}%`);

          if (count && count > 0) allowedForUser = false;
        }

        if (notExpired && underLimit && meetsMin && allowedForUser) {
          verifiedDiscount = (verifiedSubtotal * Number(coupon.discount_percent || 0)) / 100;

          const isSingleUse = code.startsWith("BADEM-") || code.startsWith("LOYAL-");
          await supabase
            .from("coupons")
            .update({
              used_count: (coupon.used_count || 0) + 1,
              is_used: isSingleUse,
              is_active: !isSingleUse,
            })
            .eq("id", coupon.id);
        }
      }
    }

    // 4. الحساب المالي الداخلي
    const deliveryFee = deliveryMode === "delivery" ? 35 : 0;
    const finalTotal = Math.max(0, verifiedSubtotal + deliveryFee - verifiedDiscount);

    const financials = {
      subtotal: verifiedSubtotal,
      deliveryFee,
      discount: verifiedDiscount,
      finalTotal,
    };

    const combinedNotes = [
      deliveryMode === "pickup" ? "[استلام من الفرع]" : "[توصيل للمنزل]",
      notes?.trim(),
      appliedCouponCode ? `[Coupon: ${appliedCouponCode.trim()}]` : "",
      mapsLink && deliveryMode === "delivery" ? `[GPS: ${mapsLink}]` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    // 5. توليد رقم طلب فريد
    const timeFragment = Date.now().toString().slice(-6);
    const randomFragment = Math.floor(100 + Math.random() * 900);
    const generatedId = `BDM-${timeFragment}-${randomFragment}`;

    // 6. حفظ الطلب في قاعدة البيانات
    const orderPayload = {
      id: generatedId,
      customer_name: customerName.trim(),
      customer_phone: phone.trim(),
      city: deliveryMode === "delivery" ? city.trim() : "استلام من الفرع",
      district: deliveryMode === "delivery" ? district.trim() : "الفرع الرئيسي",
      street: deliveryMode === "delivery" ? street.trim() : "استلام مباشر",
      notes: combinedNotes,
      is_gift: Boolean(isGift),
      recipient_name: isGift ? recipientName?.trim() : null,
      gift_message: isGift ? giftMessage?.trim() : null,
      items: verifiedItems,
      subtotal: financials.subtotal,
      discount_amount: financials.discount,
      delivery_fee: financials.deliveryFee,
      total_amount: financials.finalTotal,
      payment_method: paymentMethod === "bank_transfer" ? "تحويل بنكي" : "نقداً عند الاستلام",
      status: "pending",
    };

    const { error: insertError } = await supabase.from("orders").insert([orderPayload]);
    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      orderId: generatedId,
      financials,
      verifiedItems,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء معالجة الطلب";
    console.error("Order creation error:", error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}