import AuthForm from "@/components/account/auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Alankara",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 flex items-start justify-center">
      <AuthForm mode="login" />
    </main>
  );
}
