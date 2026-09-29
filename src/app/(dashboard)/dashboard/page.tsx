import { DashboardCharts } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/feedback";
import { requireUser } from "@/lib/auth/session";
import { getDashboard } from "@/lib/services/dashboard";

export default async function DashboardPage() {
  await requireUser();
  const data = await getDashboard();
  const cards = [
    ["Total Products", data.totalProducts],
    ["Total Stock Items", data.totalStockItems],
    ["Low Stock Products", data.lowStock],
    ["Total Orders", data.totalOrders],
    ["Today's Orders", data.todaysOrders],
    ["Total Customers", data.totalCustomers],
  ] as const;

  return (
    <div>
      <PageHeader title="Dashboard" description="A snapshot of products, stock, and recent sales." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <DashboardCharts series={data.series} topProducts={data.topProducts} stockStatus={data.stockStatus} />
    </div>
  );
}
