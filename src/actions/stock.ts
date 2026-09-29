"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/guard";
import { toErrorMessage } from "@/lib/errors";
import { changeStock } from "@/lib/services/stock";
import type { ActionResult } from "@/types/action";
import { fieldErrors, stockChangeSchema } from "@/lib/validations";

export async function saveStockChange(input: unknown): Promise<ActionResult> {
  try {
    const user = await authorize("stockManage");
    const parsed = stockChangeSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
    }
    const result = await changeStock(parsed.data, user.id);
    revalidatePath("/stock");
    revalidatePath("/products");
    revalidatePath("/dashboard");
    revalidatePath("/reports");
    return {
      ok: true,
      message: `${result.name} stock is now ${result.newStock}.`,
    };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}
