"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/guard";
import { createCoupon, updateCoupon } from "@/lib/services/coupons";
import { toErrorMessage } from "@/lib/errors";
import type { ActionResult } from "@/types/action";
import { couponSchema, fieldErrors } from "@/lib/validations";

export async function saveCoupon(input: unknown, id?: string): Promise<ActionResult> {
  try {
    await authorize("couponsManage");
    const parsed = couponSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
    }
    if (id) await updateCoupon(id, parsed.data);
    else await createCoupon(parsed.data);
    revalidatePath("/coupons");
    revalidatePath("/orders/new");
    return { ok: true, message: id ? "Coupon updated." : "Coupon added." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}
