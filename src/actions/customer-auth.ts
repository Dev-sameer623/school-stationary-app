"use server";

import { redirect } from "next/navigation";
import { startCustomerSession } from "@/lib/customer-auth/session";
import { safeNext } from "@/lib/customer-auth/redirect";
import { toErrorMessage } from "@/lib/errors";
import { authenticateCustomer, registerCustomer } from "@/lib/services/customer-accounts";
import type { ActionResult } from "@/types/action";
import { customerSignupSchema, fieldErrors, loginSchema } from "@/lib/validations";

export async function signupCustomerAction(
  _state: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const next = safeNext(String(formData.get("next") ?? ""));
  const parsed = customerSignupSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
  }

  try {
    const customer = await registerCustomer(parsed.data);
    await startCustomerSession(customer.id);
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }

  redirect(next);
}

export async function loginCustomerAction(
  _state: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const next = safeNext(String(formData.get("next") ?? ""));
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
  }

  const customer = await authenticateCustomer(parsed.data.email, parsed.data.password);
  if (!customer) {
    return { ok: false, message: "Invalid email or password." };
  }

  await startCustomerSession(customer.id);
  redirect(next);
}
