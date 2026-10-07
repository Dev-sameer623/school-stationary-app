import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { ACCESS_MAX_AGE } from "@/lib/customer-auth/constants";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set.");
  return value;
}

function base64url(value: string) {
  return Buffer.from(value).toString("base64url");
}

export function signAccessToken(payload: { sub: string; sid: string }) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(
    JSON.stringify({
      sub: payload.sub,
      sid: payload.sid,
      exp: Math.floor(Date.now() / 1000) + ACCESS_MAX_AGE,
    }),
  );
  const data = `${header}.${body}`;
  const signature = createHmac("sha256", secret()).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyAccessToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = createHmac("sha256", secret()).update(`${header}.${body}`).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const json = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      sub?: unknown;
      sid?: unknown;
      exp?: unknown;
    };
    if (typeof json.sub !== "string" || typeof json.sid !== "string" || typeof json.exp !== "number") return null;
    if (json.exp < Date.now() / 1000) return null;
    return { sub: json.sub, sid: json.sid };
  } catch {
    return null;
  }
}

export function newRefreshToken() {
  return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
