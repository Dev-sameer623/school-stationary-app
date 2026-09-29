"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { confirmImport, previewImport } from "@/actions/import";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/feedback";
import type { ProductCsvRow } from "@/lib/services/csv";

export function ImportForm() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState<ProductCsvRow[] | null>(null);
  const [pending, setPending] = useState(false);
  const invalid = rows?.some((row) => row.errors.length > 0) ?? false;

  async function preview(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setPending(true);
    const result = await previewImport(text);
    setPending(false);
    if (!result.ok || !result.data) {
      setRows(null);
      toast.error(result.ok ? "Could not read the file." : result.message);
      return;
    }
    setRows(result.data);
  }

  async function confirm() {
    setPending(true);
    const result = await confirmImport(csv);
    setPending(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.push("/products");
    router.refresh();
  }

  return (
    <div className="grid gap-4">
      <label className="grid gap-2 text-sm font-medium">
        Product CSV
        <input
          type="file"
          accept=".csv,text/csv"
          className="text-sm font-normal"
          onChange={(event) => preview(event.target.files?.[0])}
        />
      </label>
      <p className="text-sm text-muted-foreground">
        Columns: sku, name, description, price, stockQuantity, minimumStock, category
      </p>
      {rows ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Row</th>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Errors</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowNumber} className="border-b border-border">
                  <td className="px-3 py-2">{row.rowNumber}</td>
                  <td className="px-3 py-2">{row.sku}</td>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2">
                    <Badge tone={row.action === "invalid" ? "red" : row.action === "update" ? "amber" : "green"}>
                      {row.action}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-destructive">{row.errors.join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <Button type="button" disabled={!rows || invalid || pending} onClick={confirm}>
        Confirm import
      </Button>
    </div>
  );
}
