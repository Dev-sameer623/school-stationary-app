import type { Role } from "@/types/action";

export const permissions = {
  dashboard: ["ADMIN", "MANAGER"],
  productsView: ["ADMIN", "MANAGER"],
  productsManage: ["ADMIN"],
  categoriesManage: ["ADMIN"],
  stockManage: ["ADMIN", "MANAGER"],
  ordersCreate: ["ADMIN", "MANAGER"],
  couponsManage: ["ADMIN", "MANAGER"],
  ordersCancel: ["ADMIN"],
  customersManage: ["ADMIN", "MANAGER"],
  reportsView: ["ADMIN", "MANAGER"],
  usersManage: ["ADMIN"],
  csvImport: ["ADMIN"],
  csvExport: ["ADMIN", "MANAGER"],
} as const satisfies Record<string, Role[]>;

export type Permission = keyof typeof permissions;

export function can(role: Role, permission: Permission) {
  return (permissions[permission] as readonly Role[]).includes(role);
}
