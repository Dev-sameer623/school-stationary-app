"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { saveProduct, saveProductImage } from "@/actions/catalog";
import { CatalogImage } from "@/components/catalog-image";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/field";
import { productSchema } from "@/lib/validations";
import type { z } from "zod";

type CreateValues = z.infer<typeof productSchema>;

export function ProductForm({
  categories,
  product,
}: {
  categories: Array<{ id: string; name: string }>;
  product?: {
    id: string;
    sku: string;
    name: string;
    description: string | null;
    categoryId: string;
    kind: "STATIONERY" | "UNIFORM";
    price: number;
    minimumStock: number;
    status: "ACTIVE" | "INACTIVE";
    stockQuantity: number;
    imageUrl: string | null;
    sizes: Array<{
      id: string;
      size: string;
      price: number;
      stockQuantity: number;
      minimumStock: number;
    }>;
  };
}) {
  const router = useRouter();
  const [preview, setPreview] = useState(product?.imageUrl ?? "");
  const form = useForm<CreateValues>({
    resolver: zodResolver(productSchema) as Resolver<CreateValues>,
    defaultValues: {
      sku: product?.sku ?? "",
      name: product?.name ?? "",
      description: product?.description ?? "",
      categoryId: product?.categoryId ?? categories[0]?.id ?? "",
      kind: product?.kind ?? "STATIONERY",
      price: product?.price ?? 0,
      stockQuantity: product?.stockQuantity ?? 0,
      minimumStock: product?.minimumStock ?? 0,
      status: product?.status ?? "ACTIVE",
      sizes:
        product?.sizes.map((size) => ({
          id: size.id,
          size: size.size,
          price: size.price,
          stockQuantity: size.stockQuantity,
          minimumStock: size.minimumStock,
        })) ?? [],
    },
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const sizes = useFieldArray({ control: form.control, name: "sizes" });

  async function onSubmit(values: CreateValues) {
    const result = await saveProduct(values, product?.id);
    if (!result.ok || !result.data) {
      toast.error(result.ok ? "Could not save the product." : result.message);
      return;
    }
    const imageInput = document.getElementById("product-image") as HTMLInputElement | null;
    const file = imageInput?.files?.[0];
    const removeImage = (document.getElementById("remove-product-image") as HTMLInputElement | null)?.checked;
    if (removeImage || file) {
      const imageData = new FormData();
      if (removeImage) imageData.set("removeImage", "true");
      else if (file) imageData.set("image", file);
      const uploaded = await saveProductImage(result.data.id, imageData);
      if (!uploaded.ok) {
        toast.error(uploaded.message);
        router.push(`/products/${result.data.id}`);
        router.refresh();
        return;
      }
    }
    toast.success(result.message);
    router.push(`/products/${result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...form.register("sku")} />
          <FieldError message={form.formState.errors.sku?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register("name")} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...form.register("description")} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="product-image">Image</Label>
        {preview.startsWith("blob:") ? (
          // Local preview of a file that has not been saved yet.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-24 w-24 rounded-md object-cover" />
        ) : preview ? (
          <CatalogImage src={preview} alt="" className="h-24 w-24 rounded-md" />
        ) : null}
        <Input
          id="product-image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setPreview(file ? URL.createObjectURL(file) : product?.imageUrl ?? "");
          }}
        />
        <p className="text-xs text-muted-foreground">JPG, PNG, or WebP, up to 2 MB.</p>
        {product?.imageUrl ? (
          <label className="flex items-center gap-2 text-sm">
            <input id="remove-product-image" type="checkbox" />
            Remove current image
          </label>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="categoryId">Category</Label>
          <Select id="categoryId" {...form.register("categoryId")}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <FieldError message={form.formState.errors.categoryId?.message} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="kind">Kind</Label>
          <Select id="kind" {...form.register("kind")}>
            <option value="STATIONERY">Stationery</option>
            <option value="UNIFORM">Uniform</option>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" {...form.register("status")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </Select>
        </div>
      </div>
      {kind === "UNIFORM" ? (
        <div className="grid gap-3">
          <div>
            <p className="text-sm font-medium">Sizes</p>
            <p className="text-xs text-muted-foreground">Each size has its own price and stock. Existing stock is changed from the stock page.</p>
          </div>
          {sizes.fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[6rem_1fr_1fr_1fr_auto]">
              <input type="hidden" {...form.register(`sizes.${index}.id`)} />
              <div className="grid gap-1.5">
                <Label htmlFor={`size-${index}`}>Size</Label>
                <Input id={`size-${index}`} {...form.register(`sizes.${index}.size`)} placeholder="28" />
                <FieldError message={form.formState.errors.sizes?.[index]?.size?.message} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`size-price-${index}`}>Price (₹)</Label>
                <Input id={`size-price-${index}`} type="number" min="0" step="0.01" {...form.register(`sizes.${index}.price`)} />
                <FieldError message={form.formState.errors.sizes?.[index]?.price?.message} />
              </div>
              {field.id && product?.sizes.some((size) => size.id === form.getValues(`sizes.${index}.id`)) ? (
                <div className="grid gap-1.5">
                  <Label>Stock</Label>
                  <Input value={form.getValues(`sizes.${index}.stockQuantity`)} readOnly />
                </div>
              ) : (
                <div className="grid gap-1.5">
                  <Label htmlFor={`size-stock-${index}`}>Opening stock</Label>
                  <Input id={`size-stock-${index}`} type="number" min="0" step="1" {...form.register(`sizes.${index}.stockQuantity`)} />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor={`size-min-${index}`}>Minimum</Label>
                <Input id={`size-min-${index}`} type="number" min="0" step="1" {...form.register(`sizes.${index}.minimumStock`)} />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={() => sizes.remove(index)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => sizes.append({ id: "", size: "", price: 0, stockQuantity: 0, minimumStock: 0 })}
          >
            Add size
          </Button>
          <FieldError message={form.formState.errors.sizes?.message ?? form.formState.errors.sizes?.root?.message} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-1.5">
            <Label htmlFor="price">Price (₹)</Label>
            <Input id="price" type="number" min="0" step="0.01" {...form.register("price")} />
            <FieldError message={form.formState.errors.price?.message} />
          </div>
          {product ? (
            <div className="grid gap-1.5">
              <Label>Current stock</Label>
              <Input value={product.stockQuantity} readOnly />
              <p className="text-xs text-muted-foreground">Change stock from the stock page.</p>
            </div>
          ) : (
            <div className="grid gap-1.5">
              <Label htmlFor="stockQuantity">Opening stock</Label>
              <Input id="stockQuantity" type="number" min="0" step="1" {...form.register("stockQuantity")} />
              <FieldError message={form.formState.errors.stockQuantity?.message} />
            </div>
          )}
          <div className="grid gap-1.5">
            <Label htmlFor="minimumStock">Minimum stock</Label>
            <Input id="minimumStock" type="number" min="0" step="1" {...form.register("minimumStock")} />
            <FieldError message={form.formState.errors.minimumStock?.message} />
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {product ? "Save product" : "Add product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
