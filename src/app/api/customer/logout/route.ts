import { NextResponse } from "next/server";
import { CUSTOMER_ACCESS_COOKIE, CUSTOMER_REFRESH_COOKIE } from "@/lib/customer-auth/constants";
import { logoutCustomer } from "@/lib/customer-auth/session";

export async function GET(request: Request) {
  await logoutCustomer();
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(CUSTOMER_ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(CUSTOMER_REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
