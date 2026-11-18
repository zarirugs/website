import type { Metadata } from "next";
import { Navbar } from "@/components/navigation";
import { OrderEnquiry } from "@/components/sections";

export const metadata: Metadata = {
  title: "Review your order request",
  robots: { index: false, follow: false },
};

export default function OrderRequestPage() {
  return (
    <>
      <Navbar surface="solid" />
      <main className="min-h-screen bg-neutral-950 pt-24 md:pt-32">
        <OrderEnquiry source="bag" />
      </main>
    </>
  );
}
