"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateEventoResult =
  | { ok: true }
  | { ok: false; error: string };

export type EventoEstadoResult =
  | { ok: true }
  | { ok: false; error: string };

const CODIGO_ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generarCodigo(existentes: Set<string>): string {
  let codigo = "";
  for (let i = 0; i < 9; i++) {
    codigo += CODIGO_ALFABETO[randomInt(0, CODIGO_ALFABETO.length)];
  }
  if (existentes.has(codigo)) {
    return generarCodigo(existentes);
  }
  return codigo;
}

function friendlyError(error: { code?: string; message?: string }): string {
  if (error.code === "P0001" && error.message) {
    return error.message;
  }
  if (error.code === "23505") {
    return "Ya existe un registro con esos datos.";
  }
  if (error.code === "23503") {
    return "El registro referenciado no existe.";
  }
  return "No se pudo completar la operación. Intenta de nuevo.";
}

async function getAdminId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;

  const { data: profile } = await supabase
    .from("usuarios")
    .select("activo")
    .eq("id", claims.sub)
    .single();

  if (!profile?.activo) return null;
  return claims.sub;
}

export async function createEvento(
  formData: FormData
): Promise<CreateEventoResult> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcionRaw = String(formData.get("descripcion") ?? "").trim();
  const descripcion = descripcionRaw.length > 0 ? descripcionRaw : null;

  if (nombre.length === 0) {
    return { ok: false, error: "El nombre del evento es obligatorio." };
  }

  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) {
    return { ok: false, error: "No hay una sesión válida." };
  }

  const { data: profile } = await supabase
    .from("usuarios")
    .select("activo")
    .eq("id", claims.sub)
    .single();

  if (!profile?.activo) {
    return { ok: false, error: "No autorizado para crear eventos." };
  }

  const { error } = await supabase.from("eventos").insert({
    nombre,
    descripcion,
    created_by: claims.sub,
  });

  if (error) {
    return {
      ok: false,
      error: "No se pudo crear el evento. Intenta de nuevo.",
    };
  }

  revalidatePath("/admin/eventos");
  return { ok: true };
}

export async function activarEvento(
  formData: FormData
): Promise<EventoEstadoResult> {
  const eventoId = String(formData.get("evento_id") ?? "").trim();

  if (!eventoId) {
    return { ok: false, error: "Evento no especificado." };
  }

  const supabase = await createClient();

  const adminId = await getAdminId();
  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  // Cargar evento
  const { data: evento, error: eventoError } = await supabase
    .from("eventos")
    .select("id, estado, primera_activacion_at")
    .eq("id", eventoId)
    .single();

  if (eventoError || !evento) {
    return { ok: false, error: "Evento no encontrado." };
  }

  if (evento.estado !== "borrador") {
    return { ok: false, error: "Solo se pueden activar eventos en borrador." };
  }
  if (evento.primera_activacion_at) {
    return { ok: false, error: "El evento ya fue activado anteriormente." };
  }

  // Validar cantidades
  const [{ count: countParticipantes }, { count: countPremios }] =
    await Promise.all([
      supabase
        .from("participantes")
        .select("id", { count: "exact", head: true })
        .eq("evento_id", eventoId),
      supabase
        .from("premios")
        .select("id", { count: "exact", head: true })
        .eq("evento_id", eventoId),
    ]);

  const totalParticipantes = countParticipantes ?? 0;
  const totalPremios = countPremios ?? 0;

  if (totalParticipantes === 0 || totalPremios === 0) {
    return {
      ok: false,
      error: "El evento debe tener al menos un participante y un premio.",
    };
  }
  if (totalParticipantes !== totalPremios) {
    return {
      ok: false,
      error: `La cantidad de participantes (${totalParticipantes}) debe ser igual a la de premios (${totalPremios}).`,
    };
  }

  // Generar códigos para participantes sin código
  const { data: participantes, error: partError } = await supabase
    .from("participantes")
    .select("id, codigo")
    .eq("evento_id", eventoId);

  if (partError) {
    return { ok: false, error: "No se pudieron cargar los participantes." };
  }

  const codigosExistentes = new Set(
    (participantes ?? []).map((p) => p.codigo).filter(Boolean) as string[]
  );

  for (const part of participantes ?? []) {
    if (part.codigo) continue;
    const codigo = generarCodigo(codigosExistentes);
    codigosExistentes.add(codigo);

    const { error: updateError } = await supabase
      .from("participantes")
      .update({ codigo })
      .eq("id", part.id);

    if (updateError) {
      return { ok: false, error: friendlyError(updateError) };
    }
  }

  // Cambiar estado a activo (el trigger valida y setea primera_activacion_at)
  const { error: estadoError } = await supabase
    .from("eventos")
    .update({ estado: "activo" })
    .eq("id", eventoId)
    .eq("estado", "borrador");

  if (estadoError) {
    return { ok: false, error: friendlyError(estadoError) };
  }

  revalidatePath("/admin/eventos");
  revalidatePath("/admin/participantes");
  return { ok: true };
}

export async function desactivarEvento(
  formData: FormData
): Promise<EventoEstadoResult> {
  const eventoId = String(formData.get("evento_id") ?? "").trim();

  if (!eventoId) {
    return { ok: false, error: "Evento no especificado." };
  }

  const supabase = await createClient();
  const adminId = await getAdminId();
  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("estado")
    .eq("id", eventoId)
    .single();

  if (!evento || evento.estado !== "activo") {
    return { ok: false, error: "Solo se pueden desactivar eventos activos." };
  }

  const { error } = await supabase
    .from("eventos")
    .update({ estado: "inactivo" })
    .eq("id", eventoId)
    .eq("estado", "activo");

  if (error) {
    return { ok: false, error: friendlyError(error) };
  }

  revalidatePath("/admin/eventos");
  return { ok: true };
}

export async function reactivarEvento(
  formData: FormData
): Promise<EventoEstadoResult> {
  const eventoId = String(formData.get("evento_id") ?? "").trim();

  if (!eventoId) {
    return { ok: false, error: "Evento no especificado." };
  }

  const supabase = await createClient();
  const adminId = await getAdminId();
  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const { data: evento } = await supabase
    .from("eventos")
    .select("estado, primera_activacion_at")
    .eq("id", eventoId)
    .single();

  if (!evento || evento.estado !== "inactivo") {
    return { ok: false, error: "Solo se pueden reactivar eventos inactivos." };
  }
  if (!evento.primera_activacion_at) {
    return { ok: false, error: "El evento nunca fue activado." };
  }

  const { error } = await supabase
    .from("eventos")
    .update({ estado: "activo" })
    .eq("id", eventoId)
    .eq("estado", "inactivo");

  if (error) {
    return { ok: false, error: friendlyError(error) };
  }

  revalidatePath("/admin/eventos");
  return { ok: true };
}