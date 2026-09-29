import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth/session";

export default async function NewCustomerPage() {
  await requireUser();
  return (
    <div>
      <PageHeader title="Add customer" />
      <CustomerForm />
    </div>
  );
}
