import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { type Evento, type Participante } from "@/types";
import EventoSelector from "./EventoSelector";
import ParticipanteForm from "./ParticipanteForm";
import ParticipanteRow from "./ParticipanteRow";
import ExportarCsvButton from "./ExportarCsvButton";

type SearchParams = { eventoId?: string };

type CanjeInfo = {
  id: string;
  participante_id: string;
  premio_id: string;
  casilla: number;
  fecha_canje: string;
};

export default async function ParticipantesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { eventoId } = await searchParams;
  const supabase = await createClient();

  const { data: eventosData, error: eventosError } = await supabase
    .from("eventos")
    .select("id, nombre, estado")
    .order("created_at", { ascending: false });

  if (eventosError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Participantes</h1>
        <p className="text-sm text-red-600">
          No se pudieron cargar los eventos. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  const eventos = (eventosData ?? []) as Pick<Evento, "id" | "nombre" | "estado">[];
  const selectedEvento = eventos.find((e) => e.id === eventoId) ?? null;

  let participantes: Participante[] = [];
  let totalPremios = 0;
  let canjes: CanjeInfo[] = [];
  const premioNombrePorId: Record<string, string> = {};
  let loadError: string | null = null;

  if (selectedEvento) {
    const [participantesRes, premiosRes, canjesRes, premiosNombresRes] =
      await Promise.all([
        supabase
          .from("participantes")
          .select("id, evento_id, nombre, correo, codigo, created_at")
          .eq("evento_id", selectedEvento.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("premios")
          .select("id", { count: "exact", head: true })
          .eq("evento_id", selectedEvento.id),
        supabase
          .from("canjes")
          .select("id, participante_id, premio_id, casilla, fecha_canje")
          .eq("evento_id", selectedEvento.id),
        supabase
          .from("premios")
          .select("id, nombre")
          .eq("evento_id", selectedEvento.id),
      ]);

    if (participantesRes.error) {
      loadError = "No se pudieron cargar los participantes.";
    } else {
      participantes = (participantesRes.data ?? []) as Participante[];
    }
    totalPremios = premiosRes.count ?? 0;
    canjes = (canjesRes.data ?? []) as CanjeInfo[];
    for (const p of premiosNombresRes.data ?? []) {
      premioNombrePorId[p.id] = p.nombre;
    }
  }

  const puedeModificar = selectedEvento?.estado === "borrador";

  // Mapa participante_id -> canje
  const canjePorParticipante = new Map<string, CanjeInfo>();
  for (const c of canjes) {
    canjePorParticipante.set(c.participante_id, c);
  }

  // Datos para exportación CSV
  const csvRows = participantes.map((p) => {
    const canje = canjePorParticipante.get(p.id);
    const premioNombre = canje
      ? premioNombrePorId[canje.premio_id] ?? "—"
      : "";
    return {
      nombre: p.nombre,
      correo: p.correo ?? "",
      codigo: p.codigo ?? "",
      estadoCanje: canje ? "Canjeado" : "Pendiente",
      premioGanado: premioNombre,
      casilla: canje ? String(canje.casilla) : "",
      fechaCanje: canje
        ? new Date(canje.fecha_canje).toLocaleString("es-ES")
        : "",
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Participantes</h1>
      </div>

      <EventoSelector eventos={eventos} selectedId={selectedEvento?.id ?? null} />

      {selectedEvento && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-medium text-slate-700">
              Evento: <span className="text-slate-900">{selectedEvento.nombre}</span>
            </span>
            {puedeModificar ? (
              <span className="text-sm text-slate-500">
                Participantes: {participantes.length} / Premios: {totalPremios}
              </span>
            ) : (
              <span className="text-sm text-slate-500">
                Canjeados: {canjes.length} / {totalPremios}
              </span>
            )}
            {!puedeModificar && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Evento cerrado a cambios
              </span>
            )}
            <div className="ml-auto">
              <ExportarCsvButton
                rows={csvRows}
                eventoNombre={selectedEvento.nombre}
              />
            </div>
          </div>

          <div className="text-sm">
            <Link
              href={`/admin/premios?eventoId=${selectedEvento.id}`}
              className="font-medium text-amber-600 hover:text-amber-700 hover:underline"
            >
              Gestionar premios
            </Link>
          </div>

          {!puedeModificar && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Este evento está en estado{" "}
              <strong>{selectedEvento.estado}</strong> y no permite modificar
              participantes.
            </div>
          )}

          {loadError && (
            <p className="text-sm text-red-600">{loadError}</p>
          )}

          {puedeModificar && (
            <ParticipanteForm eventoId={selectedEvento.id} />
          )}

          {participantes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-600">
                No hay participantes registrados en este evento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {participantes.map((p) => {
                const canje = canjePorParticipante.get(p.id);
                const premioNombre = canje
                  ? premioNombrePorId[canje.premio_id] ?? "—"
                  : null;
                return (
                  <ParticipanteRow
                    key={p.id}
                    participante={p}
                    eventoId={selectedEvento.id}
                    puedeModificar={puedeModificar}
                    canje={
                      canje
                        ? {
                            premioNombre,
                            casilla: canje.casilla,
                            fechaCanje: canje.fecha_canje,
                          }
                        : null
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {!selectedEvento && eventos.length > 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            Selecciona un evento para ver y gestionar sus participantes.
          </p>
        </div>
      )}

      {eventos.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            No hay eventos registrados. Crea uno primero en la sección de
            eventos.
          </p>
        </div>
      )}
    </div>
  );
}