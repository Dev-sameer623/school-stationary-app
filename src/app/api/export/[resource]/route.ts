import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { exportCsv } from "@/lib/services/csv";
import { toErrorMessage } from "@/lib/errors";

const resources = ["products", "orders", "customers", "stock", "stock-transactions"] as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    return NextResponse.json({ message: "Please sign in." }, { status: 401 });
  }
  if (!can(session.user.role, "csvExport")) {
    return NextResponse.json({ message: "You do not have permission to export." }, { status: 403 });
  }

  const { resource } = await context.params;
  if (!resources.includes(resource as (typeof resources)[number])) {
    return NextResponse.json({ message: "Unknown export." }, { status: 404 });
  }

  try {
    const csv = await exportCsv(resource);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${resource}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: toErrorMessage(error) }, { status: 400 });
  }
}
