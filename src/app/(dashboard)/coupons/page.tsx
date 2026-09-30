import { format } from "date-fns";
import { CouponForm } from "@/components/coupons/coupon-form";
import { PageHeader } from "@/components/page-header";
import { AccessDenied, Badge, EmptyState } from "@/components/ui/feedback";
import { requirePermission } from "@/lib/auth/session";
import { listCoupons } from "@/lib/services/coupons";

function day(value: Date | null) {
  return value ? format(value, "yyyy-MM-dd") : "";
}

export default async function CouponsPage() {
  const user = await requirePermission("couponsManage");
  if (!user) return <AccessDenied />;
  const coupons = await listCoupons();

  return (
    <div>
      <PageHeader title="Coupons" description="A coupon takes a percentage off an order after each product or size discount.">
        <CouponForm />
      </PageHeader>
      {coupons.length === 0 ? (
        <EmptyState title="No coupons yet." description="Add a code such as SAVE10 for 10% off." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Off</th>
                <th className="px-4 py-3">Starts</th>
                <th className="px-4 py-3">Ends</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{coupon.code}</td>
                  <td className="px-4 py-3">{coupon.percent}%</td>
                  <td className="px-4 py-3">{coupon.startsAt ? format(coupon.startsAt, "d MMM yyyy") : "—"}</td>
                  <td className="px-4 py-3">{coupon.endsAt ? format(coupon.endsAt, "d MMM yyyy") : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={coupon.status === "ACTIVE" ? "green" : "slate"}>
                      {coupon.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <CouponForm
                      coupon={{
                        id: coupon.id,
                        code: coupon.code,
                        percent: coupon.percent,
                        status: coupon.status,
                        startsAt: day(coupon.startsAt),
                        endsAt: day(coupon.endsAt),
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
