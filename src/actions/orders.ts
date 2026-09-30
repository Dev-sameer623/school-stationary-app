"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/guard";
import { toErrorMessage } from "@/lib/errors";
import { cancelOrder, completeOrder, createOrder } from "@/lib/services/orders";
import type { ActionResult } from "@/types/action";
import { fieldErrors, orderSchema } from "@/lib/validations";

function refreshOrders() {
  revalidatePath("/orders");
  revalidatePath("/products");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/customers");
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

export async function completeOrderAction(orderId: string): Promise<ActionResult> {
  try {
    await authorize("ordersComplete");
    await completeOrder(orderId);
    refreshOrders();
    return { ok: true, message: "Order completed." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  try {
    const user = await authorize("ordersCancel");
    await cancelOrder(orderId, user.id);
    refreshOrders();
    return { ok: true, message: "Order cancelled and stock restored." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}
