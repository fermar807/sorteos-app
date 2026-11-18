"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PremioResult =
  | { ok: true }
  | { ok: false; error: string };

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

export async function createPremio(
  formData: FormData
): Promise<PremioResult> {
  const eventoId = String(formData.get("evento_id") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcionRaw = String(formData.get("descripcion") ?? "").trim();
  const descripcion = descripcionRaw.length > 0 ? descripcionRaw : null;

  if (!eventoId) {
    return { ok: false, error: "No se seleccionó un evento." };
  }
  if (nombre.length === 0) {
    return { ok: false, error: "El nombre del premio es obligatorio." };
  }

  const supabase = await createClient();
  const adminId = await getAdminId();
  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const { error } = await supabase.from("premios").insert({
    evento_id: eventoId,
    nombre,
    descripcion,
  });

  if (error) {
    return { ok: false, error: friendlyError(error) };
  }

  revalidatePath(`/admin/premios?eventoId=${eventoId}`);
  return { ok: true };
}

export async function updatePremio(
  formData: FormData
): Promise<PremioResult> {
  const premioId = String(formData.get("premio_id") ?? "").trim();
  const eventoId = String(formData.get("evento_id") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcionRaw = String(formData.get("descripcion") ?? "").trim();
  const descripcion = descripcionRaw.length > 0 ? descripcionRaw : null;

  if (!premioId || !eventoId) {
    return { ok: false, error: "Datos incompletos." };
  }
  if (nombre.length === 0) {
    return { ok: false, error: "El nombre del premio es obligatorio." };
  }

  const supabase = await createClient();
  const adminId = await getAdminId();
  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const { error } = await supabase
    .from("premios")
    .update({ nombre, descripcion })
    .eq("id", premioId);

  if (error) {
    return { ok: false, error: friendlyError(error) };
  }

  revalidatePath(`/admin/premios?eventoId=${eventoId}`);
  return { ok: true };
}

export async function deletePremio(
  formData: FormData
): Promise<PremioResult> {
  const premioId = String(formData.get("premio_id") ?? "").trim();
  const eventoId = String(formData.get("evento_id") ?? "").trim();

  if (!premioId || !eventoId) {
    return { ok: false, error: "Datos incompletos." };
  }

  const supabase = await createClient();
  const adminId = await getAdminId();
  if (!adminId) {
    return { ok: false, error: "No autorizado." };
  }

  const { error } = await supabase
    .from("premios")
    .delete()
    .eq("id", premioId);

  if (error) {
    return { ok: false, error: friendlyError(error) };
  }

  revalidatePath(`/admin/premios?eventoId=${eventoId}`);
  return { ok: true };
}