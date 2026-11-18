import { createClient } from "@/lib/supabase/server";
import { type Evento, type Premio } from "@/types";
import EventoSelector from "./EventoSelector";
import PremioForm from "./PremioForm";
import PremioRow from "./PremioRow";
import Link from "next/link";

type SearchParams = { eventoId?: string };

export default async function PremiosPage({
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
        <h1 className="text-2xl font-bold text-slate-900">Premios</h1>
        <p className="text-sm text-red-600">
          No se pudieron cargar los eventos. Intenta de nuevo más tarde.
        </p>
      </div>
    );
  }

  const eventos = (eventosData ?? []) as Pick<Evento, "id" | "nombre" | "estado">[];
  const selectedEvento = eventos.find((e) => e.id === eventoId) ?? null;

  let premios: Premio[] = [];
  let totalParticipantes = 0;
  let canjes: { id: string; premio_id: string; participante_id: string; casilla: number; fecha_canje: string }[] = [];
  let participantePorId: Record<string, { nombre: string; correo: string | null }> = {};
  let loadError: string | null = null;

  if (selectedEvento) {
    const [premiosRes, participantesRes, canjesRes, participantesNombresRes] =
      await Promise.all([
        supabase
          .from("premios")
          .select("id, evento_id, nombre, descripcion, created_at")
          .eq("evento_id", selectedEvento.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("participantes")
          .select("id", { count: "exact", head: true })
          .eq("evento_id", selectedEvento.id),
        supabase
          .from("canjes")
          .select("id, premio_id, participante_id, casilla, fecha_canje")
          .eq("evento_id", selectedEvento.id),
        supabase
          .from("participantes")
          .select("id, nombre, correo")
          .eq("evento_id", selectedEvento.id),
      ]);

    if (premiosRes.error) {
      loadError = "No se pudieron cargar los premios.";
    } else {
      premios = (premiosRes.data ?? []) as Premio[];
    }
    totalParticipantes = participantesRes.count ?? 0;
    canjes = (canjesRes.data ?? []) as {
      id: string;
      premio_id: string;
      participante_id: string;
      casilla: number;
      fecha_canje: string;
    }[];
    for (const p of participantesNombresRes.data ?? []) {
      participantePorId[p.id] = { nombre: p.nombre, correo: p.correo };
    }
  }

  const puedeModificar = selectedEvento?.estado === "borrador";
  const totalPremios = premios.length;
  const faltantes = totalParticipantes - totalPremios;

  // Mapa premio_id -> canje
  const canjePorPremio = new Map<
    string,
    { ganadorNombre: string; ganadorCorreo: string | null; casilla: number; fechaCanje: string }
  >();
  for (const c of canjes) {
    const part = participantePorId[c.participante_id];
    canjePorPremio.set(c.premio_id, {
      ganadorNombre: part?.nombre ?? "—",
      ganadorCorreo: part?.correo ?? null,
      casilla: c.casilla,
      fechaCanje: c.fecha_canje,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Premios</h1>
      </div>

      <EventoSelector eventos={eventos} selectedId={selectedEvento?.id ?? null} />

      {selectedEvento && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm font-medium text-slate-700">
              Evento: <span className="text-slate-900">{selectedEvento.nombre}</span>
            </span>
            {puedeModificar ? (
              <>
                <span className="text-sm text-slate-500">
                  Premios: {totalPremios} / Participantes: {totalParticipantes}
                </span>
                {faltantes !== 0 && (
                  <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    {faltantes > 0
                      ? `Faltan ${faltantes} premio(s) para poder activar`
                      : `Hay ${Math.abs(faltantes)} premio(s) de más`}
                  </span>
                )}
                {faltantes === 0 && totalPremios > 0 && (
                  <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Cantidades iguales — listo para activar
                  </span>
                )}
              </>
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
          </div>

          <div className="text-sm">
            <Link
              href={`/admin/participantes?eventoId=${selectedEvento.id}`}
              className="font-medium text-amber-600 hover:text-amber-700 hover:underline"
            >
              Gestionar participantes
            </Link>
          </div>

          {!puedeModificar && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Este evento está en estado{" "}
              <strong>{selectedEvento.estado}</strong> y no permite modificar
              premios.
            </div>
          )}

          {loadError && (
            <p className="text-sm text-red-600">{loadError}</p>
          )}

          {puedeModificar && <PremioForm eventoId={selectedEvento.id} />}

          {premios.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-600">
                No hay premios registrados en este evento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {premios.map((p) => (
                <PremioRow
                  key={p.id}
                  premio={p}
                  eventoId={selectedEvento.id}
                  puedeModificar={puedeModificar}
                  canje={canjePorPremio.get(p.id) ?? null}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!selectedEvento && eventos.length > 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">
            Selecciona un evento para ver y gestionar sus premios.
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