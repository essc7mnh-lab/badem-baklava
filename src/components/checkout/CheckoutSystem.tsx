"use client";

import React, { useState, useEffect, useId, useMemo } from "react";
import Image from "next/image";
import {
  X,
  Gift,
  MapPin,
  CheckCircle2,
  Truck,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  MessageCircle,
  Loader2,
  AlertTriangle,
  Tag,
  Compass,
  ExternalLink,
  Banknote,
  Building2,
  Copy,
  Receipt,
  Store,
  QrCode
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase/supabase";
import { calculateOrderFinancials, formatCurrency } from "@/lib/orderPricing";

// 📱 رقم الواتساب الرسمي المعتمد للمتجر
const STORE_WHATSAPP_NUMBER = "966592320106";

// 🏦 بيانات الحساب البنكي الرسمي لمصرف الراجحي المعتمد
const BANK_DETAILS = {
  bankName: "مصرف الراجحي (Al Rajhi Bank)",
  brandTitle: "حساب الراجحي (BADEM)",
  accountName: "مؤسسة رواد اللذه للحلويات",
  accountNumber: "114000010006086241062",
  iban: "SA5980000114608016241062",
  qrImage: "/alrajhi-qr.png", // تأكد من وجود ملف alrajhi-qr.png داخل مجلد public
};

// 🇸🇦 التوصيل محصور رسمياً داخل مدينة الرياض فقط
const SAUDI_CITIES = [
  "الرياض"
];

interface CheckoutSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = "details" | "payment" | "tracking";
type DeliveryMode = "delivery" | "pickup";
type PaymentMethod = "cod" | "bank_transfer";

interface CartProductItem {
  id: string | number;
  title: string;
  price: number | string;
  quantity: number;
  image?: string;
  portion?: string;
  portionNote?: string;
  type?: string;
  tierId?: string;
  items?: { quantity: number; [key: string]: unknown }[];
  summaryText?: string;
  [key: string]: unknown;
}

export const CheckoutSystem: React.FC<CheckoutSystemProps> = ({ isOpen, onClose }) => {
  const { language, dir } = useLanguage();
  const isAr = language === "ar";
  const detailsFormId = useId();

  // استدعاء بيانات السلة
  const { cart = [], clearCart, setIsCartOpen } = useCart();
  const cartContext = useCart() as unknown as Record<string, unknown>;
  const appliedCouponCode = (cartContext.appliedCoupon || cartContext.couponCode || cartContext.coupon || "") as string;
  const discountAmount = Number(cartContext.discountAmount) || 0;

  // نمط الاستلام: توصيل (35 ر.س) أو استلام من الفرع (0 ر.س مجاناً)
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");

  // بيانات العميل والعنوان
const { 
  userName, 
  setUserName, 
  userPhone, 
  setUserPhone, 
  addOrder, 
  addresses = [], 
  addAddress 
} = useUser();
  const [currentStep, setCurrentStep] = useState<Step>("details");
  const [customerName, setCustomerName] = useState(userName || "");
  const [phone, setPhone] = useState(userPhone || "");
  const [city, setCity] = useState("الرياض");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");
  const [notes, setNotes] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // حساب المجموع الفرعي لمنتجات السلة
  const rawSubtotal = useMemo(() => {
    return (cart as CartProductItem[]).reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
      0
    );
  }, [cart]);

  const subtotal = Number(cartContext.subtotal) || rawSubtotal;

  // 🛡️ استدعاء المحرك المالي الموحد لحساب الفاتورة بدقة قطعية
  const liveFinancials = useMemo(() => {
    return calculateOrderFinancials({
      subtotal,
      delivery_fee: deliveryMode === "delivery" ? 35 : 0,
      discount_amount: discountAmount,
      notes: deliveryMode === "pickup" ? "[استلام من الفرع]" : "[توصيل للمنزل]",
      city,
    });
  }, [subtotal, deliveryMode, discountAmount, city]);

  
  const finalCalculatedTotal = liveFinancials.finalTotal;

  // تصفية وفحص اعتماد المدينة
  const filteredCities = useMemo(() => {
    if (!city.trim()) return SAUDI_CITIES;
    return SAUDI_CITIES.filter((c) =>
      c.toLowerCase().includes(city.toLowerCase().trim())
    );
  }, [city]);

  const isCityValid = useMemo(() => {
    return SAUDI_CITIES.includes(city.trim());
  }, [city]);

  // حالات تحديد الموقع بالـ GPS
  const [isLocating, setIsLocating] = useState(false);
  const [mapsLink, setMapsLink] = useState<string | null>(null);

  // بيانات الإهداء
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");

  // طريقة الدفع المعتمدة
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [copiedField, setCopiedField] = useState<"iban" | "account" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponWarning, setCouponWarning] = useState<string | null>(null);

  // تتبع الطلب ورابط الواتساب
  const [orderId, setOrderId] = useState("");
  const [backupWhatsAppUrl, setBackupWhatsAppUrl] = useState<string | null>(null);
  
// مزامنة بيانات المستخدم وعنوانه المسجل تلقائياً
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userName && !customerName) setCustomerName(userName);
      if (userPhone && !phone) setPhone(userPhone);

      // 📍 تعبئة العنوان المسجل تلقائياً إذا كانت الحقول فارغة
      if (addresses.length > 0 && !district && !street) {
        const primaryAddress = addresses[0];
        if (primaryAddress.city) setCity(primaryAddress.city);
        if (primaryAddress.district) setDistrict(primaryAddress.district);
        if (primaryAddress.street) setStreet(primaryAddress.street);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [userName, userPhone, customerName, phone, addresses, district, street]);


  if (!isOpen) return null;

  // 📍 تحديد الموقع الجغرافي واستخراج المدينة والحي والشارع بذكاء واحترافية
  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert(isAr ? "متصفحك لا يدعم ميزة تحديد الموقع الجغرافي" : "Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const generatedLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setMapsLink(generatedLink);

        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ar`
          );

          if (res.ok) {
            const data = await res.json();

            // الفحص الذكي: هل العميل داخل نطاق الرياض فعلياً؟
            const isInsideRiyadh =
              (data.city && (data.city.includes("الرياض") || data.city.toLowerCase().includes("riyadh"))) ||
              (data.principalSubdivision && (data.principalSubdivision.includes("الرياض") || data.principalSubdivision.toLowerCase().includes("riyadh"))) ||
              (data.locality && (data.locality.includes("الرياض") || data.locality.toLowerCase().includes("riyadh"))) ||
              (Array.isArray(data.localityInfo?.administrative) &&
                data.localityInfo.administrative.some(
                  (a: { name?: string }) =>
                    a.name && (a.name.includes("الرياض") || a.name.toLowerCase().includes("riyadh"))
                ));

            let detectedCity = "الرياض";
            if (isInsideRiyadh) {
              detectedCity = "الرياض";
            } else {
              detectedCity =
                data.city ||
                (data.principalSubdivision ? data.principalSubdivision.replace(/^(محافظة|منطقة)\s+/, "") : "") ||
                data.locality ||
                "خارج الرياض";
            }

            setCity(detectedCity);

            let detectedDistrict = data.locality || "";
            if (
              (!detectedDistrict || detectedDistrict === detectedCity) &&
              Array.isArray(data.localityInfo?.administrative)
            ) {
              const subAdmin = data.localityInfo.administrative.find(
                (item: { name?: string }) =>
                  item.name &&
                  item.name !== detectedCity &&
                  item.name !== data.countryName &&
                  item.name !== data.principalSubdivision
              );
              if (subAdmin?.name) detectedDistrict = subAdmin.name;
            }
            if (detectedDistrict) setDistrict(detectedDistrict);

            let detectedRoad = "";
            if (Array.isArray(data.localityInfo?.administrative)) {
              const roadParts = data.localityInfo.administrative
                .filter(
                  (item: { name?: string }) =>
                    item.name &&
                    item.name !== data.countryName &&
                    item.name !== data.principalSubdivision &&
                    item.name !== detectedCity &&
                    item.name !== detectedDistrict
                )
                .map((item: { name: string }) => item.name);

              if (roadParts.length > 0) {
                detectedRoad = roadParts.join(" - ");
              }
            }

            if (detectedRoad) {
              setStreet(detectedRoad);
            } else if (!street) {
              setStreet(`موقع محدد عبر الخريطة (قرب ${detectedDistrict || detectedCity})`);
            }

            if (!isInsideRiyadh) {
              setTimeout(() => {
                alert(
                  isAr
                    ? `📍 تم تحديد موقعك في (${detectedCity}).\nنعتذر منك، خدمة التوصيل متوفرة حالياً داخل مدينة الرياض فقط 🚚.`
                    : `📍 Detected location: (${detectedCity}).\nDelivery is currently available in Riyadh only.`
                );
              }, 300);
            }
          }
        } catch (e) {
          console.warn("Geocoding notice:", e);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        console.warn("Geolocation permission error:", error.message);
        alert(
          isAr
            ? "يرجى تفعيل صلاحية الموقع في متصفحك ليتم تحديد موقعك آلياً."
            : "Please enable location permission in your browser."
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleCopyText = (text: string, type: "iban" | "account") => {
    navigator.clipboard.writeText(text);
    setCopiedField(type);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const validateCouponSecurity = async (phoneToCheck: string): Promise<boolean> => {
    if (!appliedCouponCode) return true;

    try {
      const { data: couponData, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", appliedCouponCode)
        .single();

      if (error || !couponData || couponData.is_active === false) {
        setCouponWarning(isAr ? "عذراً، هذا الكوبون غير صالح أو تم إيقافه ❌" : "This coupon is no longer active ❌");
        return false;
      }

      if (couponData.expires_at && new Date(couponData.expires_at) < new Date()) {
        setCouponWarning(isAr ? "عذراً، انتهت صلاحية هذا الكود الترويجي ⏳" : "This coupon has expired ⏳");
        return false;
      }

      if (couponData.max_uses && (couponData.used_count || 0) >= couponData.max_uses) {
        setCouponWarning(isAr ? "عذراً، وصل هذا الكوبون للحد الأقصى من الاستخدام 🚫" : "Coupon usage limit reached 🚫");
        return false;
      }

      if (couponData.min_order_amount && subtotal < Number(couponData.min_order_amount)) {
        setCouponWarning(
          isAr
            ? `الحد الأدنى لتفعيل هذا الكود هو ${couponData.min_order_amount} ر.س (سلتك الحالية: ${subtotal.toFixed(2)} ر.س)`
            : `Minimum order for this coupon is ${couponData.min_order_amount} SAR`
        );
        return false;
      }

      if (couponData.one_per_customer) {
        const { data: previousOrders, error: orderErr } = await supabase
          .from("orders")
          .select("id, notes")
          .eq("customer_phone", phoneToCheck.trim());

        if (!orderErr && previousOrders) {
          const hasUsedBefore = previousOrders.some(
            (ord: { notes?: string }) => ord.notes && ord.notes.includes(appliedCouponCode)
          );

          if (hasUsedBefore) {
            setCouponWarning(
              isAr
                ? "⚠️ تم استخدام هذا الكود الترويجي مسبقاً بهذا الرقم! الخصم مخصص لمرة واحدة فقط لكل عميل."
                : "This coupon has already been used with this phone number ⚠️"
            );
            return false;
          }
        }
      }

      setCouponWarning(null);
      return true;
    } catch (e) {
      console.error("Coupon validation error:", e);
      return true;
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !phone.trim()) {
      alert(isAr ? "يرجى إدخال اسم العميل ورقم الجوال." : "Please enter your name and phone number.");
      return;
    }


    if (deliveryMode === "delivery") {
      if (!isCityValid) {
        alert(isAr ? "عذراً، التوصيل متاح حالياً داخل مدينة الرياض فقط." : "Delivery is currently available in Riyadh only.");
        return;
      }
      if (!district.trim() || district.trim().length < 2) {
        alert(isAr ? "يرجى كتابة اسم الحي السكني بدقة." : "Please enter your district.");
        return;
      }
      if (!street.trim() || street.trim().length < 3) {
        alert(isAr ? "يرجى إدخال اسم الشارع وتفاصيل المنزل (أو رقم الفيلا) بدقة لإتمام التوصيل." : "Please enter your street and house details.");
        return;
      }
    }

    setUserName(customerName.trim());
    setUserPhone(phone.trim());

    

    const isValid = await validateCouponSecurity(phone.trim());

    if (!isValid) {
      const rejectionReason = couponWarning || (isAr ? "كود الخصم غير صالح أو لم يعد مستوفياً للشروط." : "Coupon is invalid.");
      alert(
        isAr
          ? `⚠️ تنبيه:\n${rejectionReason}\n\nسيتم الآن إزالة الكوبون ومتابعة الطلب بالسعر الأساسي.`
          : `⚠️ Notice:\n${rejectionReason}\n\nThe coupon will be removed to proceed.`
      );

      try {
        if (typeof (cartContext as { removeCoupon?: () => void })?.removeCoupon === "function") {
          (cartContext as { removeCoupon: () => void }).removeCoupon();
        }
      } catch (err) {
        console.error("Error clearing invalid coupon:", err);
      }

      setCouponWarning(null);
      return;
    }

    setCurrentStep("payment");
  };

  // 📲 صياغة فاتورة الواتساب الفاخرة
  const createWhatsAppUrl = (
    generatedId: string,
    finalTotal: number,
    itemsToPrint: Array<{ title: string; portion?: string; quantity: number; price: number }>
  ) => {
    const cleanPhone = STORE_WHATSAPP_NUMBER.replace(/[^0-9]/g, "");

    const itemsText = itemsToPrint
      .map(
        (item, idx) =>
          `  ${idx + 1}. *${item.title}*\n     ${item.portion ? `• الحجم: ${item.portion}\n     ` : ""}الكمية: ${item.quantity} | السعر: ${(Number(item.price) * item.quantity).toFixed(2)} ر.س`
      )
      .join("\n");

    const deliveryModeText =
      deliveryMode === "delivery"
        ? `🚚 *نوع الاستلام:* توصيل إلى العنوان (رسوم التوصيل: 35.00 ر.س)\n• *المدينة:* ${city}\n• *الحي:* ${district}\n• *الشارع وتفاصيل المنزل:* ${street}${mapsLink ? `\n📍 *رابط خرائط GPS للمندوب:*\n${mapsLink}` : ""}`
        : `🏪 *نوع الاستلام:* استلام شخصي من الفرع (مجاناً - 0.00 ر.س)\n• *الفرع:* فرع بادَم للحلويات الفاخرة`;

    const giftText = isGift
      ? `\n🎁 *بيانات الإهداء:*\n• المهدَى إليه: ${recipientName || "غير محدد"}\n• رسالة البطاقة: "${giftMessage || "بدون رسالة"}"\n`
      : "";

    const notesText = notes ? `\n📝 *ملاحظات خاصة:* ${notes}\n` : "";
    const couponText = appliedCouponCode ? `\n🏷️ *كود الخصم المطبق:* ${appliedCouponCode} (خصم: ${discountAmount.toFixed(2)} ر.س)\n` : "";

    const payMethodTitle =
      paymentMethod === "bank_transfer"
        ? `🏦 تحويل بنكي على ${BANK_DETAILS.brandTitle}\n• *اسم الحساب:* ${BANK_DETAILS.accountName}\n• *الآيبان:* ${BANK_DETAILS.iban}\n📎 *ملاحظة الدفع:* مرفق لكم صورة إشعار التحويل البنكي الآن.`
        : "💵 الدفع نقداً عند الاستلام";

    const message = `✨ *طلب جديد من متجر بادَم BADEM BAKLAVA*
━━━━━━━━━━━━━━━━━━━
🆔 *رقم الطلب:* #${generatedId}

👤 *بيانات العميل:*
• *الاسم:* ${customerName}
• *الجوال:* ${phone}

${deliveryModeText}${giftText}${notesText}${couponText}
🛍️ *تفاصيل الأصناف والفاتورة:*
${itemsText}

━━━━━━━━━━━━━━━━━━━
📦 *قيمة المنتجات:* ${subtotal.toFixed(2)} ر.س
${deliveryMode === "delivery" ? "🚚 *رسوم التوصيل:* 35.00 ر.س\n" : "🏪 *رسوم الاستلام:* 0.00 ر.س (مجاناً)\n"}💰 *المبلغ الصافي المطلوب:* *${finalTotal.toFixed(2)} ر.س*
━━━━━━━━━━━━━━━━━━━
💳 *طريقة الدفع:*
${payMethodTitle}
━━━━━━━━━━━━━━━━━━━
✨ أرجو تأكيد الطلب وتجهيزه طازجاً!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // ✅ تأكيد الطلب وحفظه في Supabase بتدقيق مالي صارم
  const handleConfirmOrder = async () => {
    if (deliveryMode === "delivery") {
      if (!isCityValid) {
        alert(isAr ? "عذراً، التوصيل متاح حالياً داخل مدينة الرياض فقط." : "Delivery is currently available in Riyadh only.");
        return;
      }
      if (!district.trim() || district.trim().length < 2) {
        alert(isAr ? "يرجى كتابة اسم الحي السكني بشكل صحيح." : "Please enter a valid district name.");
        return;
      }
      if (!street.trim() || street.trim().length < 3) {
        alert(isAr ? "يرجى إدخال الشارع وتفاصيل المنزل لإتمام التوصيل." : "Please enter street and house details.");
        return;
      }
    }
    if (cart.length === 0) return;
    setIsProcessing(true);

    let verifiedSubtotal = 0;
    const verifiedItems: Array<{
      title: string;
      portion: string;
      portionNote: string;
      quantity: number;
      price: number;
      is_custom_box?: boolean;
    }> = [];

    try {
      for (const cartItem of cart as CartProductItem[]) {
        if (cartItem.type === "custom_box" || cartItem.tierId) {
          let officialBoxPrice = Number(cartItem.price);
          let officialCapacity = 0;

          const { data: tierData } = await supabase
            .from("custom_box_tiers")
            .select("price, capacity, name_ar")
            .eq("id", cartItem.tierId)
            .maybeSingle();

          if (tierData) {
            officialBoxPrice = Number(tierData.price);
            officialCapacity = Number(tierData.capacity);
          } else {
            const fallbackTiers: Record<string, { price: number; capacity: number }> = {
              box_500g: { price: 45, capacity: 4 },
              box_1000g: { price: 85, capacity: 8 },
              box_1500g: { price: 125, capacity: 12 },
            };
            if (cartItem.tierId && fallbackTiers[cartItem.tierId]) {
              officialBoxPrice = fallbackTiers[cartItem.tierId].price;
              officialCapacity = fallbackTiers[cartItem.tierId].capacity;
            }
          }

          if (Array.isArray(cartItem.items) && officialCapacity > 0) {
            const totalPieces = cartItem.items.reduce((sum: number, it) => sum + Number(it.quantity || 0), 0);
            if (totalPieces !== officialCapacity) {
              throw new Error(`سعة البوكس غير مكتملة (${totalPieces} من أصل ${officialCapacity} قطع).`);
            }
          }

          const boxItemTotal = officialBoxPrice * Number(cartItem.quantity || 1);
          verifiedSubtotal += boxItemTotal;
          verifiedItems.push({
            title: cartItem.title,
            portion: cartItem.portion || cartItem.summaryText || "تشكيلة مخصصة",
            portionNote: cartItem.portionNote || `بوكس مخصص (${officialCapacity} قطع)`,
            quantity: Number(cartItem.quantity || 1),
            price: officialBoxPrice,
            is_custom_box: true,
          });
        } else {
          const { data: dbProduct } = await supabase
            .from("products")
            .select("base_price, title_ar")
            .eq("title_ar", cartItem.title)
            .maybeSingle();

          const officialPrice = dbProduct ? Number(dbProduct.base_price) : Number(cartItem.price);
          const itemTotal = officialPrice * Number(cartItem.quantity);

          verifiedSubtotal += itemTotal;
          verifiedItems.push({
            title: cartItem.title,
            portion: cartItem.portionNote || cartItem.portion || "افتراضي",
            portionNote: cartItem.portionNote || "الحجم القياسي",
            quantity: cartItem.quantity,
            price: officialPrice,
          });
        }
      }

      let verifiedDiscount = 0;
      if (appliedCouponCode) {
        const { data: couponData } = await supabase
          .from("coupons")
          .select("discount_percent")
          .eq("code", appliedCouponCode)
          .maybeSingle();

        if (couponData?.discount_percent) {
          verifiedDiscount = (verifiedSubtotal * Number(couponData.discount_percent)) / 100;
        }
      }

      const combinedNotes = [
        deliveryMode === "pickup" ? "[استلام من الفرع]" : "[توصيل للمنزل]",
        notes.trim(),
        appliedCouponCode ? `[Coupon: ${appliedCouponCode}]` : "",
        mapsLink && deliveryMode === "delivery" ? `[GPS: ${mapsLink}]` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      // 🛡️ احتساب المبالغ النهائية عبر المحرك المالي الموحد بدقة
      const finalOrderFinancials = calculateOrderFinancials({
        subtotal: verifiedSubtotal,
        delivery_fee: deliveryMode === "delivery" ? 35 : 0,
        discount_amount: verifiedDiscount,
        notes: combinedNotes,
        city,
      });

      const generatedId = `BDM-${Math.floor(100000 + Math.random() * 900000)}`;

      // حمولة الطلب المحمية بجميع الحقول المالية الرسمية
      const orderPayload = {
        id: generatedId,
        customer_name: customerName.trim(),
        customer_phone: phone.trim(),
        city: deliveryMode === "delivery" ? city.trim() : "استلام من الفرع",
        district: deliveryMode === "delivery" ? district.trim() : "الفرع الرئيسي",
        street: deliveryMode === "delivery" ? street.trim() : "استلام مباشر",
        notes: combinedNotes,
        is_gift: isGift,
        recipient_name: isGift ? recipientName.trim() : null,
        gift_message: isGift ? giftMessage.trim() : null,
        items: verifiedItems,
        subtotal: finalOrderFinancials.subtotal,
        discount_amount: finalOrderFinancials.discount,
        delivery_fee: finalOrderFinancials.deliveryFee,
        total_amount: finalOrderFinancials.finalTotal,
        payment_method: paymentMethod === "bank_transfer" ? "تحويل بنكي" : "نقداً عند الاستلام",
        status: "pending",
      };

      const { error: insertError } = await supabase.from("orders").insert([orderPayload]);
      if (insertError) throw insertError;

      if (appliedCouponCode) {
        const { data: couponData } = await supabase
          .from("coupons")
          .select("id, used_count")
          .eq("code", appliedCouponCode)
          .maybeSingle();

        if (couponData) {
          const isSingleUse = appliedCouponCode.startsWith("BADEM-") || appliedCouponCode.startsWith("LOYAL-");
          await supabase
            .from("coupons")
            .update({
              used_count: (couponData.used_count || 0) + 1,
              is_used: isSingleUse,
              is_active: !isSingleUse,
            })
            .eq("code", appliedCouponCode);
        }

        try {
          const localCoupons = JSON.parse(localStorage.getItem("badem_saved_coupons") || "[]");
          const filtered = localCoupons.filter((c: { code: string }) => c.code !== appliedCouponCode);
          localStorage.setItem("badem_saved_coupons", JSON.stringify(filtered));
        } catch {
          // تجاوز صامت للتخزين المحلي
        }
      }

      setOrderId(generatedId);

      const waUrl = createWhatsAppUrl(generatedId, finalOrderFinancials.finalTotal, verifiedItems);
      setBackupWhatsAppUrl(waUrl);

      const win = window.open(waUrl, "_blank");
      if (!win) {
        window.location.assign(waUrl);
      }

      setCurrentStep("tracking");

      if (addOrder) {
        addOrder({
          id: generatedId,
          customerName: customerName.trim(),
          phone: phone.trim(),
          items: verifiedItems,
          totalAmount: finalOrderFinancials.finalTotal,
          status: "pending",
          paymentMethod: paymentMethod === "bank_transfer" ? "تحويل بنكي" : "نقداً عند الاستلام",
        });
      }
// 📍 فحص وحفظ العنوان تلقائياً في الملف الشخصي إذا لم يكن مسجلاً مسبقاً
      if (deliveryMode === "delivery" && district.trim() && street.trim()) {
        const isAddressAlreadySaved = addresses.some(
          (a) =>
            a.district?.trim().toLowerCase() === district.trim().toLowerCase() &&
            a.street?.trim().toLowerCase() === street.trim().toLowerCase()
        );

        if (!isAddressAlreadySaved && typeof addAddress === "function") {
          addAddress({
            title: isAr ? "عنوان التوصيل" : "Delivery Address",
            city: city.trim() || "الرياض",
            district: district.trim(),
            street: street.trim(),
          });
        }
      }

      clearCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      console.error("Order processing error:", err);
      alert(msg || (isAr ? "حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى." : "Error processing order."));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishClose = () => {
    setCurrentStep("details");
    onClose();
    setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#FAF5ED] w-full max-w-2xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-[#4A0E17]/20 max-h-[92vh] flex flex-col relative text-[#2D2321]">
        
        {/* الترويسة الفاخرة */}
        <div className="bg-[#4A0E17] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#C59B27]/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#C59B27]/20 flex items-center justify-center text-[#E5C058]">
              {currentStep === "tracking" ? <Truck className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white tracking-wide">
                {currentStep === "details" && (isAr ? "طريقة الاستلام والبيانات" : "Fulfillment & Address")}
                {currentStep === "payment" && (isAr ? "طريقة الدفع وتأكيد الحجز" : "Payment & Confirmation")}
                {currentStep === "tracking" && (isAr ? "تتبع الطلب المباشر" : "Live Tracking")}
              </h3>
              <p className="text-[10px] text-stone-300">
                {currentStep === "tracking" ? `رقم الطلب: #${orderId}` : `إجمالي الطلب: ${formatCurrency(finalCalculatedTotal)}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={currentStep === "tracking" ? handleFinishClose : onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* مؤشر الخطوات */}
        {currentStep !== "tracking" && (
          <div className="bg-white border-b border-stone-200/80 px-6 py-3 flex items-center justify-center gap-4 text-xs font-bold text-stone-500">
            <div className={`flex items-center gap-1.5 ${currentStep === "details" ? "text-[#4A0E17]" : "text-emerald-700"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === "details" ? "bg-[#4A0E17] text-white" : "bg-emerald-600 text-white"}`}>
                {currentStep === "payment" ? <Check className="w-3 h-3" /> : "1"}
              </span>
              <span>{isAr ? "الاستلام والبيانات" : "Details"}</span>
            </div>

            <span className="w-8 h-px bg-stone-300" />

            <div className={`flex items-center gap-1.5 ${currentStep === "payment" ? "text-[#4A0E17]" : "text-stone-400"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentStep === "payment" ? "bg-[#4A0E17] text-white" : "bg-stone-200 text-stone-600"}`}>
                2
              </span>
              <span>{isAr ? "طريقة الدفع والتأكيد" : "Payment"}</span>
            </div>
          </div>
        )}

        {/* محتوى الشاشة */}
        <div className="overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-5 flex-1 overscroll-contain">
          
          {/* الخطوة 1: اختيار التوصيل أو الاستلام والبيانات */}
          {currentStep === "details" && (
            <form id={detailsFormId} onSubmit={handleProceedToPayment} className="space-y-4">
              
              {/* 🌟 1. مفتاح الاختيار: توصيل للموقع أو استلام من الفرع */}
              <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-2.5">
                <span className="block text-[11px] font-black text-[#4A0E17]">
                  {isAr ? "اختر طريقة استلام الطلب:" : "Select Fulfillment Method:"}
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryMode("delivery")}
                    className={`p-3 sm:p-3.5 rounded-2xl border text-right transition flex items-center justify-between cursor-pointer ${
                      deliveryMode === "delivery"
                        ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 shadow-xs"
                        : "border-stone-200 bg-[#FAF5ED]/50 hover:bg-[#FAF5ED]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${deliveryMode === "delivery" ? "bg-[#4A0E17] text-white" : "bg-stone-200 text-stone-600"}`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-stone-900 block">توصيل للموقع</span>
                        <span className="text-[10px] text-stone-500 font-bold">رسوم التوصيل: 35 ر.س</span>
                      </div>
                    </div>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${deliveryMode === "delivery" ? "text-[#4A0E17]" : "text-stone-300"}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMode("pickup")}
                    className={`p-3 sm:p-3.5 rounded-2xl border text-right transition flex items-center justify-between cursor-pointer ${
                      deliveryMode === "pickup"
                        ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 shadow-xs"
                        : "border-stone-200 bg-[#FAF5ED]/50 hover:bg-[#FAF5ED]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${deliveryMode === "pickup" ? "bg-[#4A0E17] text-white" : "bg-stone-200 text-stone-600"}`}>
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-stone-900 block">استلام من الفرع</span>
                        <span className="text-[10px] text-emerald-700 font-black">مجاناً (0 ر.س)</span>
                      </div>
                    </div>
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${deliveryMode === "pickup" ? "text-[#4A0E17]" : "text-stone-300"}`} />
                  </button>
                </div>
              </div>

              {couponWarning && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex items-start gap-2.5 text-rose-800 animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">{couponWarning}</p>
                  </div>
                </div>
              )}

              {/* 🌟 2. حقول بيانات العميل الأساسية */}
              <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 space-y-4 shadow-2xs">
                <div className="border-b border-stone-100 pb-2">
                  <h4 className="text-xs font-black text-[#4A0E17] uppercase tracking-wider">
                    {isAr ? "بيانات العميل المستلم" : "Customer Contact Details"}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {isAr ? "الاسم الكامل *" : "Full Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => { setCustomerName(e.target.value); setCouponWarning(null); }}
                      placeholder="مثال: الاسم واللقب"
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      {isAr ? "رقم الجوال (واتساب) *" : "Phone Number *"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setCouponWarning(null); }}
                      placeholder="05XXXXXXXX"
                      className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] font-bold"
                    />
                  </div>
                </div>
{/* 🌟 3. تفاصيل موقع التوصيل محصورة في الرياض */}
                {deliveryMode === "delivery" ? (
                  <div className="space-y-3 pt-2 border-t border-stone-100 animate-in fade-in duration-200">
                    
                    {/* ✅ شريط العناوين المحفوظة كسطر مستقل مريح */}
                    {addresses.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        <span className="text-[10px] text-stone-400 font-bold shrink-0">عناوينك المحفوظة:</span>
                        {addresses.map((addr, i) => (
                          <button
                            key={addr.id || i}
                            type="button"
                            onClick={() => {
                              setCity(addr.city || "الرياض");
                              setDistrict(addr.district);
                              setStreet(addr.street);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold border transition cursor-pointer shrink-0 ${
                              district === addr.district
                                ? "bg-[#4A0E17] text-white border-[#4A0E17] shadow-xs"
                                : "bg-white text-stone-700 border-stone-200 hover:border-[#4A0E17]/40"
                            }`}
                          >
                            📍 {addr.title} ({addr.district})
                          </button>
                        ))}
                      </div>
                    )}

                    {/* سطر الترويسة وزر الـ GPS بشكل متوازن */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#C59B27]" />
                        <span>تفاصيل موقع التوصيل (الرياض):</span>
                      </span>

                      {/* زر تحديد الموقع بالـ GPS */}
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating}
                        className="flex items-center gap-2 px-3.5 py-2 bg-[#4A0E17] hover:bg-[#34050D] text-white border border-[#C59B27]/40 rounded-xl text-xs font-black shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
                      >
                        {isLocating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#E5C058]" />
                        ) : (
                          <Compass className="w-4 h-4 text-[#E5C058] animate-pulse" />
                        )}
                        <span className="tracking-wide">
                          {isLocating ? (isAr ? "جاري التحديد..." : "Locating...") : (isAr ? "تحديد موقعي بالـ GPS" : "Use GPS")}
                        </span>
                      </button>
                    </div>

                    {mapsLink && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
                        <span className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>تم حفظ إحداثيات موقعك بدقة وسيتم إرفاقها للمندوب! 📍</span>
                        </span>
                        <a href={mapsLink} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-900 font-black underline flex items-center gap-1">
                          <span>معاينة</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {/* حقل المدينة - الرياض فقط ومثبتة */}
                      <div className="relative">
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          {isAr ? "المدينة *" : "City *"}
                        </label>
                        
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={city}
                            onFocus={() => setIsCityDropdownOpen(true)}
                            onChange={(e) => {
                              setCity(e.target.value);
                              setIsCityDropdownOpen(true);
                            }}
                            placeholder="الرياض"
                            className={`w-full bg-[#FAF5ED] border rounded-xl px-3 py-2 text-xs font-bold text-stone-800 transition focus:outline-hidden ${
                              city && !isCityValid
                                ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                                : "border-emerald-400 focus:border-emerald-600 bg-emerald-50/20"
                            }`}
                          />

                          {isCityValid && (
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xs pointer-events-none">
                              ✓
                            </span>
                          )}
                        </div>

                        {/* قائمة مدينة الرياض الحصرية */}
                        {isCityDropdownOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setIsCityDropdownOpen(false)}
                            />

                            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-stone-200 rounded-2xl shadow-xl max-h-48 overflow-y-auto no-scrollbar py-1">
                              {filteredCities.length === 0 ? (
                                <div className="p-3 text-center text-xs text-rose-600 font-bold">
                                  {isAr ? "التوصيل متاح حالياً داخل مدينة الرياض فقط" : "Delivery available in Riyadh only"}
                                </div>
                              ) : (
                                filteredCities.map((cityName) => (
                                  <button
                                    key={cityName}
                                    type="button"
                                    onClick={() => {
                                      setCity(cityName);
                                      setIsCityDropdownOpen(false);
                                    }}
                                    className="w-full text-right px-3.5 py-2 text-xs font-bold transition flex items-center justify-between cursor-pointer bg-[#4A0E17] text-[#E5C058]"
                                  >
                                    <span>{cityName}</span>
                                    <span>✓</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </>
                        )}

                        {city && !isCityValid && (
                          <span className="text-[10px] text-rose-600 font-bold mt-1 block animate-in fade-in">
                            ⚠️ التوصيل متاح حالياً داخل مدينة الرياض فقط
                          </span>
                        )}
                      </div>

                      {/* حقل الحي */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 mb-1">
                          {isAr ? "الحي *" : "District *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="مثال: حي المحمدية"
                          className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] font-bold"
                        />
                      </div>
                    </div>

                    {/* حقل الشارع والمنزل */}
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        {isAr ? "الشارع وتفاصيل المنزل *" : "Street / House Details *"}
                      </label>
                      <input
                        type="text"
                        required
                        minLength={3}
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        placeholder={isAr ? "اسم الشارع، رقم العمارة أو رقم الفيلا *" : "Street name, villa or building number *"}
                        className={`w-full bg-[#FAF5ED] border rounded-xl px-3 py-2 text-xs focus:outline-hidden font-bold transition ${
                          street.trim().length >= 3
                            ? "border-emerald-300 focus:border-emerald-500"
                            : "border-stone-200 focus:border-[#4A0E17]"
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900 animate-in fade-in duration-200">
                    <Store className="w-5 h-5 text-[#4A0E17] shrink-0" />
                    <p className="leading-relaxed">
                      <strong>الاستلام من الفرع الرئيسي:</strong> لا حاجة لتحديد العنوان، سيتم تجهيز طلبكم وتغليفه طازجاً في المحل بانتظار حضوركم الكريم.
                    </p>
                  </div>
                )}
              </div>

              {/* قسم الإهداء الفاخر */}
              <div className="bg-white p-4 rounded-3xl border border-stone-200/80 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17]">
                      <Gift className="w-4 h-4 text-[#C59B27]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">
                        {isAr ? "هل هذا الطلب إهداء لشخص عزيز؟" : "Is this order a gift?"}
                      </h4>
                      <p className="text-[10px] text-stone-500">
                        {isAr ? "إضافة شريطة وبطاقة إهداء  مجاناً" : "Free ribbon & gift card"}
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={(e) => setIsGift(e.target.checked)}
                    className="w-5 h-5 accent-[#4A0E17] rounded-md cursor-pointer"
                  />
                </div>

                {isGift && (
                  <div className="pt-3 border-t border-stone-100 space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        {isAr ? "اسم المهدَى إليه:" : "Recipient Name:"}
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="اسم الشخص العزيز"
                        className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        {isAr ? "رسالة الإهداء:" : "Gift Message:"}
                      </label>
                      <textarea
                        rows={2}
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="اكتب تهنئتك ومشاعرك هنا..."
                        className="w-full bg-[#FAF5ED] border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17] resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {isAr ? "ملاحظات إضافية:" : "Special Instructions:"}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي توصيات خاصة لتحضير الطلب..."
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-[#4A0E17]"
                />
              </div>
            </form>
          )}

          {/* الخطوة 2: الدفع وبطاقة الراجحي والباركود */}
          {currentStep === "payment" && (
            <div className="space-y-4">
              
              {/* ملخص السلة والتوصيل عبر المحرك المالي */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200/80 space-y-2 shadow-2xs text-xs">
                <div className="flex justify-between font-bold text-stone-800 pb-2 border-b border-stone-100">
                  <span>{isAr ? "ملخص الأصناف المطلوبة:" : "Cart Summary:"}</span>
                  <span className="text-[#4A0E17]">{cart.length} أصناف</span>
                </div>
                {(cart as CartProductItem[]).map((item, i) => (
                  <div key={i} className="flex justify-between text-stone-600">
                    <span className="truncate max-w-52">{item.title} ({item.portion || item.portionNote || "قياسي"})</span>
                    <span className="font-bold">{(Number(item.price) * item.quantity).toFixed(2)} ر.س</span>
                  </div>
                ))}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2 rounded-xl">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>الخصم المطبق ({appliedCouponCode}):</span>
                    </span>
                    <span>- {discountAmount.toFixed(2)} ر.س</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600 pt-1">
                  <span>{deliveryMode === "delivery" ? "رسوم التوصيل للموقع:" : "الاستلام من الفرع:"}</span>
                  <span className="font-bold">{deliveryMode === "delivery" ? "35.00 ر.س" : "0.00 ر.س (مجاناً)"}</span>
                </div>

                <div className="flex justify-between font-black text-sm text-[#4A0E17] pt-2 border-t border-stone-100">
                  <span>المبلغ الصافي النهائي المطلوب:</span>
                  <span>{formatCurrency(finalCalculatedTotal)}</span>
                </div>
              </div>

              {/* اختيار وسيلة الدفع */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-stone-800">
                  {isAr ? "حدد طريقة الدفع المعتمدة:" : "Select Payment Method:"}
                </label>

                {/* 1. خيار التحويل البنكي */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`w-full p-4 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === "bank_transfer"
                      ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 shadow-xs"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17]">
                      <Building2 className="w-5 h-5 text-[#C59B27]" />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-stone-900 block">{BANK_DETAILS.brandTitle}</span>
                      <span className="text-[10px] text-stone-400">تحويل مباشر</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-full border border-amber-300/50">
                    موصى به ⭐
                  </span>
                </button>

                {/* بطاقة الحساب البنكي الفاخرة مع الباركود */}
                {paymentMethod === "bank_transfer" && (
                  <div className="bg-gradient-to-br from-[#4A0E17] via-[#3D0A11] to-[#2B050B] text-white p-5 rounded-3xl border border-[#C59B27]/40 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#E5C058]" />
                          <span className="text-xs font-black text-[#FAF5ED]">{BANK_DETAILS.brandTitle}</span>
                        </div>
                        <p className="text-[11px] text-[#E5C058] font-bold mt-0.5">
                          {BANK_DETAILS.accountName}
                        </p>
                      </div>
                      <span className="text-[9.5px] bg-[#E5C058]/15 text-[#E5C058] border border-[#E5C058]/30 font-bold px-2.5 py-1 rounded-full">
                        {BANK_DETAILS.bankName}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/25 p-3.5 rounded-2xl border border-white/10">
                      
                      <div className="bg-white p-2.5 rounded-2xl shadow-md shrink-0 flex flex-col items-center justify-center">
                        <div className="relative w-28 h-28">
                          <Image
                            src={BANK_DETAILS.qrImage}
                            alt="Al Rajhi Official QR"
                            fill
                            sizes="112px"
                            priority
                            className="object-contain"
                          />
                        </div>
                        <span className="text-[8px] text-stone-500 font-bold mt-1 flex items-center gap-0.5">
                          <QrCode className="w-2.5 h-2.5 text-[#4A0E17]" />
                          <span>امسح بكاميرا الراجحي</span>
                        </span>
                      </div>

                      <div className="flex-1 w-full space-y-2.5 text-xs">
                        
                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-stone-300">رقم الحساب:</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(BANK_DETAILS.accountNumber, "account")}
                              className="text-[10px] text-[#E5C058] hover:text-white transition font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === "account" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === "account" ? "تم النسخ!" : "نسخ الرقم"}</span>
                            </button>
                          </div>
                          <div className="font-mono text-xs sm:text-sm font-black text-[#FAF5ED] tracking-wider select-all" dir="ltr">
                            {BANK_DETAILS.accountNumber}
                          </div>
                        </div>

                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-stone-300">الآيبان الدولي (IBAN):</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(BANK_DETAILS.iban, "iban")}
                              className="text-[10px] text-[#E5C058] hover:text-white transition font-bold flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === "iban" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === "iban" ? "تم النسخ!" : "نسخ الآيبان"}</span>
                            </button>
                          </div>
                          <div className="font-mono text-[11px] sm:text-xs font-black text-[#FAF5ED] tracking-wide select-all" dir="ltr">
                            {BANK_DETAILS.iban}
                          </div>
                        </div>

                      </div>
                    </div>

                    <div className="bg-black/30 p-2.5 rounded-xl border border-white/10 flex items-start gap-2 text-[10.5px] text-amber-200/90 leading-relaxed">
                      <Receipt className="w-4 h-4 text-[#E5C058] shrink-0 mt-0.5" />
                      <span>
                        المبلغ المطلوب تحويله: (<strong>{formatCurrency(finalCalculatedTotal)}</strong>). يرجى إرفاق لقطة شاشة لإشعار التحويل البنكي مباشرة في محادثة الواتساب فور فتحها لتوثيق الطلب.
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. خيار الدفع نقداً */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`w-full p-4 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    paymentMethod === "cod"
                      ? "border-2 border-[#4A0E17] bg-[#4A0E17]/5 shadow-xs"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
                      <Banknote className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-stone-900 block">الدفع نقداً</span>
                      <span className="text-[10px] text-stone-400">
                        {deliveryMode === "delivery" ? "الدفع عند استلام الطلب من المندوب" : "الدفع عند الاستلام داخل المحل"}
                      </span>
                    </div>
                  </div>
                  <CheckCircle2 className={`w-5 h-5 ${paymentMethod === "cod" ? "text-[#4A0E17]" : "text-stone-300"}`} />
                </button>
              </div>

            </div>
          )}

          {/* الخطوة 3: التتبع المباشر للطلب */}
          {currentStep === "tracking" && (
            <div className="space-y-5 animate-in zoom-in-95 duration-300">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-sm text-emerald-900">
                  {isAr ? "تم تسجيل طلبك وتجهيز رسالة الواتساب!" : "Order Placed Successfully!"}
                </h4>
                <p className="text-xs text-emerald-700">
                  {isAr
                    ? `شكراً ${customerName}، تم توثيق الفاتورة برقم (#${orderId}). ${paymentMethod === "bank_transfer" ? "يرجى إرفاق إشعار التحويل في المحادثة." : "سيتم تجهيز طلبك طازجاً."}`
                    : `Thank you ${customerName}, your order (#${orderId}) is now registered.`}
                </p>

                {backupWhatsAppUrl && (
                  <div className="pt-2">
                    <a
                      href={backupWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>فتح محادثة الواتساب وتأكيد الطلب 📲</span>
                    </a>
                  </div>
                )}
              </div>
<div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-2xs">
                {/* 🌟 شريط الحالة الرسمية بدلاً من عداد الدقائق */}
                <div className="flex items-center justify-between text-xs font-bold border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                    </span>
                    <span className="text-stone-700">حالة الطلب:</span>
                    <span className="text-emerald-700 font-black">مؤكد • جاري التحضير الآن</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-stone-400">
                    #{orderId}
                  </span>
                </div>

                {/* 🌟 المحطات الثلاث المتناسقة فقط (تم دمج التغليف مع التحضير وحذف الخطوة الزائدة) */}
                <div className="space-y-4 pt-1">
                  
                  {/* المحطة 1: تم استلام الطلب وتوثيقه (مكتملة ومؤكدة) */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-stone-900">تم تسجيل الطلب وتوثيق الفاتورة</h5>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">مكتمل</span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">تم حجز الأصناف وإصدار الفاتورة الرسمية بنجاح.</p>
                    </div>
                  </div>

                  {/* المحطة 2: الخَبز والتجهيز الطازج مع التغليف (قيد العمل حالياً) */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#4A0E17] text-[#E5C058] flex items-center justify-center text-xs font-black shrink-0 shadow-xs ring-4 ring-[#4A0E17]/10">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-black text-[#4A0E17]"> التحضير الطازج</h5>
                        <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">جاري التجهيز</span>
                      </div>
                      <p className="text-[10px] text-stone-500 mt-0.5">إعداد البقلاوة بالسمن والفسق وتجهيز كرت الإهداء والتغليف.</p>
                    </div>
                  </div>

                  {/* المحطة 3: التوصيل / الاستلام (المرحلة القادمة) */}
                  <div className="flex items-start gap-3 opacity-60">
                    <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-400 border border-stone-300 flex items-center justify-center text-xs font-bold shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-stone-700">
                          {deliveryMode === "delivery" ? "التسليم مع المندوب" : "جاهز للاستلام من الفرع"}
                        </h5>
                        <span className="text-[10px] text-stone-400 font-medium">بانتظار التجهيز</span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        {deliveryMode === "delivery"
                          ? `الانطلاق مباشرة لعنوانكم في حي (${district || "المحدد"}).`
                          : "استلام بوكسكم الفاخر مباشرة من فرع بادَم."}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </div>

        {/* أزرار الإجراءات السفلية */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3 shadow-md">
          {currentStep === "details" && (
            <button
              type="submit"
              form={detailsFormId}
              className="w-full bg-[#4A0E17] hover:bg-[#36070E] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              <span>{isAr ? "المتابعة لاختيار طريقة الدفع" : "Proceed to Payment"}</span>
              {dir === "rtl" ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          )}

          {currentStep === "payment" && (
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep("details")}
                className="px-4 py-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-xs transition cursor-pointer"
              >
                تعديل
              </button>

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isProcessing || cart.length === 0}
                className="flex-1 bg-[#4A0E17] hover:bg-[#36070E] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري توثيق وتأمين الطلب...</span>
                  </div>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    <span>تأكيد وإرسال عبر الواتساب ({formatCurrency(finalCalculatedTotal)})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {currentStep === "tracking" && (
            <button
              type="button"
              onClick={handleFinishClose}
              className="w-full bg-[#4A0E17] hover:bg-[#36070E] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 cursor-pointer"
            >
              <span>العودة للرئيسية</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};