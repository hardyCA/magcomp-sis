import Link from "next/link";
import { SignUpForm } from "@/modules/auth/components/SignUpForm";

export default function RegistroPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <SignUpForm />
      <Link href="/" className="link link-neutral mt-6 text-sm">
        Volver al inicio
      </Link>
    </main>
  );
}
