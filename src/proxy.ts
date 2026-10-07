import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  CUSTOMER_ACCESS_COOKIE,
  CUSTOMER_REFRESH_COOKIE,
  IDLE_MS,
  STAFF_ACTIVITY_COOKIE,
  cookieBase,
} from "@/lib/customer-auth/constants";
import { verifyAccessToken } from "@/lib/customer-auth/jwt";

function isCustomerArea(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/cart" ||
    pathname === "/checkout" ||
    pathname.startsWith("/shop") ||
    pathname.startsWith("/category") ||
    pathname.startsWith("/account")
  );
}

function isCustomerProtected(pathname: string) {
  return pathname === "/cart" || pathname === "/checkout" || pathname.startsWith("/account/orders");
}

const staffCookies = [
  STAFF_ACTIVITY_COOKIE,
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
];

export default auth((request) => {
  const isLoggedIn = Boolean(request.auth?.user?.id);
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/login";
  const isAuthApi = pathname.startsWith("/api/auth");
  const isIdleLogout = pathname === "/api/staff/idle-logout";

  if (isLoggedIn && !isIdleLogout) {
    const last = Number(request.cookies.get(STAFF_ACTIVITY_COOKIE)?.value ?? 0);
    if (last && Date.now() - last > IDLE_MS) {
      const response = NextResponse.redirect(new URL("/login", request.nextUrl));
      for (const name of staffCookies) response.cookies.set(name, "", { path: "/", maxAge: 0 });
      return response;
    }
  }

  const access = request.cookies.get(CUSTOMER_ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(CUSTOMER_REFRESH_COOKIE)?.value;
  const accessValid = Boolean(access && verifyAccessToken(access));
  if (isCustomerArea(pathname) && refresh && !accessValid && pathname !== "/account/login" && pathname !== "/account/signup") {
    const refreshUrl = new URL("/api/customer/refresh", request.nextUrl);
    refreshUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(refreshUrl);
  }

  if (isCustomerProtected(pathname) && !access && !refresh) {
    const login = new URL("/account/login", request.nextUrl);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (!isLoggedIn && !isLogin && !isAuthApi && !isCustomerArea(pathname) && !pathname.startsWith("/api/customer") && !isIdleLogout) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isLoggedIn && isLogin) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  const response = NextResponse.next();
  if (isLoggedIn && !isIdleLogout) {
    response.cookies.set(STAFF_ACTIVITY_COOKIE, String(Date.now()), {
      ...cookieBase(),
      maxAge: 24 * 60 * 60,
    });
  }
  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|uploads/|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)",
  ],
};
