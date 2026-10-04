// 🛡️ المحرك المالي الرسمي لمتجر بادَم BADEM BAKLAVA
// يضمن تطابق كافة العمليات الحسابية في السلة والدفع ولوحة التحكم والطباعة

export interface OrderItemPricing {
  price?: number | string;
  quantity?: number | string;
}

export interface OrderPricingInput {
  subtotal?: number | string;
  items?: OrderItemPricing[];
  delivery_fee?: number | string;
  discount_amount?: number | string;
  total_amount?: number | string;
  notes?: string;
  city?: string;
}

export interface CalculatedFinancials {
  subtotal: number;       // مجموع الأصناف فقط
  deliveryFee: number;    // رسوم التوصيل (35 أو 0)
  discount: number;       // الخصم المطبق
  finalTotal: number;     // المبلغ الصافي المطلوب تحصيله
  isPickup: boolean;      // هل نوع الطلب استلام من الفرع؟
}

/**
 * دالة مركزية لحساب وتدقيق كافة مبالغ الطلب بدقة متناهية
 */
export function calculateOrderFinancials(order: OrderPricingInput): CalculatedFinancials {
  // 1. هل الطلب استلام من الفرع؟
  const isPickup =
    Boolean(order.notes && order.notes.includes("[استلام من الفرع]")) ||
    Boolean(order.city && (order.city.includes("استلام") || order.city.includes("الفرع")));

  // 2. حساب قيمة الأصناف (Subtotal)
  let subtotal = 0;
  if (order.subtotal !== undefined && order.subtotal !== null && Number(order.subtotal) > 0) {
    subtotal = Number(order.subtotal);
  } else if (Array.isArray(order.items) && order.items.length > 0) {
    subtotal = order.items.reduce((sum, item) => {
      const p = Number(item.price || 0);
      const q = Number(item.quantity || 1);
      return sum + p * q;
    }, 0);
  }

  // 3. رسوم التوصيل المعتمدة
  let deliveryFee = 0;
  if (isPickup) {
    deliveryFee = 0;
  } else if (order.delivery_fee !== undefined && order.delivery_fee !== null) {
    deliveryFee = Number(order.delivery_fee);
  } else {
    deliveryFee = 35; // القيمة الرسمية المعتمدة للتوصيل في الرياض
  }

  // 4. الخصم
  const discount = Math.max(0, Number(order.discount_amount || 0));

  // 5. الحساب النهائي الإجمالي
  let finalTotal = 0;
  if (order.total_amount !== undefined && order.total_amount !== null && Number(order.total_amount) > 0) {
    finalTotal = Number(order.total_amount);
  } else {
    finalTotal = Math.max(0, subtotal - discount + deliveryFee);
  }

  // إذا لم يتوفر subtotal صريح سابقاً وكان الإجمالي مسجلاً:
  if (subtotal === 0 && finalTotal > 0) {
    subtotal = Math.max(0, finalTotal - deliveryFee + discount);
  }

  return {
    subtotal: Number(subtotal.toFixed(2)),
    deliveryFee: Number(deliveryFee.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    finalTotal: Number(finalTotal.toFixed(2)),
    isPickup,
  };
}

/**
 * تنسيق المبالغ المالية مع العملة للعرض في واجهات المستخدم
 */
export function formatCurrency(amount: number | string): string {
  const numeric = Number(amount) || 0;
  return `${numeric.toFixed(2)} ر.س`;
}