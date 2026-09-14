import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getAuthenticatedAdmin } from "@/lib/server/auth";
import { getDatabase } from "@/lib/server/database";

export default async function Home() {
  const database = await getDatabase();
  const requestHeaders = await headers();
  const admin = await getAuthenticatedAdmin(
    new Request("https://admin.zarirugs.com", { headers: { cookie: requestHeaders.get("cookie") ?? "" } }),
    database,
  );
  redirect(admin ? "/dashboard" : "/login");
}
