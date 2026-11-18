import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { type Evento } from "@/types";
import EventForm from "./EventForm";
import EventActions from "./EventActions";

function EstadoBadge({ estado }: { estado: Evento["estado"] }) {
  const styles: Record<Evento["estado"], string> = {
    borrador: "bg-slate-100 text-slate-700 border-slate-300",
    activo: "bg-green-100 text-green-700 border-green-300",
    inactivo: "bg-amber-100 text-amber-700 border-amber-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}
    >
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}

export default async function EventosPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("eventos")
    .select("id, nombre, descripcion, estado, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Eventos</h1>
        <p className="text-sm text-red-600">
          No se pudieron cargar los eventos. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  const eventos = (data ?? []) as Pick<
    Evento,
    "id" | "nombre" | "descripcion" | "estado" | "created_at"
  >[];

  // Cargar conteos de participantes y premios por evento
  const conteos = await Promise.all(
    eventos.map(async (evento) => {
      const [{ count: cPart }, { count: cPrem }] = await Promise.all([
        supabase
          .from("participantes")
          .select("id", { count: "exact", head: true })
          .eq("evento_id", evento.id),
        supabase
          .from("premios")
          .select("id", { count: "exact", head: true })
          .eq("evento_id", evento.id),
      ]);
      return {
        id: evento.id,
        participantes: cPart ?? 0,
        premios: cPrem ?? 0,
      };
    })
  );
  const conteoMap = new Map(conteos.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Eventos</h1>
      </div>

      <EventForm />

      {eventos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            No hay eventos registrados todavía. Crea el primero con el formulario
            anterior.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {eventos.map((evento) => {
            const c = conteoMap.get(evento.id);
            const totalPart = c?.participantes ?? 0;
            const totalPrem = c?.premios ?? 0;
            return (
              <li
                key={evento.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <h2 className="truncate text-base font-semibold text-slate-900">
                      {evento.nombre}
                    </h2>
                    {evento.descripcion && (
                      <p className="text-sm text-slate-600">{evento.descripcion}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      Creado el{" "}
                      {new Date(evento.created_at).toLocaleString("es-ES")}
                    </p>
                    <p className="text-xs text-slate-500">
                      Participantes: {totalPart} / Premios: {totalPrem}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-1">
                      <Link
                        href={`/admin/participantes?eventoId=${evento.id}`}
                        className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        Gestionar participantes
                      </Link>
                      <Link
                        href={`/admin/premios?eventoId=${evento.id}`}
                        className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        Gestionar premios
                      </Link>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <EstadoBadge estado={evento.estado} />
                    <EventActions
                      eventoId={evento.id}
                      estado={evento.estado}
                      totalParticipantes={totalPart}
                      totalPremios={totalPrem}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}