"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeCategory, saveCategory, saveCategoryImage } from "@/actions/catalog";
import { CatalogImage } from "@/components/catalog-image";
import { ConfirmButton } from "@/components/confirm-button";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";

export function CategoryForm({
  category,
}: {
  category?: { id: string; name: string; description: string | null; imageUrl?: string | null };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await saveCategory(
      { name: formData.get("name"), description: formData.get("description") },
      category?.id,
    );
    if (!result.ok || !result.data) {
      setPending(false);
      setError(result.ok ? "Could not save the category." : result.message);
      toast.error(result.ok ? "Could not save the category." : result.message);
      return;
    }
    const image = formData.get("image");
    const removeImage = formData.get("removeImage") === "on";
    if (removeImage || (image instanceof File && image.size > 0)) {
      const imageData = new FormData();
      if (removeImage) imageData.set("removeImage", "true");
      else imageData.set("image", image as File);
      const uploaded = await saveCategoryImage(result.data.id, imageData);
      if (!uploaded.ok) {
        setPending(false);
        setError(uploaded.message);
        toast.error(uploaded.message);
        return;
      }
    }
    setPending(false);
    toast.success(result.message);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" size={category ? "sm" : "default"} variant={category ? "outline" : "default"} onClick={() => setOpen(true)}>
        {category ? "Edit" : "Add category"}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form action={onSubmit} className="grid w-full max-w-md gap-3 rounded-xl bg-card p-5">
            <h2 className="text-lg font-semibold">{category ? "Edit category" : "New category"}</h2>
            <div className="grid gap-1.5">
              <Label htmlFor={`name-${category?.id ?? "new"}`}>Name</Label>
              <Input id={`name-${category?.id ?? "new"}`} name="name" defaultValue={category?.name} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`description-${category?.id ?? "new"}`}>Description</Label>
              <Textarea id={`description-${category?.id ?? "new"}`} name="description" defaultValue={category?.description ?? ""} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`image-${category?.id ?? "new"}`}>Image</Label>
              {category?.imageUrl ? (
                <CatalogImage src={category.imageUrl} alt="" className="h-16 w-16 rounded-md" />
              ) : null}
              <Input id={`image-${category?.id ?? "new"}`} name="image" type="file" accept="image/jpeg,image/png,image/webp" />
              <p className="text-xs text-muted-foreground">JPG, PNG, or WebP, up to 2 MB.</p>
              {category?.imageUrl ? (
                <label className="flex items-center gap-2 text-sm">
                  <input name="removeImage" type="checkbox" />
                  Remove current image
                </label>
              ) : null}
            </div>
            <FieldError message={error} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={pending}>
                Save
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  return (
    <ConfirmButton
      label="Delete"
      title={`Delete ${name}?`}
      description="This is only allowed when no products use the category."
      confirmLabel="Delete category"
      onConfirm={() => removeCategory(id)}
    />
  );
}
