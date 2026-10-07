import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import {
  ACCESS_MAX_AGE,
  CUSTOMER_ACCESS_COOKIE,
  CUSTOMER_REFRESH_COOKIE,
  IDLE_MS,
  REFRESH_MAX_AGE,
  cookieBase,
} from "@/lib/customer-auth/constants";
import { hashRefreshToken, newRefreshToken, signAccessToken, verifyAccessToken } from "@/lib/customer-auth/jwt";

const customerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  address: true,
} as const;

export type ShopCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};

function idle(lastActivityAt: Date) {
  return Date.now() - lastActivityAt.getTime() > IDLE_MS;
}

async function writeCookies(access: string, refresh: string, expiresAt: Date) {
  const store = await cookies();
  const base = cookieBase();
  store.set(CUSTOMER_ACCESS_COOKIE, access, { ...base, maxAge: ACCESS_MAX_AGE });
  store.set(CUSTOMER_REFRESH_COOKIE, refresh, { ...base, expires: expiresAt });
}

export async function clearCustomerCookies() {
  const store = await cookies();
  store.set(CUSTOMER_ACCESS_COOKIE, "", { ...cookieBase(), maxAge: 0 });
  store.set(CUSTOMER_REFRESH_COOKIE, "", { ...cookieBase(), maxAge: 0 });
}

export async function startCustomerSession(customerId: string) {
  const refresh = newRefreshToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFRESH_MAX_AGE * 1000);
  const session = await prisma.customerSession.create({
    data: {
      customerId,
      tokenHash: hashRefreshToken(refresh),
      expiresAt,
      lastRefreshedAt: now,
      lastActivityAt: now,
    },
  });
  const access = signAccessToken({ sub: customerId, sid: session.id });
  await writeCookies(access, refresh, expiresAt);
}

export async function logoutCustomer() {
  const store = await cookies();
  const refresh = store.get(CUSTOMER_REFRESH_COOKIE)?.value;
  if (refresh) {
    await prisma.customerSession.deleteMany({ where: { tokenHash: hashRefreshToken(refresh) } });
  }
  await clearCustomerCookies();
}

export async function getShopCustomer() {
  const store = await cookies();
  const access = store.get(CUSTOMER_ACCESS_COOKIE)?.value;
  const verified = access ? verifyAccessToken(access) : null;
  if (!verified) return null;

  const session = await prisma.customerSession.findUnique({
    where: { id: verified.sid },
    include: { customer: { select: customerSelect } },
  });
  if (!session || session.customerId !== verified.sub) return null;
  if (session.expiresAt.getTime() <= Date.now() || idle(session.lastActivityAt)) {
    await prisma.customerSession.deleteMany({ where: { id: session.id } });
    return null;
  }

  await prisma.customerSession.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });
  return session.customer;
}

export async function refreshCustomerAccess(options?: { touch?: boolean }) {
  const store = await cookies();
  const refresh = store.get(CUSTOMER_REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  const session = await prisma.customerSession.findUnique({
    where: { tokenHash: hashRefreshToken(refresh) },
    include: { customer: { select: customerSelect } },
  });
  if (!session || session.expiresAt.getTime() <= Date.now() || idle(session.lastActivityAt)) {
    if (session) await prisma.customerSession.deleteMany({ where: { id: session.id } });
    await clearCustomerCookies();
    return null;
  }

  const now = new Date();
  await prisma.customerSession.update({
    where: { id: session.id },
    data: options?.touch ? { lastRefreshedAt: now, lastActivityAt: now } : { lastRefreshedAt: now },
  });
  const access = signAccessToken({ sub: session.customerId, sid: session.id });
  store.set(CUSTOMER_ACCESS_COOKIE, access, { ...cookieBase(), maxAge: ACCESS_MAX_AGE });
  return { customer: session.customer, access };
}
