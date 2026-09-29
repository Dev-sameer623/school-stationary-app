"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/guard";
import { toErrorMessage } from "@/lib/errors";
import { deleteStoredImage, storeImage } from "@/lib/images";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  setCategoryImage,
  setProductImage,
  updateCategory,
  updateProduct,
} from "@/lib/services/catalog";
import type { ActionResult } from "@/types/action";
import {
  categorySchema,
  fieldErrors,
  productSchema,
  productUpdateSchema,
} from "@/lib/validations";

function refreshCatalog() {
  revalidatePath("/products");
  revalidatePath("/categories");
  revalidatePath("/stock");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
}

export async function saveCategory(
  input: unknown,
  id?: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    await authorize("categoriesManage");
    const parsed = categorySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
    }
    const category = id
      ? await updateCategory(id, parsed.data)
      : await createCategory(parsed.data);
    refreshCatalog();
    return {
      ok: true,
      message: id ? "Category updated." : "Category added.",
      data: { id: category.id },
    };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

async function replaceImage(
  id: string,
  formData: FormData,
  folder: "products" | "categories",
  save: (id: string, imageUrl: string | null) => Promise<unknown>,
) {
  const file = formData.get("image");
  const remove = formData.get("removeImage") === "true";
  if (remove) {
    await save(id, null);
    return;
  }
  if (!(file instanceof File) || file.size === 0) return;
  const imageUrl = await storeImage(file, folder);
  try {
    await save(id, imageUrl);
  } catch (error) {
    await deleteStoredImage(imageUrl);
    throw error;
  }
}

export async function saveCategoryImage(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await authorize("categoriesManage");
    await replaceImage(id, formData, "categories", setCategoryImage);
    refreshCatalog();
    return { ok: true, message: "Category image saved." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function removeCategory(id: string): Promise<ActionResult> {
  try {
    await authorize("categoriesManage");
    await deleteCategory(id);
    refreshCatalog();
    return { ok: true, message: "Category deleted." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function saveProduct(input: unknown, id?: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await authorize("productsManage");
    if (id) {
      const parsed = productUpdateSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
      }
      const product = await updateProduct(id, parsed.data, user.id);
      refreshCatalog();
      return { ok: true, message: "Product updated.", data: { id: product.id } };
    }

    const parsed = productSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, message: "Check the form.", fieldErrors: fieldErrors(parsed.error) };
    }
    const product = await createProduct(parsed.data, user.id);
    refreshCatalog();
    return { ok: true, message: "Product added.", data: { id: product.id } };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function saveProductImage(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await authorize("productsManage");
    await replaceImage(id, formData, "products", setProductImage);
    refreshCatalog();
    revalidatePath(`/products/${id}`);
    return { ok: true, message: "Product image saved." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function removeProduct(id: string): Promise<ActionResult> {
  try {
    await authorize("productsManage");
    await deleteProduct(id);
    refreshCatalog();
    return { ok: true, message: "Product deleted." };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}
