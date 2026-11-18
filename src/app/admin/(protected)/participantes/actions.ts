"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ParticipanteResult =
  | { ok: true }
  | { ok: false; error: string };

function friendlyError(error: { code?: string; message?: string }): string {
  if (error.code === "P0001" && error.message) {
    // Excepción lanzada por un trigger (RAISE EXCEPTION)
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

export async function createParticipante(
  formData: FormData
): Promise<ParticipanteResult> {
  const eventoId = String(formData.get("evento_id") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const correoRaw = String(formData.get("correo") ?? "").trim();
  const correo = correoRaw.length > 0 ? correoRaw : null;

  if (!eventoId) {
    return { ok: false, error: "No se seleccionó un evento." };
  }
  if (nombre.length === 0) {
    return { ok: false, error: "El nombre del participante es obligatorio." };
  }

  const supabase = await createClient();
  const adminId = await getAdminId();
  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const { error } = await supabase.from("participantes").insert({
    evento_id: eventoId,
    nombre,
    correo,
  });

  if (error) {
    return { ok: false, error: friendlyError(error) };
  }

  revalidatePath(`/admin/participantes?eventoId=${eventoId}`);
  return { ok: true };
}

export async function updateParticipante(
  formData: FormData
): Promise<ParticipanteResult> {
  const participanteId = String(formData.get("participante_id") ?? "").trim();
  const eventoId = String(formData.get("evento_id") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const correoRaw = String(formData.get("correo") ?? "").trim();
  const correo = correoRaw.length > 0 ? correoRaw : null;

  if (!participanteId || !eventoId) {
    return { ok: false, error: "Datos incompletos." };
  }
  if (nombre.length === 0) {
    return { ok: false, error: "El nombre del participante es obligatorio." };
  }

  const supabase = await createClient();
  const adminId = await getAdminId();
  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const { error } = await supabase
    .from("participantes")
    .update({ nombre, correo })
    .eq("id", participanteId);

  if (error) {
    return { ok: false, error: friendlyError(error) };
  }

  revalidatePath(`/admin/participantes?eventoId=${eventoId}`);
  return { ok: true };
}

export async function deleteParticipante(
  formData: FormData
): Promise<ParticipanteResult> {
  const participanteId = String(formData.get("participante_id") ?? "").trim();
  const eventoId = String(formData.get("evento_id") ?? "").trim();

  if (!participanteId || !eventoId) {
    return { ok: false, error: "Datos incompletos." };
  }

  const supabase = await createClient();
  const adminId = await getAdminId();
  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const { error } = await supabase
    .from("participantes")
    .delete()
    .eq("id", participanteId);

  if (error) {
    return { ok: false, error: friendlyError(error) };
  }

  revalidatePath(`/admin/participantes?eventoId=${eventoId}`);
  return { ok: true };
}