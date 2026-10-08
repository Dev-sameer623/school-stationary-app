import { formatDateTime, formatInr, money } from "@/lib/format";
import { shopConfig } from "@/lib/shop-config";

type BillOrder = {
  orderNumber: string;
  pickupNote: string | null;
  studentName: string | null;
  studentClass: string | null;
  studentSection: string | null;
  status: string;
  paymentMethod: "CASH" | "UPI" | null;
  collectedAt: Date | null;
  total: { toString(): string } | number;
  items: Array<{
    id: string;
    quantity: number;
    sizeLabel: string | null;
    total: { toString(): string } | number;
    product: { name: string };
  }>;
};

export function CollectionBill({ order }: { order: BillOrder }) {
  const shop = shopConfig();
  const student = [order.studentName, order.studentClass, order.studentSection].filter(Boolean).join(" · ");
  const paid =
    order.status === "COMPLETED" && order.paymentMethod
      ? `${order.paymentMethod === "CASH" ? "Cash" : "UPI"}${order.collectedAt ? ` · ${formatDateTime(order.collectedAt)}` : ""}`
      : "Pay when you collect the goods.";

  return (
    <div className="collection-bill bg-[#efe6d6] py-8 text-[#1c1915]">
      <article className="mx-auto w-[360px] bg-[#fbf7f0] px-7 pb-6 pt-5 text-center font-serif">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/email-emblem.jpg" alt="" width={86} height={86} className="mx-auto h-[86px] w-[86px]" />
        <p className="mt-2 text-xl text-[#1f3d32]">{shop.name}</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/email-flourish-cream.jpg" alt="" width={168} className="mx-auto my-2 h-auto w-[168px]" />
        <h1 className="text-2xl font-bold">Collection bill</h1>
        {student ? <p className="mt-2 font-sans text-sm">Student: {student}</p> : null}
        <div className="mt-4 border border-[#c6a15a] px-4 py-3 text-left">
          <p className="text-center text-xl font-bold">{order.orderNumber}</p>
          <ul className="mt-3 grid gap-1.5">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 font-sans text-sm">
                <span>
                  {item.product.name}
                  {item.sizeLabel ? ` (${item.sizeLabel})` : ""} × {item.quantity}
                </span>
                <span>{formatInr(money(item.total))}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-right font-sans text-sm font-semibold">Amount due: {formatInr(money(order.total))}</p>
          <p className="text-right font-sans text-xs text-[#6f675d]">{paid}</p>
        </div>
        {order.pickupNote ? (
          <p className="mt-3 bg-[#e5f3e8] px-3 py-2 font-sans text-sm">
            <strong>Visit note:</strong> {order.pickupNote}
          </p>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/email-flourish-cream.jpg" alt="" width={168} className="mx-auto my-3 h-auto w-[168px]" />
        <p className="font-sans text-[11px] leading-relaxed text-[#8a8175]">
          {shop.name}, {shop.address}
          <br />
          {shop.phone}
        </p>
      </article>
    </div>
  );
}
