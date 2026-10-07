import { NextResponse } from "next/server";
import { ACCESS_MAX_AGE, CUSTOMER_ACCESS_COOKIE, CUSTOMER_REFRESH_COOKIE, cookieBase } from "@/lib/customer-auth/constants";
import { refreshCustomerAccess } from "@/lib/customer-auth/session";
import { safeNext } from "@/lib/customer-auth/redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const refreshed = await refreshCustomerAccess();
  const response = NextResponse.redirect(new URL(refreshed ? next : "/", request.url));
  if (refreshed) {
    response.cookies.set(CUSTOMER_ACCESS_COOKIE, refreshed.access, { ...cookieBase(), maxAge: ACCESS_MAX_AGE });
  } else {
    response.cookies.set(CUSTOMER_ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
    response.cookies.set(CUSTOMER_REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  }
  return response;
}
