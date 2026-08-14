import Link from "next/link";
import { LoginForm } from "@/modules/auth/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registrado?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      {params.registrado ? (
        <div role="alert" className="alert alert-success mb-4 max-w-sm text-sm">
          <span>Cuenta creada. Revisa tu correo para confirmarla antes de ingresar.</span>
        </div>
      ) : null}

      <LoginForm next={params.next} />

      <Link href="/" className="link link-neutral mt-6 text-sm">
        Volver al inicio
      </Link>
    </main>
  );
}
