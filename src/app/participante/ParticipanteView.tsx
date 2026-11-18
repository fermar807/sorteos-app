"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { type SorteoData, type PremioDescubierto } from "@/types";
import CodigoForm from "@/components/shared/CodigoForm";

export default function ParticipanteView({ codigo }: { codigo: string | null }) {
  const router = useRouter();
  const codigoNormalizado = codigo ? codigo.trim().toUpperCase() : null;

  const [data, setData] = useState<SorteoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCasilla, setSelectedCasilla] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealedPremio, setRevealedPremio] = useState<{
    premio_nombre: string;
    premio_descripcion: string | null;
  } | null>(null);

  useEffect(() => {
    if (!codigoNormalizado) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setData(null);
      const supabase = createClient();
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "consultar_sorteo_por_codigo",
        { p_codigo: codigoNormalizado }
      );
      if (cancelled) return;
      if (rpcError) {
        setError(rpcError.message || "Error al consultar el sorteo.");
        setData(null);
      } else {
        setData(rpcData as SorteoData);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [codigoNormalizado]);

  async function handleCanjear(casilla: number) {
    if (!codigoNormalizado) return;
    setConfirming(false);
    setRevealing(true);
    const supabase = createClient();
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "canjear_premio",
      { p_codigo: codigoNormalizado, p_casilla: casilla }
    );
    if (rpcError) {
      setRevealing(false);
      setError(rpcError.message || "No se pudo canjear el premio.");
      refetch();
      return;
    }
    const result = rpcData as {
      casilla: number;
      premio_nombre: string;
      premio_descripcion: string | null;
      created_at: string;
    };
    setRevealedPremio({
      premio_nombre: result.premio_nombre,
      premio_descripcion: result.premio_descripcion,
    });
    setTimeout(() => {
      setRevealing(false);
      setRevealedPremio(null);
      refetch();
    }, 2200);
  }

  function refetch() {
    if (!codigoNormalizado) return;
    (async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "consultar_sorteo_por_codigo",
        { p_codigo: codigoNormalizado }
      );
      if (rpcError) setError(rpcError.message);
      else setData(rpcData as SorteoData);
      setLoading(false);
    })();
  }

  function handleChangeCodigo() {
    setData(null);
    setError(null);
    router.push("/participante");
  }

  // Sin código: mostrar formulario
  if (!codigoNormalizado) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-slate-900 text-center">
            Ingresa tu código
          </h1>
          <p className="text-sm text-slate-600 text-center">
            Introduce tu código individual de 9 caracteres.
          </p>
          <CodigoForm />
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Cargando sorteo...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={handleChangeCodigo}
          className="text-sm text-amber-600 hover:underline"
        >
          Ingresar otro código
        </button>
      </main>
    );
  }

  if (!data) return null;

  const miCanje = data.mi_canje;
  const casillasOcupadas = new Set(data.casillas_ocupadas);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {data.evento.nombre}
          </h1>
          {data.evento.descripcion && (
            <p className="text-sm text-slate-600">{data.evento.descripcion}</p>
          )}
          <p className="text-sm text-slate-500">
            Hola, <span className="font-medium text-slate-700">{data.participante.nombre}</span>
          </p>
          <button
            onClick={handleChangeCodigo}
            className="text-xs text-amber-600 hover:underline"
          >
            Cambiar código
          </button>
        </header>

        {/* Animación de revelación */}
        {revealing && revealedPremio && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="animate-bounce rounded-2xl bg-white p-8 text-center shadow-2xl">
              <div className="text-5xl mb-3">🎁</div>
              <p className="text-lg font-bold text-slate-900">
                ¡Has descubierto!
              </p>
              <p className="text-xl font-bold text-amber-600">
                {revealedPremio.premio_nombre}
              </p>
              {revealedPremio.premio_descripcion && (
                <p className="text-sm text-slate-600 mt-1">
                  {revealedPremio.premio_descripcion}
                </p>
              )}
            </div>
          </div>
        )}

        {miCanje === null ? (
          <section className="space-y-4">
            <p className="text-sm text-slate-600">
              Selecciona una casilla para descubrir tu premio.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {Array.from({ length: data.total_casillas }, (_, i) => i + 1).map(
                (n) => {
                  const ocupada = casillasOcupadas.has(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={ocupada || revealing}
                      onClick={() => {
                        setSelectedCasilla(n);
                        setConfirming(true);
                      }}
                      className={`flex h-20 items-center justify-center rounded-lg border text-lg font-bold transition ${
                        ocupada
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-amber-300 bg-white text-amber-700 hover:bg-amber-50 hover:scale-105"
                      }`}
                    >
                      {n}
                    </button>
                  );
                }
              )}
            </div>

            {confirming && selectedCasilla !== null && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
                <div className="rounded-xl bg-white p-6 shadow-xl max-w-sm w-full mx-4 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Confirmar selección
                  </h3>
                  <p className="text-sm text-slate-600">
                    ¿Confirmas elegir la casilla #{selectedCasilla}? Esta acción
                    no se puede deshacer.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setConfirming(false);
                        setSelectedCasilla(null);
                      }}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCanjear(selectedCasilla)}
                      className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : (
          <section className="space-y-4">
            <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center space-y-2">
              <div className="text-4xl">🎁</div>
              <h2 className="text-xl font-bold text-green-800">Tu premio</h2>
              <p className="text-2xl font-bold text-amber-600">
                {miCanje.premio_nombre}
              </p>
              {miCanje.premio_descripcion && (
                <p className="text-sm text-slate-600">
                  {miCanje.premio_descripcion}
                </p>
              )}
              <p className="text-xs text-slate-500">
                Casilla #{miCanje.casilla} ·{" "}
                {new Date(miCanje.created_at).toLocaleString("es-ES")}
              </p>
            </div>
            <p className="text-sm text-slate-500 text-center">
              Ya has descubierto tu premio. No puedes seleccionar otra casilla.
            </p>
          </section>
        )}

        {/* Tablero de premios descubiertos */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Premios descubiertos
            </h2>
            <button
              type="button"
              onClick={refetch}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline"
            >
              Actualizar
            </button>
          </div>
          {data.premios_descubiertos.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no se han descubierto premios.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.premios_descubiertos.map(
                (p: PremioDescubierto, idx: number) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm"
                  >
                    <span className="font-medium text-slate-900">
                      {p.premio_nombre}
                    </span>
                    <span className="text-xs text-slate-500">
                      Casilla #{p.casilla} ·{" "}
                      {new Date(p.created_at).toLocaleString("es-ES")}
                    </span>
                  </li>
                )
              )}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}