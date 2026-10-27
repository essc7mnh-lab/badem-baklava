import type { Metadata, Viewport } from "next";
import { Tajawal, Playfair_Display } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ToastProvider } from "@/context/ToastContext";
import { FlyingCartAnimation } from "@/components/cart/FlyingCartAnimation";
import { UserProvider } from "@/context/UserContext";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4A0E17",
  width: "device-width",
  initialScale: 1,
};

// 🌟 إعدادات الـ SEO الرسمية المعتمدة لظهور اسم "متجر بادم" فوق الرابط
export const metadata: Metadata = {
  metadataBase: new URL("https://www.bademsa.com"),
  applicationName: "متجر بادم",
  title: {
    default: "متجر بادم | للبقلاوة التركية الفاخرة",
    template: "%s | متجر بادم",
  },
  description:
    "أفخر أنواع البقلاوة التركية الفاخرة بالفستق العنتابي والسمن البلدي النقي. طازجة مع توصيل سريع لكافة مناطق الرياض.",
  keywords: [
    "متجر بادم",
    "بادم",
    "بقلاوة بادم",
    "BADEM BAKLAVA",
    "بقلاوة تركية الرياض",
    "حلويات تركية الرياض",
    "حلويات شارع التخصصي",
    "بقلاوة فاخرة السعودية",
    "بقلاوة بادم",
    "BADEM BAKLAVA",
    "بقلاوة فستق عنتابي",
    "متجر حلا الرياض",
    "طلب بقلاوة اونلاين",
    "أفضل بقلاوة في الرياض",
    "بوكس بقلاوة مشكل",
    "توصيل بقلاوة الرياض"
  ],
  alternates: {
    canonical: "https://www.bademsa.com",
  },
  openGraph: {
    title: "متجر بادم | للبقلاوة التركية الفاخرة",
    description: "أصالة البقلاوة التركية الفاخرة بالفستق العنتابي الأصلي والسمن البلدي النقي.",
    url: "https://www.bademsa.com",
    siteName: "متجر بادم",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "متجر بادم | للبقلاوة التركية الفاخرة",
    description: "أفخر أنواع البقلاوة التركية الطازجة في الرياض.",
  },
  verification: {
    google: "AO44WoATQJhOSWwp6Gb8t1Kl5Yn0ktQguwHuZz04uj4",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 🌟 سكيما WebSite الرسمية لإجبار محرك البحث على عرض "متجر بادم" كاسم أساسي
  const siteNameSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.bademsa.com/#website",
    "url": "https://www.bademsa.com",
    "name": "متجر بادم",
    "alternateName": [
      "بادم",
      "بادَم",
      "متجر بادَم",
      "بقلاوة بادم",
      "BADEM",
      "BADEM BAKLAVA"
    ]
  };

  // 🌟 سكيما النشاط التجاري والفرع
  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": "https://www.bademsa.com/#store",
    "name": "متجر بادم للبقلاوة الفاخرة",
    "url": "https://www.bademsa.com",
    "telephone": "+966592320106",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "شارع التخصصي، حي المحمدية",
      "addressLocality": "الرياض",
      "addressRegion": "منطقة الرياض",
      "addressCountry": "SA"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 24.7136,
      "longitude": 46.6753
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "128"
    }
  };

  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${playfair.variable}`}>
      <body className="antialiased min-h-screen bg-[#F4ECE1] text-[#2D2321]">
        {/* حقن السكيما داخل body متوافق مع معمارية Next.js App Router */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteNameSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(storeSchema),
          }}
        />

        <ToastProvider>
          <LanguageProvider>
            <UserProvider>
              <WishlistProvider>
                <CartProvider>
                  <FlyingCartAnimation />
                  {children}
                </CartProvider>
              </WishlistProvider>
            </UserProvider>
          </LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  );
}