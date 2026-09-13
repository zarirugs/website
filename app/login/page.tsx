import { AuthForm } from "@/components/store";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
