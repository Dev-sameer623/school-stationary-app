"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginCustomerAction, signupCustomerAction } from "@/actions/customer-auth";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";
import type { ActionResult } from "@/types/action";

export function CustomerLoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginCustomerAction, undefined as ActionResult | undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required />
        <FieldError message={state?.ok === false ? state.fieldErrors?.email?.[0] : undefined} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        <FieldError message={state?.ok === false ? state.fieldErrors?.password?.[0] : undefined} />
      </div>
      {state?.ok === false ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Signing in..." : "Log in"}</Button>
      <p className="text-sm text-muted-foreground">
        New here? <Link className="text-primary" href={`/account/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
      </p>
    </form>
  );
}

export function CustomerSignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signupCustomerAction, undefined as ActionResult | undefined);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
        <FieldError message={state?.ok === false ? state.fieldErrors?.name?.[0] : undefined} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" required />
        <FieldError message={state?.ok === false ? state.fieldErrors?.phone?.[0] : undefined} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required />
        <FieldError message={state?.ok === false ? state.fieldErrors?.email?.[0] : undefined} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <FieldError message={state?.ok === false ? state.fieldErrors?.password?.[0] : undefined} />
      </div>
      {state?.ok === false ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "Creating account..." : "Sign up"}</Button>
      <p className="text-sm text-muted-foreground">
        Already registered? <Link className="text-primary" href={`/account/login?next=${encodeURIComponent(next)}`}>Log in</Link>
      </p>
    </form>
  );
}
