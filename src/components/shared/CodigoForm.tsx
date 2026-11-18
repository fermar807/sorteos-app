"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CodigoForm() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 9);
    setCodigo(val);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const c = codigo.trim().toUpperCase().replace(/\s/g, "");
    if (c.length !== 9) {
      setError("El código debe tener 9 caracteres.");
      return;
    }
    setError(null);
    router.push(`/participante?codigo=${c}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={codigo}
        onChange={handleChange}
        maxLength={9}
        placeholder="XXXXXXXXX"
        aria-label="Código de participante"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-widest text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="w-full rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
      >
        Ingresar al sorteo
      </button>
    </form>
  );
}