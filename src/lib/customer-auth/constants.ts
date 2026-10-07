export const CUSTOMER_ACCESS_COOKIE = "customer_access";
export const CUSTOMER_REFRESH_COOKIE = "customer_refresh";
export const STAFF_ACTIVITY_COOKIE = "staff_last_activity";

export const ACCESS_MAX_AGE = 15 * 60;
export const REFRESH_MAX_AGE = 24 * 60 * 60;
export const IDLE_MS = 30 * 60 * 1000;

export function cookieBase() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}
