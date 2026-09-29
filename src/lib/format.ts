import { format } from "date-fns";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export function stockStatus(quantity: number, minimumStock: number): StockStatus {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= minimumStock) return "LOW_STOCK";
  return "IN_STOCK";
}

export function stockStatusLabel(status: StockStatus) {
  if (status === "IN_STOCK") return "In Stock";
  if (status === "LOW_STOCK") return "Low Stock";
  return "Out of Stock";
}

export function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: Date | string) {
  return format(new Date(value), "d MMM yyyy");
}

export function formatDateTime(value: Date | string) {
  return format(new Date(value), "d MMM yyyy, h:mm a");
}

export function money(value: { toString(): string } | number | string) {
  return Number(value);
}
