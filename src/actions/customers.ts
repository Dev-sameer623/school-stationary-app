"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/guard";
import { toErrorMessage } from "@/lib/errors";
import { createCustomer, updateCustomer } from "@/lib/services/customers";
import type { ActionResult } from "@/types/action";
import { customerSchema, fieldErrors } from "@/lib/validations";

export async function saveCustomer(
  input: unknown,
  id?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await authorize("customersManage");
    const parsed = customerSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
    }
    const customer = id
      ? await updateCustomer(id, parsed.data)
      : await createCustomer(parsed.data);
    revalidatePath("/customers");
    revalidatePath("/orders");
    return {
      ok: true,
      message: id ? "Customer updated." : "Customer added.",
      data: { id: customer.id },
    };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}
