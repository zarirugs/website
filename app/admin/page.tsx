import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = {
  title: "ZARI Operations",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboard />;
}
