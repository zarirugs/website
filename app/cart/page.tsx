import { Navbar } from "@/components/navigation";
import { CartPage } from "@/components/store";

export const metadata = { robots: { index: false, follow: false }, title: "Shopping bag" };

export default function Cart() {
  return <><Navbar surface="solid" /><CartPage /></>;
}
