import { redirect } from "next/navigation";
import { headers } from "next/headers";

import OperationsDashboard from "@/components/OperationsDashboard";
import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";

export const metadata = { title: "Operations | ZARI" };

export default async function DashboardPage() {
  const requestHeaders = await headers();
  const admin = await getAuthenticatedAdmin(
    new Request("https://admin.zarirugs.com", { headers: { cookie: requestHeaders.get("cookie") ?? "" } }),
    await getDatabase(),
  );
  if (!admin) redirect("/login");
  return <OperationsDashboard initialAdmin={admin} />;
}
