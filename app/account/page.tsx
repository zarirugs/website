import { Navbar } from "@/components/navigation";
import { AccountPage } from "@/components/store";

export const metadata = { title: "Account" };

export default function Account() {
  return <><Navbar surface="solid" /><AccountPage /></>;
}
