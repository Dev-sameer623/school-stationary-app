import { formatInr, money } from "@/lib/format";
import { sendMail } from "@/lib/mail";
import { shopConfig } from "@/lib/shop-config";

type MailedOrder = {
  orderNumber: string;
  pickupNote: string | null;
  studentName?: string | null;
  studentClass?: string | null;
  studentSection?: string | null;
  source?: "COUNTER" | "ONLINE";
  total: { toString(): string } | number;
  customer: { name: string; email: string | null };
  items: Array<{
    quantity: number;
    sizeLabel: string | null;
    total: { toString(): string } | number;
    product: { name: string };
  }>;
};

const green = "#1f3d32";
const canvas = "#efe6d6";
const card = "#fbf7f0";
const gold = "#c6a15a";
const ink = "#1c1915";
const cardWidth = 360;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function itemLabel(item: MailedOrder["items"][number]) {
  const size = item.sizeLabel ? ` (${item.sizeLabel})` : "";
  return `${item.product.name}${size} × ${item.quantity}`;
}

function studentText(order: MailedOrder) {
  const parts = [order.studentName, order.studentClass, order.studentSection].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : "";
}

function studentHtml(order: MailedOrder) {
  const text = studentText(order);
  if (!text) return "";
  return `<p style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:13px;">Student: ${escapeHtml(text)}</p>`;
}

function assetSrc(file: string) {
  const base = process.env.AUTH_URL?.replace(/\/$/, "");
  return base ? `${base}/${file}` : null;
}

function fittedImage(src: string, width: number, height?: number) {
  const size = height ? `width:${width}px;height:${height}px;` : `width:${width}px;height:auto;`;
  const attrs = height ? `width="${width}" height="${height}"` : `width="${width}"`;
  return `<img src="${escapeHtml(src)}" alt="" ${attrs} style="display:block;margin:0 auto;border:0;${size}max-width:${width}px;">`;
}

function flourish(file: string) {
  const src = assetSrc(file);
  return src ? `<div style="margin:10px 0;">${fittedImage(src, 168)}</div>` : "";
}

function shell(inner: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${canvas};color:${ink};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${canvas};">
    <tr><td align="center" style="padding:28px 16px;">
      <table role="presentation" width="${cardWidth}" cellpadding="0" cellspacing="0" align="center" style="width:${cardWidth}px;max-width:${cardWidth}px;background:${card};">
        ${inner}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function footer(shop: ReturnType<typeof shopConfig>) {
  return `<tr><td style="padding:4px 28px 26px;text-align:center;font-family:Arial,sans-serif;font-size:11px;line-height:1.55;color:#8a8175;">
    ${escapeHtml(shop.name)}, ${escapeHtml(shop.address)}<br>${escapeHtml(shop.phone)}
  </td></tr>`;
}

function customerLetter(order: MailedOrder, shop: ReturnType<typeof shopConfig>, amount: string) {
  const emblem = assetSrc("email-emblem.jpg");
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:5px 0;font-family:Arial,sans-serif;font-size:13px;color:${ink};">${escapeHtml(itemLabel(item))}</td>
        <td align="right" style="padding:5px 0;font-family:Arial,sans-serif;font-size:13px;color:${ink};">${escapeHtml(formatInr(money(item.total)))}</td>
      </tr>`,
    )
    .join("");
  const visit = order.pickupNote
    ? `<tr><td style="padding:0 28px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e5f3e8;">
          <tr><td align="center" style="padding:8px 12px;font-family:Arial,sans-serif;font-size:13px;color:${ink};"><strong>Visit note:</strong> ${escapeHtml(order.pickupNote)}</td></tr>
        </table>
      </td></tr>`
    : "";
  const mark = emblem ? fittedImage(emblem, 86, 86) : "";
  return shell(`
    <tr><td style="padding:22px 28px 0;text-align:center;">
      ${mark}
      <p style="margin:8px 0 0;font-size:20px;line-height:1.2;color:${green};">${escapeHtml(shop.name)}</p>
      ${flourish("email-flourish-cream.jpg")}
      <h1 style="margin:2px 0 8px;font-size:24px;line-height:1.2;font-weight:bold;color:${ink};">Order Received</h1>
      <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:1.45;color:${ink};">Hello ${escapeHtml(order.customer.name)},<br>We received your order. The shop will prepare it before you arrive.</p>
      ${studentHtml(order)}
    </td></tr>
    <tr><td style="padding:16px 28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${gold};">
        <tr><td style="padding:14px 16px 12px;">
          <p style="margin:0 0 10px;text-align:center;font-size:20px;line-height:1.2;font-weight:bold;">${escapeHtml(order.orderNumber)}</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          <p style="margin:12px 0 0;text-align:right;font-family:Arial,sans-serif;font-size:13px;line-height:1.4;"><strong>Amount due: ${escapeHtml(amount)}</strong><br><span style="font-size:12px;color:#6f675d;">Pay when you collect the goods.</span></p>
        </td></tr>
      </table>
    </td></tr>
    ${visit}
    <tr><td style="padding:8px 28px 0;text-align:center;">${flourish("email-flourish-cream.jpg")}</td></tr>
    ${footer(shop)}
  `);
}

function shopLetter(order: MailedOrder, shop: ReturnType<typeof shopConfig>, amount: string) {
  const rows = order.items
    .map(
      (item) => `<tr>
        <td style="padding:7px 10px;border-bottom:1px solid #e4d9c8;font-family:Arial,sans-serif;font-size:13px;">${escapeHtml(itemLabel(item))}</td>
        <td align="right" style="padding:7px 10px;border-bottom:1px solid #e4d9c8;font-family:Arial,sans-serif;font-size:13px;">${escapeHtml(formatInr(money(item.total)))}</td>
      </tr>`,
    )
    .join("");
  const visit = order.pickupNote
    ? `<tr><td style="padding:0 28px 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3eee4;border:1px solid ${gold};">
          <tr><td align="center" style="padding:8px 12px;font-family:Arial,sans-serif;font-size:13px;"><strong>Visit note:</strong> ${escapeHtml(order.pickupNote)}</td></tr>
        </table>
      </td></tr>`
    : "";
  return shell(`
    <tr><td style="padding:10px;background:${green};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${gold};">
        <tr><td style="padding:3px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${gold};">
            <tr><td align="center" style="padding:16px 14px 14px;color:#f7f3ea;">
              ${flourish("email-flourish-green.jpg")}
              <h1 style="margin:0;font-size:24px;line-height:1.2;font-weight:normal;color:#f7f3ea;">New Order Alert</h1>
              <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.4;color:#f3efe4;">An online order is waiting to be prepared.</p>
              ${flourish("email-flourish-green.jpg")}
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:16px 28px 6px;text-align:center;">
      <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;">Customer: ${escapeHtml(order.customer.name)}</p>
      ${studentHtml(order)}
      <p style="margin:6px 0 0;font-size:22px;line-height:1.2;font-weight:bold;">${escapeHtml(order.orderNumber)}</p>
    </td></tr>
    <tr><td style="padding:10px 28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4d9c8;">
        <tr>
          <th align="left" style="padding:7px 10px;background:#f3eee4;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;">Item</th>
          <th align="right" style="padding:7px 10px;background:#f3eee4;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;">Price</th>
        </tr>
        ${rows}
        <tr>
          <td style="padding:8px 10px;font-family:Arial,sans-serif;font-size:13px;"><strong>Total</strong></td>
          <td align="right" style="padding:8px 10px;font-family:Arial,sans-serif;font-size:13px;"><strong>Amount due: ${escapeHtml(amount)}</strong></td>
        </tr>
      </table>
    </td></tr>
    ${visit}
    <tr><td align="center" style="padding:6px 28px 0;">${flourish("email-flourish-cream.jpg")}</td></tr>
    <tr><td style="padding:2px 28px 8px;text-align:center;font-family:Arial,sans-serif;font-size:13px;">Preparation required before customer arrival.</td></tr>
    ${footer(shop)}
  `);
}

export async function sendOrderEmails(order: MailedOrder) {
  const shop = shopConfig();
  const lines = order.items.map((item) => `- ${itemLabel(item)}: ${formatInr(money(item.total))}`).join("\n");
  const visit = order.pickupNote ? `Visit note: ${order.pickupNote}\n` : "";
  const student = studentText(order);
  const amount = formatInr(money(order.total));
  const shared = `${order.orderNumber}\n${student ? `Student: ${student}\n` : ""}${lines}\nAmount due: ${amount}\n${visit}Pay when you collect the goods.`;

  if (order.customer.email) {
    const text = `Hello ${order.customer.name},\n\nWe received your order. The shop will prepare it before you arrive.\n\n${shared}\n\n${shop.name}\n${shop.address}\n${shop.phone}`;
    await sendMail(order.customer.email, `${shop.name}: order ${order.orderNumber}`, text, customerLetter(order, shop, amount));
  }

  const shopTo = process.env.SMTP_SHOP_TO;
  if (shopTo) {
    const text = `An online order is waiting to be prepared.\n\nCustomer: ${order.customer.name}\n${shared}\nPreparation required before customer arrival.\n\n${shop.name}\n${shop.address}\n${shop.phone}`;
    await sendMail(shopTo, `Prepare ${order.orderNumber} for ${order.customer.name}`, text, shopLetter(order, shop, amount));
  }
}

export async function sendPackedEmail(order: MailedOrder) {
  if (!order.customer.email) return;
  const shop = shopConfig();
  const amount = formatInr(money(order.total));
  const lines = order.items.map((item) => `- ${itemLabel(item)}: ${formatInr(money(item.total))}`).join("\n");
  const student = studentText(order);
  const visit = order.pickupNote ? `Visit note: ${order.pickupNote}\n` : "";
  const text = `Hello ${order.customer.name},\n\nYour order is packed. Pay when you collect it.\n\n${order.orderNumber}\n${student ? `Student: ${student}\n` : ""}${lines}\nAmount due: ${amount}\n${visit}\n${shop.name}\n${shop.address}\n${shop.phone}`;
  const html = customerLetter(
    { ...order, pickupNote: order.pickupNote },
    shop,
    amount,
  ).replace("Order Received", "Order Packed").replace(
    "We received your order. The shop will prepare it before you arrive.",
    "Your order is packed. Pay when you collect it.",
  );
  await sendMail(order.customer.email, `${shop.name}: ${order.orderNumber} is packed`, text, html);
}
