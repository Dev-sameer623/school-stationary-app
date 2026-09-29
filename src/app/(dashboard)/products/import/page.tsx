import { ImportForm } from "@/components/products/import-form";
import { AccessDenied } from "@/components/ui/feedback";
import { PageHeader } from "@/components/page-header";
import { requirePermission } from "@/lib/auth/session";

export default async function ImportPage() {
  const user = await requirePermission("csvImport");
  if (!user) return <AccessDenied />;

  return (
    <div>
      <PageHeader
        title="Import products"
        description="Upload a CSV, review the preview, then confirm. Invalid rows are not imported."
      />
      <ImportForm />
    </div>
  );
}
