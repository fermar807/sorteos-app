-- Sorteos App - Fase 2: RLS y políticas de acceso
-- Habilita RLS en las cinco tablas, crea la función auxiliar is_admin()
-- y define las políticas de acceso para el rol authenticated.
-- No incluye triggers ni funciones RPC de negocio.

-- ============================================================
-- 1. Habilitar Row Level Security en las cinco tablas
-- ============================================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canjes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Función auxiliar is_admin()
-- SECURITY DEFINER para evitar recursión al consultar usuarios (que tiene RLS).
-- search_path controlado y referencias explícitas al esquema public.
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = auth.uid()
      AND activo = true
  );
$$;

-- Permisos de ejecución de is_admin()
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================
-- 3. Revocar permisos directos (anon sin acceso; authenticated limitado)
-- ============================================================
REVOKE ALL ON public.usuarios FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.eventos FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.participantes FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.premios FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.canjes FROM PUBLIC, anon, authenticated;

-- authenticated: permisos de tabla necesarios para que RLS controle las operaciones
GRANT SELECT ON public.usuarios TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eventos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.participantes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.premios TO authenticated;
GRANT SELECT ON public.canjes TO authenticated;

-- anon: sin grants (sin acceso directo a ninguna tabla)

-- ============================================================
-- 4. Políticas RLS
-- ============================================================

-- ---------- usuarios ----------
-- SELECT solo sobre el propio registro
CREATE POLICY usuarios_select_own
  ON public.usuarios
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- No INSERT/UPDATE/DELETE desde la aplicación (no se crean políticas)

-- ---------- eventos ----------
CREATE POLICY eventos_admin_select
  ON public.eventos
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY eventos_admin_insert
  ON public.eventos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND created_by = auth.uid());

CREATE POLICY eventos_admin_update
  ON public.eventos
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY eventos_admin_delete
  ON public.eventos
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------- participantes ----------
CREATE POLICY participantes_admin_select
  ON public.participantes
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY participantes_admin_insert
  ON public.participantes
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY participantes_admin_update
  ON public.participantes
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY participantes_admin_delete
  ON public.participantes
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------- premios ----------
CREATE POLICY premios_admin_select
  ON public.premios
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY premios_admin_insert
  ON public.premios
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY premios_admin_update
  ON public.premios
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY premios_admin_delete
  ON public.premios
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------- canjes ----------
-- Solo SELECT para administrador. Sin INSERT/UPDATE/DELETE directos.
CREATE POLICY canjes_admin_select
  ON public.canjes
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
