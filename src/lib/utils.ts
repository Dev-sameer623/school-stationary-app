import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PAGE_SIZE = 10;

export function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function pageNumber(value: string | undefined) {
  const page = Number(value ?? "1");
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}
