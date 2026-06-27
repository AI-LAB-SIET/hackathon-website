import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const roleRoutes: Record<string, string[]> = {
  admin: ["/admin"],
  judge: ["/judge"],
  organizer: ["/organizer"],
  volunteer: ["/volunteer"],
  participant: ["/dashboard"],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie (set by client-side auth)
  const sessionCookie = request.cookies.get("siet_session");
  let role: string | null = null;

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value);
      role = session.role;
    } catch {
      // invalid cookie
    }
  }

  // If no cookie, allow access - client-side will handle redirect
  // This is a frontend-first approach with mock services
  if (!role) {
    return NextResponse.next();
  }

  for (const [requiredRole, routes] of Object.entries(roleRoutes)) {
    if (routes.some((route) => pathname.startsWith(route))) {
      if (role !== requiredRole) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/judge/:path*", "/organizer/:path*", "/volunteer/:path*", "/dashboard/:path*"],
};