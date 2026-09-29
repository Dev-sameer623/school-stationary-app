"use server";

import { revalidatePath } from "next/cache";
import { authorize } from "@/lib/auth/guard";
import { toErrorMessage } from "@/lib/errors";
import { importProductCsv, previewProductCsv } from "@/lib/services/csv";
import type { ActionResult } from "@/types/action";
import type { ProductCsvRow } from "@/lib/services/csv";

export async function previewImport(csv: string): Promise<ActionResult<ProductCsvRow[]>> {
  try {
    await authorize("csvImport");
    const rows = await previewProductCsv(csv);
    return { ok: true, data: rows };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}

export async function confirmImport(csv: string): Promise<ActionResult<{ count: number }>> {
  try {
    const user = await authorize("csvImport");
    const count = await importProductCsv(csv, user.id);
    revalidatePath("/products");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { ok: true, message: `Imported ${count} products.`, data: { count } };
  } catch (error) {
    return { ok: false, message: toErrorMessage(error) };
  }
}
