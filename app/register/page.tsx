import { Suspense } from "react";
import { AuthForm } from "@/components/store";

export const metadata = { robots: { index: false, follow: false }, title: "Create account" };

export default function RegisterPage() {
  return <Suspense fallback={<p>Loading account form…</p>}><AuthForm mode="register" /></Suspense>;
}
