import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para uso en el navegador (Client Components).
 * La configuración de autenticación y consultas se implementará en etapas posteriores.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}