"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, Crown, Star,Phone, MessageCircle, 
  Search, Download, DollarSign,  MapPin, 
  Calendar,  ArrowUpDown 
} from "lucide-react";
import { formatCurrency } from "@/lib/orderPricing";
import type { AdminOrder } from "./OrdersManager";

export interface AggregatedCustomer {
  phone: string;
  name: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  cities: string[];
  tier: "vip" | "loyal" | "new";
}

interface CustomersManagerProps {
  orders: AdminOrder[];
}

export const CustomersManager: React.FC<CustomersManagerProps> = ({ orders }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<"all" | "vip" | "loyal" | "new">("all");
  const [sortBy, setSortBy] = useState<"spent" | "orders" | "recent">("spent");

  // تجميع ومعالجة بيانات العملاء من سجل الطلبات المعتمد
  const customersList = useMemo(() => {
    const customerMap = new Map<string, {
      name: string;
      phone: string;
      ordersCount: number;
      totalSpent: number;
      lastOrderDate: string;
      citiesSet: Set<string>;
    }>();

    orders.forEach((ord) => {
      const rawPhone = (ord.customer_phone || "").trim();
      if (!rawPhone) return;

      // تنظيف رقم الهاتف لضمان توحيد الحسابات للعميل الواحد
      const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
      const finalPhone = cleanPhone.startsWith("966") 
        ? "0" + cleanPhone.slice(3) 
        : cleanPhone.startsWith("5") 
        ? "0" + cleanPhone 
        : cleanPhone;

      const orderAmount = Number(ord.total_amount) || 0;
      const orderDate = ord.created_at || new Date().toISOString();
      const customerName = (ord.customer_name || "").trim() || "عميل بادَم";
      const cityName = (ord.city || "الرياض").trim();

      if (!customerMap.has(finalPhone)) {
        customerMap.set(finalPhone, {
          name: customerName,
          phone: finalPhone,
          ordersCount: 1,
          totalSpent: orderAmount,
          lastOrderDate: orderDate,
          citiesSet: new Set([cityName]),
        });
      } else {
        const existing = customerMap.get(finalPhone)!;
        existing.ordersCount += 1;
        existing.totalSpent += orderAmount;
        existing.citiesSet.add(cityName);
        // تحديث الاسم وآخر تاريخ طلب للأحدث
        if (new Date(orderDate) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = orderDate;
          if (customerName && customerName !== "عميل بادَم") {
            existing.name = customerName;
          }
        }
      }
    });

    const result: AggregatedCustomer[] = [];
    customerMap.forEach((data) => {
      // تصنيف العميل بحسب قيمة مشترياته وتكرار زياراته
      let tier: "vip" | "loyal" | "new" = "new";
      if (data.totalSpent >= 400 || data.ordersCount >= 4) {
        tier = "vip";
      } else if (data.ordersCount > 1 || data.totalSpent >= 200) {
        tier = "loyal";
      }

      result.push({
        phone: data.phone,
        name: data.name,
        ordersCount: data.ordersCount,
        totalSpent: data.totalSpent,
        lastOrderDate: data.lastOrderDate,
        cities: Array.from(data.citiesSet),
        tier,
      });
    });

    // الترتيب بحسب الاختيار
    return result.sort((a, b) => {
      if (sortBy === "spent") return b.totalSpent - a.totalSpent;
      if (sortBy === "orders") return b.ordersCount - a.ordersCount;
      return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
    });
  }, [orders, sortBy]);

  // إحصائيات سريعة للترويسة
  const stats = useMemo(() => {
    const total = customersList.length;
    const vip = customersList.filter((c) => c.tier === "vip").length;
    const loyal = customersList.filter((c) => c.tier === "loyal").length;
    const totalRevenue = customersList.reduce((acc, c) => acc + c.totalSpent, 0);
    const avgSpend = total > 0 ? totalRevenue / total : 0;

    return { total, vip, loyal, avgSpend };
  }, [customersList]);

  // تصفية النتائج بالبحث والفئات
  const filteredCustomers = useMemo(() => {
    return customersList.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.cities.some((city) => city.toLowerCase().includes(q));

      const matchTier = selectedTier === "all" || c.tier === selectedTier;
      return matchSearch && matchTier;
    });
  }, [customersList, searchQuery, selectedTier]);

  // فتح واتساب بمحتوى تسويقي راقٍ
  const handleOpenWhatsApp = (customer: AggregatedCustomer) => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
    const intlPhone = cleanPhone.startsWith("05")
      ? "966" + cleanPhone.slice(1)
      : cleanPhone.startsWith("5")
      ? "966" + cleanPhone
      : cleanPhone;

    const message = `أهلاً بك أستاذ ${customer.name} في متجر بادَم للبقلاوة الفاخرة ✨\nيسعدنا دائماً اختيارك لضيافتك ويسرنا تقديم خدمة حصرية لكم دائماً `;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // تصدير دليل العملاء إلى ملف Excel
  const exportCustomersToExcel = () => {
    if (customersList.length === 0) {
      alert("لا يوجد عملاء مسجلون للتصدير.");
      return;
    }

    const rows = customersList.map((c) => `
      <tr>
        <td style="text-align: right; font-weight: bold;">${c.name}</td>
        <td style="text-align: center; mso-number-format:'\\@'; font-weight: bold;">${c.phone}</td>
        <td style="text-align: center;">${c.tier === "vip" ? "عميل VIP" : c.tier === "loyal" ? "عميل مخلص" : "عميل جديد"}</td>
        <td style="text-align: center;">${c.ordersCount}</td>
        <td style="text-align: center; font-weight: bold; color: #4A0E17;">${c.totalSpent.toFixed(2)}</td>
        <td style="text-align: right;">${c.cities.join(" - ")}</td>
        <td style="text-align: center;">${new Date(c.lastOrderDate).toLocaleDateString("ar-SA")}</td>
      </tr>
    `).join("");

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <style>
          table { border-collapse: collapse; width: 100%; direction: rtl; font-family: Tahoma, Arial, sans-serif; }
          th { background-color: #4A0E17; color: #FFFFFF; font-weight: bold; border: 1px solid #C59B27; padding: 10px; text-align: center; font-size: 12px; }
          td { border: 1px solid #D5D5D5; padding: 8px; font-size: 11px; }
          tr:nth-child(even) { background-color: #FAF5ED; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>اسم العميل</th>
              <th>رقم الجوال</th>
              <th>تصنيف العضوية</th>
              <th>إجمالي الطلبات</th>
              <th>إجمالي المشتريات (ر.س)</th>
              <th>المدن المسجلة</th>
              <th>تاريخ آخر طلب</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `badem_customers_directory_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* 📊 بطاقات مؤشرات قاعدة العملاء الفاخرة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] text-stone-400 font-bold block">إجمالي العملاء المميزين</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-stone-800 font-mono">
              {stats.total} <span className="text-xs font-bold font-sans">عميل</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-[#4A0E17]/10 flex items-center justify-center text-[#4A0E17]">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] text-stone-400 font-bold block">عملاء VIP</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-amber-700 font-mono">
              {stats.vip} <span className="text-xs font-bold font-sans">عميل</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Crown className="w-4 h-4 text-[#C59B27]" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] text-stone-400 font-bold block">العملاء الدائمون (Loyal)</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-emerald-800 font-mono">
              {stats.loyal} <span className="text-xs font-bold font-sans">عميل</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-700">
              <Star className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] text-stone-400 font-bold block">متوسط صرف العميل (LTV)</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-[#4A0E17] font-mono">
              {stats.avgSpend.toFixed(0)} <span className="text-xs font-bold font-sans">ر.س</span>
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
        </div>

      </div>

      {/* 🔍 أدوات البحث، التصفية المتقدمة، الترتيب، وتصدير Excel */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، رقم الجوال، أو المدينة..."
              className="w-full bg-[#FAF5ED] border border-stone-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold focus:outline-hidden focus:border-[#4A0E17]"
            />
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                مسح
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* خيارات الترتيب */}
            <div className="flex items-center gap-1.5 bg-[#FAF5ED] px-3 py-1.5 rounded-2xl border border-stone-200 text-xs font-bold text-stone-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#C59B27]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "spent" | "orders" | "recent")}
                className="bg-transparent font-bold focus:outline-hidden cursor-pointer"
              >
                <option value="spent">الأعلى مشتريات (LTV)</option>
                <option value="orders">الأكثر طلباً</option>
                <option value="recent">الأحدث نشاطاً</option>
              </select>
            </div>

            <button
              type="button"
              onClick={exportCustomersToExcel}
              className="px-4 py-2.5 bg-[#4A0E17] hover:bg-[#36070E] text-white rounded-2xl text-xs font-black shadow-md transition flex items-center justify-center gap-1.5 border border-[#C59B27]/40 cursor-pointer active:scale-95 shrink-0"
              title="تصدير بيانات وأرقام العملاء لحملات التسويق"
            >
              <Download className="w-3.5 h-3.5 text-[#E5C058]" />
              <span className="hidden sm:inline">تصدير الدليل</span>
            </button>
          </div>

        </div>

        {/* فلاتر العضوية */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-bold text-stone-400 shrink-0">تصنيف العميل:</span>
          {[
            { id: "all", label: `الكل (${customersList.length})` },
            { id: "vip", label: ` VIP (${stats.vip})` },
            { id: "loyal", label: `⭐ دائمون (${stats.loyal})` },
            { id: "new", label: `✨ جدد (${stats.total - stats.vip - stats.loyal})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTier(tab.id as typeof selectedTier)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                selectedTier === tab.id
                  ? "bg-[#4A0E17] text-white shadow-xs font-black"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 👥 جدول وبطاقات دليل العملاء */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-stone-200 text-stone-400 shadow-2xs space-y-2">
            <Users className="w-12 h-12 mx-auto stroke-[1.5] text-stone-300" />
            <p className="font-bold text-sm text-stone-700">لم يتم العثور على عملاء مطابقين للبحث المختار.</p>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            return (
              <div
                key={cust.phone}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-stone-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-[#4A0E17]/40"
              >
                {/* هوية العميل وتفاصيله */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                    cust.tier === "vip" 
                      ? "bg-gradient-to-br from-[#4A0E17] to-[#2B050B] text-[#E5C058] border border-[#C59B27]/40" 
                      : cust.tier === "loyal"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-stone-100 text-stone-700 border border-stone-200"
                  }`}>
                    {cust.tier === "vip" ? <Crown className="w-5 h-5 text-[#E5C058]" /> : cust.name.slice(0, 1)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-black text-stone-900 truncate">
                        {cust.name}
                      </h4>

                      {/* شارة التميز */}
                      {cust.tier === "vip" && (
                        <span className="text-[9.5px] bg-[#4A0E17]/10 text-[#4A0E17] border border-[#4A0E17]/30 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Crown className="w-3 h-3 text-[#C59B27]" />
                          <span>عميل VIP</span>
                        </span>
                      )}

                      {cust.tier === "loyal" && (
                        <span className="text-[9.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                          عميل دائم
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-stone-500 text-[11px] font-medium flex-wrap">
                      <span className="font-mono font-bold text-stone-800" dir="ltr">
                        {cust.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#C59B27]" />
                        <span>{cust.cities.join("، ")}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-stone-400">
                        <Calendar className="w-3 h-3" />
                        <span>آخر طلب: {new Date(cust.lastOrderDate).toLocaleDateString("ar-SA")}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* الأرقام المالية وأزرار الإجراءات السريعة */}
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                  
                  {/* إحصائيات العميل الحسابية */}
                  <div className="flex items-center gap-4 text-left rtl:text-right">
                    <div className="bg-[#FAF5ED] px-3.5 py-2 rounded-2xl border border-stone-200/70 text-center">
                      <span className="block text-[9.5px] text-stone-400 font-bold">الطلبات</span>
                      <span className="font-mono font-black text-xs text-stone-800">
                        {cust.ordersCount}
                      </span>
                    </div>

                    <div className="bg-[#FAF5ED] px-3.5 py-2 rounded-2xl border border-stone-200/70 text-center">
                      <span className="block text-[9.5px] text-stone-400 font-bold">إجمالي المشتريات</span>
                      <span className="font-mono font-black text-xs text-[#4A0E17]">
                        {formatCurrency(cust.totalSpent)}
                      </span>
                    </div>
                  </div>

                  {/* أزرار الاتصال والواتساب الفورية */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(cust)}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-95"
                      title="مراسلة فورية عبر الواتساب"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">واتساب</span>
                    </button>

                    <a
                      href={`tel:${cust.phone}`}
                      className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl transition cursor-pointer shadow-2xs active:scale-95"
                      title="اتصال هاتفي"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#4A0E17]" />
                    </a>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};