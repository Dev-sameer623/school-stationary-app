import { NextResponse } from "next/server";
import { STAFF_ACTIVITY_COOKIE } from "@/lib/customer-auth/constants";

const staffCookies = [
  STAFF_ACTIVITY_COOKIE,
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "authjs.csrf-token",
  "__Host-authjs.csrf-token",
  "authjs.callback-url",
  "__Secure-authjs.callback-url",
];

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  for (const name of staffCookies) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}
