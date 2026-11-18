import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/layout/AdminNav";
import LogoutButton from "@/components/shared/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Validar identidad con getClaims (no confiar en getSession en servidor)
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims?.sub) {
    redirect("/admin/login");
  }

  // Validar perfil administrativo activo
  const { data: profile } = await supabase
    .from("usuarios")
    .select("activo")
    .eq("id", claims.sub)
    .single();

  if (!profile?.activo) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <span className="font-semibold text-slate-900">
            Panel administrativo
          </span>
          <AdminNav />
        </div>
        <LogoutButton />
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}