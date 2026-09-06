import { redirect } from "next/navigation";

export const metadata = {
  title: "ZARI Operations",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  redirect(process.env.NODE_ENV === "development" ? "http://localhost:3001/login" : "https://admin.zarirugs.com/login");
}
