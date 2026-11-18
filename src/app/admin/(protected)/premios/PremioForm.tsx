"use client";

import { useState, useTransition } from "react";
import { createPremio } from "./actions";

export default function PremioForm({ eventoId }: { eventoId: string }) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("evento_id", eventoId);
    formData.set("nombre", nombre);
    formData.set("descripcion", descripcion);

    startTransition(async () => {
      const result = await createPremio(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess(true);
        setNombre("");
        setDescripcion("");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">Nuevo premio</h2>

      <div className="space-y-2">
        <label
          htmlFor="premio-nombre"
          className="block text-sm font-medium text-slate-700"
        >
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          id="premio-nombre"
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={isPending}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="premio-descripcion"
          className="block text-sm font-medium text-slate-700"
        >
          Descripción (opcional)
        </label>
        <textarea
          id="premio-descripcion"
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          disabled={isPending}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-600" role="status">
          Premio registrado correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || nombre.trim().length === 0}
        className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
      >
        {isPending ? "Guardando..." : "Agregar premio"}
      </button>
    </form>
  );
}