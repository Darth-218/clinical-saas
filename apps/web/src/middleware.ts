import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CLINIC_ROUTES = ["/app"];
const PATIENT_ROUTES = ["/portal"];
const ADMIN_ROUTES = ["/admin"];
const PUBLIC_ROUTES = ["/login", "/reset-password"];

function getRoleFromToken(_token: string): string | null {
  // TODO: Decode JWT and extract role claim
  // For now, return null to indicate unauthenticated
  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session_token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = getRoleFromToken(token);

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    const isAppSubdomain = host.startsWith("app.");
    const isPortalSubdomain = host.startsWith("portal.");
    const isAdminSubdomain = host.startsWith("admin.");

    if (isAppSubdomain && !pathname.startsWith("/app")) {
      return NextResponse.rewrite(new URL(`/app${pathname}`, request.url));
    }
    if (isPortalSubdomain && !pathname.startsWith("/portal")) {
      return NextResponse.rewrite(new URL(`/portal${pathname}`, request.url));
    }
    if (isAdminSubdomain && !pathname.startsWith("/admin")) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url));
    }
  }

  const isClinicRoute = CLINIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isPatientRoute = PATIENT_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isClinicRoute && role !== "CLINIC_ADMIN" && role !== "DOCTOR" && role !== "RECEPTIONIST") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isPatientRoute && role !== "PATIENT") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminRoute && role !== "SAAS_ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
