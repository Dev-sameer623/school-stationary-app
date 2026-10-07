import { CustomerSignupForm } from "@/components/shop/auth-forms";
import { safeNext } from "@/lib/customer-auth/redirect";

export default async function CustomerSignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : "/");
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-serif text-4xl">Sign up</h1>
      <p className="mb-6 text-sm text-muted-foreground">Create an account before adding anything to the cart. Your session lasts 24 hours.</p>
      <CustomerSignupForm next={next} />
    </div>
  );
}
