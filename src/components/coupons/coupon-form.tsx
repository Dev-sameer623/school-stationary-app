"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCoupon } from "@/actions/coupons";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/field";

export function CouponForm({
  coupon,
}: {
  coupon?: {
    id: string;
    code: string;
    percent: number;
    status: "ACTIVE" | "INACTIVE";
    startsAt: string;
    endsAt: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await saveCoupon(
      {
        code: formData.get("code"),
        percent: formData.get("percent"),
        status: formData.get("status"),
        startsAt: formData.get("startsAt"),
        endsAt: formData.get("endsAt"),
      },
      coupon?.id,
    );
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" size={coupon ? "sm" : "default"} variant={coupon ? "outline" : "default"} onClick={() => setOpen(true)}>
        {coupon ? "Edit" : "Add coupon"}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form action={onSubmit} className="grid w-full max-w-md gap-3 rounded-xl bg-card p-5">
            <h2 className="text-lg font-semibold">{coupon ? "Edit coupon" : "New coupon"}</h2>
            <div className="grid gap-1.5">
              <Label htmlFor={`code-${coupon?.id ?? "new"}`}>Code</Label>
              <Input id={`code-${coupon?.id ?? "new"}`} name="code" defaultValue={coupon?.code} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`percent-${coupon?.id ?? "new"}`}>Percentage off</Label>
              <Input id={`percent-${coupon?.id ?? "new"}`} name="percent" type="number" min="1" max="100" step="1" defaultValue={coupon?.percent ?? 10} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`status-${coupon?.id ?? "new"}`}>Status</Label>
              <Select id={`status-${coupon?.id ?? "new"}`} name="status" defaultValue={coupon?.status ?? "ACTIVE"}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor={`starts-${coupon?.id ?? "new"}`}>Starts</Label>
                <Input id={`starts-${coupon?.id ?? "new"}`} name="startsAt" type="date" defaultValue={coupon?.startsAt ?? ""} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`ends-${coupon?.id ?? "new"}`}>Ends</Label>
                <Input id={`ends-${coupon?.id ?? "new"}`} name="endsAt" type="date" defaultValue={coupon?.endsAt ?? ""} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Leave the dates empty if the coupon has no start or end.</p>
            {error ? <FieldError message={error} /> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
