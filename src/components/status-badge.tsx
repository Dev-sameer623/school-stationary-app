import { Badge } from "@/components/ui/feedback";
import { stockStatusLabel, type StockStatus } from "@/lib/format";

export function StockBadge({ status }: { status: StockStatus }) {
  const tone = status === "IN_STOCK" ? "green" : status === "LOW_STOCK" ? "amber" : "red";
  return <Badge tone={tone}>{stockStatusLabel(status)}</Badge>;
}

export function OrderBadge({ status }: { status: "PENDING" | "COMPLETED" | "CANCELLED" }) {
  const tone = status === "COMPLETED" ? "green" : status === "PENDING" ? "amber" : "slate";
  return <Badge tone={tone}>{status[0] + status.slice(1).toLowerCase()}</Badge>;
}

export function RoleBadge({ role }: { role: "ADMIN" | "MANAGER" }) {
  return <Badge tone={role === "ADMIN" ? "blue" : "slate"}>{role === "ADMIN" ? "Admin" : "Manager"}</Badge>;
}
