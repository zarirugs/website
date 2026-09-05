import { Navbar } from "@/components/navigation";
import { CartPage } from "@/components/store";

export const metadata = { title: "Shopping bag" };

export default function Cart() {
  return <><Navbar /><CartPage /></>;
}
