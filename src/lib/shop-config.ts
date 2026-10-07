export function shopConfig() {
  return {
    name: process.env.SHOP_NAME || "School Stationery",
    phone: process.env.SHOP_PHONE || "9800000000",
    email: process.env.SHOP_EMAIL || "shop@example.com",
    address: process.env.SHOP_ADDRESS || "12 School Lane, Near the Main Gate",
  };
}
