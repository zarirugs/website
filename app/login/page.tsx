import { Suspense } from "react";
import { AuthForm } from "@/components/store";

export const metadata = { robots: { index: false, follow: false }, title: "Sign in" };

export default function LoginPage() {
  return <Suspense fallback={<p>Loading sign in…</p>}><AuthForm mode="login" /></Suspense>;
}
