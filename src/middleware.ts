import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // حماية مسار لوحة التحكم
  if (pathname.startsWith("/admin")) {
    const adminSession = request.cookies.get("badem_admin_session")?.value;

    // إذا لم يكن مسجل دخول، يتم تحويله فوراً لصفحة الدخول
    if (!adminSession || adminSession !== "badem_authenticated_admin_session_2026") {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};