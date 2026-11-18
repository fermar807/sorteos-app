import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validar identidad con getClaims (no confiar en getSession en servidor)
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const { pathname } = request.nextUrl;

  // Proteger rutas administrativas (excepto login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!claims?.sub) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    // Verificar perfil administrativo activo
    const { data: profile } = await supabase
      .from("usuarios")
      .select("activo")
      .eq("id", claims.sub)
      .single();

    if (!profile?.activo) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }
  }

  // Redirigir administradores autenticados fuera de la página de login
  if (pathname === "/admin/login" && claims?.sub) {
    const { data: profile } = await supabase
      .from("usuarios")
      .select("activo")
      .eq("id", claims.sub)
      .single();

    if (profile?.activo) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/eventos";
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};