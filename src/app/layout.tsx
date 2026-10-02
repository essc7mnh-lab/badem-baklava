import type { Metadata } from "next";
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
  weight: ["400", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

// إعدادات الـ SEO المتقدمة لمحركات البحث وشبكات التواصل
export const metadata: Metadata = {
  metadataBase: new URL("https://www.bademsa.com"),
  title: {
    default: "BADEM BAKLAVA | متجر بادَم للبقلاوة الفاخرة",
    template: "%s | متجر بادَم للبقلاوة الفاخرة",
  },
  verification: {
    google: "AO44WoATQJhOSWwp6Gb8t1Kl5Yn0ktQguwHuZz04uj4",
  },
  description:
    "أفخر أنواع البقلاوة التركية الفاخرة بأجود أنواع الفستق العنتابي والسمن البلدي الصافي. طازجة وتوصيل سريع لكافة مناطق الرياض.",
  keywords: [
    "بادم",
    "متجر بادم",
    "بقلاوة بادم",
    "BADEM BAKLAVA",
    "متجر بادام",
    "بقلاوة تركية الرياض",
    "بقلاوة فستق عنتابي",
    "حلويات تركية الرياض",
    "متجر حلا الرياض",
    "حلويات شارع التخصصي",
    "بقلاوة فاخرة السعودية",
    "طلب بقلاوة اونلاين",
    "أفضل بقلاوة في الرياض",
    "بوكس بقلاوة مشكل",
    "توصيل بقلاوة الرياض"
  ],
  alternates: {
    canonical: "https://www.bademsa.com",
  },
  openGraph: {
    title: "BADEM BAKLAVA | متجر بادَم للبقلاوة الفاخرة",
    description: "أصالة البقلاوة التركية الفاخرة بالفستق العنتابي الأصلي والسمن البلدي.",
    url: "https://www.bademsa.com",
    siteName: "متجر بادَم للبقلاوة الفاخرة",
    images: [
      {
        url: "https://www.bademsa.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "متجر بادَم للبقلاوة الفاخرة",
      },
    ],
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BADEM BAKLAVA | متجر بادَم للبقلاوة الفاخرة",
    description: "أفخر أنواع البقلاوة التركية الطازجة في الرياض.",
    images: ["https://www.bademsa.com/og-image.png"],
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
  // كود البيانات المهيكلة الرسمي لـ Google لظهور اسم المتجر وبيانات الفرع
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://www.bademsa.com/#website",
        "url": "https://www.bademsa.com",
        "name": "متجر بادَم للبقلاوة الفاخرة",
        "alternateName": ["بادم", "بادم بقلاوة", "BADEM BAKLAVA", "Badem Baklava"],
        "inLanguage": "ar"
      },
      {
        "@type": "Bakery",
        "@id": "https://www.bademsa.com/#store",
        "name": "BADEM BAKLAVA | متجر بادَم للبقلاوة الفاخرة",
        "image": "https://www.bademsa.com/og-image.png",
        "description": "أفخر أنواع البقلاوة التركية الفاخرة بأجود أنواع الفستق العنتابي والسمن البلدي الصافي في الرياض.",
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
      }
    ]
  };

  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${playfair.variable}`}>
      <head>
        {/* سكيما مدمجة ومعتمدة لظهور اسم الموقع في بحث Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#F4ECE1] text-[#2D2321]">
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