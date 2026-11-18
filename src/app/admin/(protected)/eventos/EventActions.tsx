"use client";

import { useState, useTransition } from "react";
import {
  activarEvento,
  desactivarEvento,
  reactivarEvento,
} from "./actions";

export default function EventActions({
  eventoId,
  estado,
  totalParticipantes,
  totalPremios,
}: {
  eventoId: string;
  estado: "borrador" | "activo" | "inactivo";
  totalParticipantes: number;
  totalPremios: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const puedeActivar =
    estado === "borrador" &&
    totalParticipantes > 0 &&
    totalParticipantes === totalPremios;

  function handleActivar() {
    if (
      !confirm(
        "Al activar el evento quedará definitivamente cerrado a modificaciones y se generarán los códigos de los participantes. ¿Continuar?"
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.set("evento_id", eventoId);
    startTransition(async () => {
      const result = await activarEvento(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess("Evento activado correctamente.");
      }
    });
  }

  function handleDesactivar() {
    if (!confirm("¿Desactivar este evento? Se bloqueará el acceso de participantes.")) {
      return;
    }
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.set("evento_id", eventoId);
    startTransition(async () => {
      const result = await desactivarEvento(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess("Evento desactivado.");
      }
    });
  }

  function handleReactivar() {
    if (!confirm("¿Reactivar este evento? Se conservarán participantes, premios y códigos.")) {
      return;
    }
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.set("evento_id", eventoId);
    startTransition(async () => {
      const result = await reactivarEvento(formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        setSuccess("Evento reactivado.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {estado === "borrador" && (
        <button
          type="button"
          onClick={handleActivar}
          disabled={isPending || !puedeActivar}
          title={
            !puedeActivar
              ? "Se requiere al menos un participante y la misma cantidad de premios"
              : undefined
          }
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
        >
          {isPending ? "Activando..." : "Activar evento"}
        </button>
      )}

      {estado === "activo" && (
        <button
          type="button"
          onClick={handleDesactivar}
          disabled={isPending}
          className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
        >
          {isPending ? "Desactivando..." : "Desactivar evento"}
        </button>
      )}

      {estado === "inactivo" && (
        <button
          type="button"
          onClick={handleReactivar}
          disabled={isPending}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
        >
          {isPending ? "Reactivando..." : "Reactivar evento"}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-green-600" role="status">
          {success}
        </p>
      )}
    </div>
  );
}