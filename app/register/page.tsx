import { AuthForm } from "@/components/store";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}
