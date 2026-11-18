import Link from "next/link";
import { Gift, Sparkles } from "lucide-react";
import CodigoForm from "@/components/shared/CodigoForm";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
          <Sparkles className="h-4 w-4" />
          Sorteos App
        </div>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Descubre tu premio
        </h1>
        <p className="max-w-xl text-base text-slate-600">
          Ingresa tu código individual para participar en el sorteo y descubrir
          tu premio.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <CodigoForm />
      </div>

      <div className="flex items-center gap-2 text-slate-400">
        <Gift className="h-4 w-4" />
        <Link
          href="/admin/login"
          className="text-xs hover:text-slate-600 hover:underline"
        >
          Acceso administrativo
        </Link>
      </div>
    </main>
  );
}