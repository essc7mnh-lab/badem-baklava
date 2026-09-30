import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // السماح بنطاق صور سوبابيس الخاص بك لتجنب أخطاء التحميل
    remotePatterns: [

      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "zpvcjdnucykexfnxkxeb.supabase.co",
      },

    ],
   qualities: [75, 80, 85, 90, 92], // 👈 ينهي تنبيهات Terminal ويسرع التحميل فورا
  },
};

export default nextConfig;