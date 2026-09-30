import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { AppError } from "@/lib/errors";

const MAX_BYTES = 2 * 1024 * 1024;
const EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function storeImage(file: File, folder: "products" | "categories") {
  if (!(file instanceof File) || file.size === 0) {
    throw new AppError("Choose an image.");
  }
  if (file.size > MAX_BYTES) {
    throw new AppError("Image must be 2 MB or smaller.");
  }
  const extension = EXTENSIONS.get(file.type);
  if (!extension) {
    throw new AppError("Use a JPG, PNG, or WebP image.");
  }

  const filename = `${randomUUID()}.${extension}`;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const blob = await put(`${folder}/${filename}`, file, {
      access: "public",
      contentType: file.type,
      token,
    });
    return blob.url;
  }

  const directory = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${filename}`;
}

export async function deleteStoredImage(imageUrl: string | null | undefined) {
  if (!imageUrl) return;
  if (imageUrl.includes("blob.vercel-storage.com")) {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return;
    await del(imageUrl, { token }).catch(() => undefined);
    return;
  }
  if (!imageUrl.startsWith("/uploads/")) return;
  const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
  const file = path.resolve(process.cwd(), "public", imageUrl.slice(1));
  if (!file.startsWith(`${uploadsRoot}${path.sep}`)) return;
  await unlink(file).catch(() => undefined);
}
