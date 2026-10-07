"use client";

import { useActionState } from "react";
import { sendContactMessage } from "@/actions/shop";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";
import type { ActionResult } from "@/types/action";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, undefined as ActionResult | undefined);
  return (
    <form action={action} className="grid max-w-lg gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
        <FieldError message={state?.ok === false ? state.fieldErrors?.name?.[0] : undefined} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
        <FieldError message={state?.ok === false ? state.fieldErrors?.email?.[0] : undefined} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required />
        <FieldError message={state?.ok === false ? state.fieldErrors?.message?.[0] : undefined} />
      </div>
      {state?.ok === false ? <p className="text-sm text-destructive">{state.message}</p> : null}
      {state?.ok ? <p className="text-sm text-primary">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Sending..." : "Send message"}</Button>
    </form>
  );
}
