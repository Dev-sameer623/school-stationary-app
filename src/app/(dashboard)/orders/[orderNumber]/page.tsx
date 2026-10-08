import { notFound } from "next/navigation";
import { cancelOrderAction, markReadyAction } from "@/actions/orders";
import { CollectionBill } from "@/components/orders/collection-bill";
import { CollectOrder } from "@/components/orders/collect-order";
import { ConfirmButton } from "@/components/confirm-button";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/print-button";
import { OrderBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { formatDateTime, formatInr, money } from "@/lib/format";
import { getOrder } from "@/lib/services/orders";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const user = await requireUser();
  const { orderNumber } = await params;
  const order = await getOrder(decodeURIComponent(orderNumber));
  if (!order) notFound();

  const student = [order.studentName, order.studentClass, order.studentSection].filter(Boolean).join(" · ");
  const canCollect = can(user.role, "ordersComplete") && (order.status === "PENDING" || order.status === "READY");

  return (
    <article className="print-sheet">
      <div className="no-print">
      <PageHeader title={order.orderNumber} description={formatDateTime(order.createdAt)}>
        <PrintButton label="Print bill" />
        {can(user.role, "ordersComplete") && order.status === "PENDING" ? (
          <ConfirmButton
            label="Mark ready"
            title={`Mark ${order.orderNumber} ready?`}
            description="Stock and the amount due will not change. The customer is told the order is packed."
            confirmLabel="Mark ready"
            tone="default"
            onConfirm={markReadyAction.bind(null, order.id)}
          />
        ) : null}
        {canCollect ? <CollectOrder orderId={order.id} orderNumber={order.orderNumber} /> : null}
        {can(user.role, "ordersCancel") && order.status !== "CANCELLED" ? (
          <ConfirmButton
            label="Cancel order"
            title={`Cancel ${order.orderNumber}?`}
            description="Stock for each item will be returned and recorded in the stock history."
            confirmLabel="Cancel order"
            onConfirm={cancelOrderAction.bind(null, order.id)}
          />
        ) : null}
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-6 text-sm">
        <p><span className="text-muted-foreground">Customer: </span>{order.customer.name}</p>
        <p><span className="text-muted-foreground">Created by: </span>{order.createdBy?.name ?? "Online shop"}</p>
        <p><span className="text-muted-foreground">Source: </span>{order.source === "ONLINE" ? "Online" : "Counter"}</p>
        {student ? <p><span className="text-muted-foreground">Student: </span>{student}</p> : null}
        {order.pickupNote ? <p><span className="text-muted-foreground">Visit note: </span>{order.pickupNote}</p> : null}
        {order.paymentMethod ? (
          <p>
            <span className="text-muted-foreground">Paid at the shop: </span>
            {order.paymentMethod === "CASH" ? "Cash" : "UPI"}
            {order.collectedAt ? ` · ${formatDateTime(order.collectedAt)}` : ""}
            {order.collectedBy ? ` · ${order.collectedBy.name}` : ""}
          </p>
        ) : null}
        <OrderBadge status={order.status} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">List price</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Price after discount</th>
              <th className="px-4 py-3">Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{item.product.name}</td>
                <td className="px-4 py-3">
                  {item.sizeLabel ? <span className="rounded-full border border-border px-2 py-0.5 text-xs">Size {item.sizeLabel}</span> : "—"}
                </td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{formatInr(money(item.unitPrice))}</td>
                <td className="px-4 py-3">{item.discountPercent}%</td>
                <td className="px-4 py-3">{formatInr(money(item.discountedUnitPrice))}</td>
                <td className="px-4 py-3">{formatInr(money(item.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 max-w-xs space-y-1 text-sm">
        <p className="flex justify-between"><span>List total</span><span>{formatInr(money(order.subtotal))}</span></p>
        <p className="flex justify-between"><span>Item discounts</span><span>{formatInr(money(order.subtotal) - money(order.discountedSubtotal))}</span></p>
        <p className="flex justify-between"><span>After item discounts</span><span>{formatInr(money(order.discountedSubtotal))}</span></p>
        {order.couponPercent > 0 ? (
          <p className="flex justify-between">
            <span>Coupon {order.couponCode} ({order.couponPercent}%)</span>
            <span>{formatInr(money(order.couponAmount))}</span>
          </p>
        ) : null}
        <p className="flex justify-between font-semibold"><span>Amount due</span><span>{formatInr(money(order.total))}</span></p>
      </div>
      </div>
      <CollectionBill order={order} />
    </article>
  );
}
