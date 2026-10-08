"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/guard";
import { toErrorMessage } from "@/lib/errors";
import { sendPackedEmail } from "@/lib/order-mail";
import { cancelOrder, completeOrder, createOrder, markOrderReady } from "@/lib/services/orders";
import type { ActionResult } from "@/types/action";
import { collectionSchema, fieldErrors, orderSchema } from "@/lib/validations";

function refreshOrders() {
  revalidatePath("/orders");
  revalidatePath("/products");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/customers");
  revalidatePath("/prepare");
}

export async function saveOrder(input: unknown): Promise<ActionResult<{ orderNumber: string }>> {
  try {
    const user = await authorize("ordersCreate");
    const parsed = orderSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
    }
    const order = await createOrder(parsed.data, user.id);
    refreshOrders();
    return { ok: true, message: `Created ${order.orderNumber}.`, data: { orderNumber: order.orderNumber } };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function markReadyAction(orderId: string): Promise<ActionResult> {
  try {
    await authorize("ordersComplete");
    const order = await markOrderReady(orderId);
    if (order.source === "ONLINE") await sendPackedEmail(order);
    refreshOrders();
    revalidatePath("/prepare");
    revalidatePath("/account/orders");
    return { ok: true, message: `${order.orderNumber} is ready to collect.` };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function completeOrderAction(orderId: string, paymentMethod: unknown): Promise<ActionResult> {
  try {
    const user = await authorize("ordersComplete");
    const parsed = collectionSchema.safeParse({ paymentMethod });
    if (!parsed.success) {
      return { ok: false, message: "Choose cash or UPI." };
    }
    await completeOrder(orderId, user.id, parsed.data.paymentMethod);
    refreshOrders();
    revalidatePath("/prepare");
    return { ok: true, message: "Payment recorded. Order collected." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const user = await authorize("ordersCancel");
    await cancelOrder(orderId, user.id);
    refreshOrders();
    revalidatePath("/prepare");
    return { ok: true, message: "Order cancelled and stock restored." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}
