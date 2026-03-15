import AuthForm from "@/components/account/auth-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Alankara",
};

export default function RegisterPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 flex items-start justify-center">
      <AuthForm mode="register" />
    </main>
  );
}
