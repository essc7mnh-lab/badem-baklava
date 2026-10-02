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
  weight: ["400", "700", "800"], // اختصرنا الأوزان على الأساسية فقط
  variable: "--font-tajawal",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"], // أوزان العناوين الإنجليزية فقط
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
    "متجر بادام",
    "BADEM BAKLAVA",
    "بقلاوة تركية",
    "بقلاوة فستق",
    "حلويات تركية الرياض",
    "بقلاوة فاخرة السعودية",
    "طلب بقلاوة اونلاين",
    "أفضل بقلاوة في الرياض",
    "بوكس بقلاوة مشكل",

    "بادم",
    "بقلاوة بادم",
    "متجر بادم",
    "بقلاوة الرياض",
    "متجر حلا الرياض",
    "حلويات تركية الرياض",
    "بقلاوة فستق عنتابي",
    "حلويات شارع التخصصي",
    "توصيل بقلاوة"
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
    description: "أفخر أنواع البقلاوة التركية الطازجة في السعودية.",
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
  return (
    <html lang="ar" dir="rtl" className={`${tajawal.variable} ${playfair.variable}`}>
      <body className="antialiased min-h-screen bg-[#F4ECE1] text-[#2D2321]">
        {/* بيانات Schema المنظمة لمحركات البحث - مكانها المثالي هنا */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "متجر بادَم للبقلاوة الفاخرة",
              "image": "https://www.bademsa.com/logo.png",
              "description": "أفخر أنواع البقلاوة التركية الفاخرة بأجود أنواع الفستق العنتابي والسمن البلدي في السعودية.",
              "url": "https://www.bademsa.com",
              "priceRange": "$$",
              "telephone": "+966500000000",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "SA",
                "addressLocality": "Riyadh"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.9",
                "reviewCount": "128"
              }
            })
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
