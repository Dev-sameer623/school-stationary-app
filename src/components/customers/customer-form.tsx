"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { saveCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";

export function CustomerForm({
  customer,
}: {
  customer?: { id: string; name: string; phone: string | null; email: string | null; address: string | null };
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await saveCustomer(
      {
        name: formData.get("name"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        address: formData.get("address"),
      },
      customer?.id,
    );
    setPending(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    router.push(result.data ? `/customers/${result.data.id}` : "/customers");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="grid max-w-xl gap-4 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={customer?.name} required />
        <FieldError message={errors.name?.[0]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} />
          <FieldError message={errors.phone?.[0]} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} />
          <FieldError message={errors.email?.[0]} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" name="address" defaultValue={customer?.address ?? ""} />
      </div>
      <Button type="submit" disabled={pending}>
        {customer ? "Save customer" : "Add customer"}
      </Button>
    </form>
  );
}
