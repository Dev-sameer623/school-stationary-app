"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/field";

export function UserForm({
  user,
}: {
  user?: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "MANAGER";
    status: "ACTIVE" | "INACTIVE";
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await saveUser(
      user
        ? {
            name: formData.get("name"),
            role: formData.get("role"),
            status: formData.get("status"),
            password: formData.get("password"),
          }
        : {
            name: formData.get("name"),
            email: formData.get("email"),
            role: formData.get("role"),
            password: formData.get("password"),
          },
      user?.id,
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
      <Button type="button" size={user ? "sm" : "default"} variant={user ? "outline" : "default"} onClick={() => setOpen(true)}>
        {user ? "Edit" : "Add user"}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form action={onSubmit} className="grid w-full max-w-md gap-3 rounded-xl bg-card p-5">
            <h2 className="text-lg font-semibold">{user ? "Edit user" : "New user"}</h2>
            <div className="grid gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={user?.name} required />
            </div>
            {user ? (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            ) : (
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" defaultValue={user?.role ?? "MANAGER"}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
              </Select>
            </div>
            {user ? (
              <div className="grid gap-1.5">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue={user.status}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </Select>
              </div>
            ) : null}
            <div className="grid gap-1.5">
              <Label htmlFor="password">{user ? "New password (optional)" : "Password"}</Label>
              <Input id="password" name="password" type="password" required={!user} minLength={user ? undefined : 8} />
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
