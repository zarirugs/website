import { redirect } from "next/navigation";
import { headers } from "next/headers";

import CategoryManager from "@/components/CategoryManager";
import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";

export const metadata = { title: "Category | ZARI Operations" };

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const requestHeaders = await headers();
  const admin = await getAuthenticatedAdmin(
    new Request("https://admin.zarirugs.com", { headers: { cookie: requestHeaders.get("cookie") ?? "" } }),
    await getDatabase(),
  );
  if (!admin) redirect("/login");
  const { id } = await params;
  return <CategoryManager categoryId={id} initialAdmin={admin} />;
}
