"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/feedback";

const colors = ["#1f3d32", "#8a6a3b", "#6b6256", "#9f2d2d"];

export function DashboardCharts({
  series,
  topProducts,
  stockStatus,
}: {
  series: Array<{ day: string; orders: number; sales: number }>;
  topProducts: Array<{ name: string; quantity: number }>;
  stockStatus: Array<{ name: string; value: number }>;
}) {
  const hasOrders = series.some((point) => point.orders > 0);
  const hasStock = stockStatus.some((slice) => slice.value > 0);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Orders by day">
        {hasOrders ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#1f3d32" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="No orders in the last 14 days." />
        )}
      </ChartCard>
      <ChartCard title="Sales by day">
        {hasOrders ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="sales" stroke="#0f766e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="No sales in the last 14 days." />
        )}
      </ChartCard>
      <ChartCard title="Top-selling products">
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="quantity" fill="#b45309" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="No completed or pending sales yet." />
        )}
      </ChartCard>
      <ChartCard title="Stock status">
        {hasStock ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stockStatus} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                {stockStatus.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Add products to see stock status." />
        )}
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">{label}</p>;
}
