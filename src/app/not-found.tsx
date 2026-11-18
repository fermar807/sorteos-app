import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <SearchX className="h-10 w-10 text-slate-500" />
      <h1 className="text-3xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="max-w-md text-slate-600">
        La ruta solicitada no existe en Sorteos App.
      </p>
    </main>
  );
}