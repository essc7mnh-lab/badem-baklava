import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/"], // منع أرشفة لوحات التحكم أو الـ APIs
    },
    sitemap: "https://www.bademsa.com/sitemap.xml",
  };
}