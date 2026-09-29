"use client";

import { useState } from "react";
import { toast } from "sonner";
import { changePassword, saveProfile } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";

export function SettingsForm({ name }: { name: string }) {
  const [profileError, setProfileError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();

  return (
    <div className="grid max-w-xl gap-6">
      <form
        className="grid gap-3 rounded-xl border border-border bg-card p-5"
        action={async (formData) => {
          const result = await saveProfile({ name: formData.get("name") });
          if (!result.ok) {
            setProfileError(result.message);
            toast.error(result.message);
            return;
          }
          setProfileError(undefined);
          toast.success(result.message);
        }}
      >
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="grid gap-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={name} required />
        </div>
        <FieldError message={profileError} />
        <Button type="submit">Save profile</Button>
      </form>
      <form
        className="grid gap-3 rounded-xl border border-border bg-card p-5"
        action={async (formData) => {
          const result = await changePassword({
            currentPassword: formData.get("currentPassword"),
            newPassword: formData.get("newPassword"),
            confirmPassword: formData.get("confirmPassword"),
          });
          if (!result.ok) {
            setPasswordError(result.message);
            toast.error(result.message);
            return;
          }
          setPasswordError(undefined);
          toast.success(result.message);
        }}
      >
        <h2 className="text-lg font-semibold">Password</h2>
        <div className="grid gap-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input id="currentPassword" name="currentPassword" type="password" required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" name="newPassword" type="password" minLength={8} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" required />
        </div>
        <FieldError message={passwordError} />
        <Button type="submit">Change password</Button>
      </form>
    </div>
  );
}
