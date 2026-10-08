import { Badge } from "@/components/ui/feedback";
import { stockStatusLabel, type StockStatus } from "@/lib/format";

export function StockBadge({ status }: { status: StockStatus }) {
  const tone = status === "IN_STOCK" ? "green" : status === "LOW_STOCK" ? "amber" : "red";
  return <Badge tone={tone}>{stockStatusLabel(status)}</Badge>;
}

type OrderState = "PENDING" | "READY" | "COMPLETED" | "CANCELLED";

export function orderStatusLabel(status: OrderState, audience: "staff" | "customer" = "staff") {
  if (audience === "customer") {
    if (status === "PENDING") return "Placed";
    if (status === "READY") return "Ready to collect";
    if (status === "COMPLETED") return "Collected";
    return "Cancelled";
  }
  if (status === "COMPLETED") return "Collected";
  if (status === "READY") return "Ready";
  if (status === "PENDING") return "Pending";
  return "Cancelled";
}

export function OrderBadge({
  status,
  audience = "staff",
}: {
  status: OrderState;
  audience?: "staff" | "customer";
}) {
  const tone = status === "COMPLETED" ? "green" : status === "READY" ? "blue" : status === "PENDING" ? "amber" : "slate";
  return <Badge tone={tone}>{orderStatusLabel(status, audience)}</Badge>;
}

export function RoleBadge({ role }: { role: "ADMIN" | "MANAGER" }) {
  return <Badge tone={role === "ADMIN" ? "blue" : "slate"}>{role === "ADMIN" ? "Admin" : "Manager"}</Badge>;
}
