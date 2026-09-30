import { endOfDay, startOfDay } from "date-fns";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import type { CouponInput } from "@/lib/validations";

function uniqueCode(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError("A coupon with this code already exists.");
  }
  throw error;
}

function dates(input: CouponInput) {
  return {
    code: input.code.trim().toUpperCase(),
    percent: input.percent,
    status: input.status,
    startsAt: input.startsAt ? startOfDay(new Date(input.startsAt)) : null,
    endsAt: input.endsAt ? endOfDay(new Date(input.endsAt)) : null,
  };
}

export async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { code: "asc" } });
}

export async function createCoupon(input: CouponInput) {
  try {
    return await prisma.coupon.create({ data: dates(input) });
  } catch (error) {
    uniqueCode(error);
  }
}

export async function updateCoupon(id: string, input: CouponInput) {
  try {
    return await prisma.coupon.update({ where: { id }, data: dates(input) });
  } catch (error) {
    uniqueCode(error);
  }
}
