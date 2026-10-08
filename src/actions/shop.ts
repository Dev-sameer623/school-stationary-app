"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getShopCustomer, refreshCustomerAccess } from "@/lib/customer-auth/session";
import { toErrorMessage } from "@/lib/errors";
import { sendOrderEmails } from "@/lib/order-mail";
import { sendMail } from "@/lib/mail";
import { shopConfig } from "@/lib/shop-config";
import { createOnlineOrder, getOrder } from "@/lib/services/orders";
import { quoteCart } from "@/lib/services/shop";
import type { ActionResult } from "@/types/action";
import { fieldErrors, onlineOrderSchema } from "@/lib/validations";
import { z } from "zod";

export async function loadCartQuote(items: unknown) {
  const customer = (await getShopCustomer()) ?? (await refreshCustomerAccess())?.customer;
  if (!customer) return [];
  const parsed = onlineOrderSchema.shape.items.safeParse(items);
  if (!parsed.success) return [];
  return quoteCart(parsed.data);
}

export async function placeOnlineOrder(input: unknown): Promise<ActionResult<{ orderNumber: string }>> {
  try {
    const customer = (await getShopCustomer()) ?? (await refreshCustomerAccess({ touch: true }))?.customer;
    if (!customer) {
      return { ok: false, message: "Log in to place an order." };
    }
    const parsed = onlineOrderSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
    }

    const order = await createOnlineOrder(
      {
        customerId: customer.id,
        couponCode: parsed.data.couponCode,
        items: parsed.data.items,
        studentName: parsed.data.studentName,
        studentClass: parsed.data.studentClass,
        studentSection: parsed.data.studentSection,
      },
      parsed.data.pickupNote,
    );
    const full = await getOrder(order.orderNumber);
    if (full) await sendOrderEmails(full);

    revalidatePath("/");
    revalidatePath("/orders");
    revalidatePath("/products");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    revalidatePath("/account/orders");
    return { ok: true, message: `Order ${order.orderNumber} placed.`, data: { orderNumber: order.orderNumber } };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  message: z.string().trim().min(1, "Message is required.").max(1000),
});

export async function sendContactMessage(
  _state: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
  }

  const shop = shopConfig();
  await sendMail(
    process.env.SMTP_SHOP_TO || shop.email,
    `Message from ${parsed.data.name}`,
    `${parsed.data.name} (${parsed.data.email}) wrote:\n\n${parsed.data.message}`,
  );
  return { ok: true, message: "Message sent." };
}

export async function requireShopCustomer(nextPath: string) {
  const customer = await getShopCustomer();
  if (!customer) redirect(`/account/login?next=${encodeURIComponent(nextPath)}`);
  return customer;
}
