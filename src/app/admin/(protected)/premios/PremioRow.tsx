"use client";

import { useState, useTransition } from "react";
import { updatePremio, deletePremio } from "./actions";
import { type Premio } from "@/types";

export default function PremioRow({
  premio,
  eventoId,
  puedeModificar,
  canje,
}: {
  premio: Premio;
  eventoId: string;
  puedeModificar: boolean;
  canje: {
    ganadorNombre: string;
    ganadorCorreo: string | null;
    casilla: number;
    fechaCanje: string;
  } | null;
}) {
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(premio.nombre);
  const [descripcion, setDescripcion] = useState(premio.descripcion ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.set("premio_id", premio.id);
    formData.set("evento_id", eventoId);
    formData.set("nombre", nombre);
    formData.set("descripcion", descripcion);

    startTransition(async () => {
      const result = await updatePremio(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  function handleDelete() {
    if (!confirm("¿Eliminar este premio?")) return;
    setError(null);
    const formData = new FormData();
    formData.set("premio_id", premio.id);
    formData.set("evento_id", eventoId);

    startTransition(async () => {
      const result = await deletePremio(formData);
      if (!result.ok) {
        setError(result.error);
      }
    });
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Nombre
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isPending}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Descripción (opcional)
            </label>
            <textarea
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

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || nombre.trim().length === 0}
              className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setNombre(premio.nombre);
                setDescripcion(premio.descripcion ?? "");
                setError(null);
              }}
              disabled={isPending}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {premio.nombre}
          </p>
          {premio.descripcion && (
            <p className="truncate text-xs text-slate-600">{premio.descripcion}</p>
          )}
        </div>

        <div className="shrink-0">
          {canje ? (
            <span className="inline-flex items-center rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Descubierto
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              Disponible
            </span>
          )}
        </div>
      </div>

      {canje && (
        <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-700 space-y-0.5">
          <p>
            <span className="font-medium">Ganador:</span> {canje.ganadorNombre}
            {canje.ganadorCorreo && (
              <span className="text-slate-500"> ({canje.ganadorCorreo})</span>
            )}
          </p>
          <p>
            <span className="font-medium">Casilla:</span> #{canje.casilla}
          </p>
          <p>
            <span className="font-medium">Fecha:</span>{" "}
            {new Date(canje.fechaCanje).toLocaleString("es-ES")}
          </p>
        </div>
      )}

      {puedeModificar && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            disabled={isPending}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
          >
            {isPending ? "..." : "Eliminar"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}