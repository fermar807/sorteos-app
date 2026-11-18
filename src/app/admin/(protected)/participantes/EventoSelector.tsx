"use client";

import { useRouter } from "next/navigation";
import { type Evento } from "@/types";

export default function EventoSelector({
  eventos,
  selectedId,
}: {
  eventos: Pick<Evento, "id" | "nombre" | "estado">[];
  selectedId: string | null;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor="evento-select"
        className="text-sm font-medium text-slate-700"
      >
        Evento:
      </label>
      <select
        id="evento-select"
        value={selectedId ?? ""}
        onChange={(e) => {
          const id = e.target.value;
          if (id) {
            router.push(`/admin/participantes?eventoId=${id}`);
          } else {
            router.push("/admin/participantes");
          }
        }}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      >
        <option value="">-- Selecciona un evento --</option>
        {eventos.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nombre} ({e.estado})
          </option>
        ))}
      </select>
    </div>
  );
}