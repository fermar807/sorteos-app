-- Sorteos App - Fase 3: Triggers y reglas de integridad de negocio
-- Protege las reglas de negocio de eventos, participantes y premios directamente en PostgreSQL.
-- No incluye RLS nuevo, permisos, funciones RPC ni datos de prueba.

-- ============================================================
-- Función: fn_eventos_proteger()
-- Trigger: trg_eventos_proteger (BEFORE INSERT OR UPDATE OR DELETE)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_eventos_proteger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_count_participantes integer;
  v_count_premios integer;
BEGIN
  -- ===== DELETE =====
  IF TG_OP = 'DELETE' THEN
    IF OLD.primera_activacion_at IS NOT NULL THEN
      RAISE EXCEPTION 'No se puede eliminar un evento que ya fue activado';
    END IF;
    RETURN OLD;
  END IF;

  -- ===== INSERT =====
  IF TG_OP = 'INSERT' THEN
    -- Forzar valores iniciales independientemente de lo enviado
    NEW.estado := 'borrador';
    NEW.primera_activacion_at := NULL;
    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- ===== UPDATE =====
  -- Validar estado: no NULL ni valor fuera de los permitidos
  -- (la columna tiene CHECK pero acepta NULL porque no fue declarada NOT NULL)
  IF NEW.estado IS NULL OR NEW.estado NOT IN ('borrador', 'activo', 'inactivo') THEN
    RAISE EXCEPTION 'El estado del evento debe ser borrador, activo o inactivo';
  END IF;

  -- Bloquear modificación de campos protegidos siempre
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'No se puede modificar el id del evento';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'No se puede modificar created_at';
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'No se puede modificar created_by';
  END IF;

  -- Evento ya activado: solo permite cambiar estado (activo/inactivo) y updated_at
  IF OLD.primera_activacion_at IS NOT NULL THEN
    IF NEW.nombre IS DISTINCT FROM OLD.nombre
       OR NEW.descripcion IS DISTINCT FROM OLD.descripcion
       OR NEW.primera_activacion_at IS DISTINCT FROM OLD.primera_activacion_at THEN
      RAISE EXCEPTION 'El evento ya fue activado y no permite modificaciones';
    END IF;
    IF NEW.estado NOT IN ('activo', 'inactivo') THEN
      RAISE EXCEPTION 'Un evento activado solo puede estar activo o inactivo';
    END IF;
    IF NEW.estado = 'borrador' THEN
      RAISE EXCEPTION 'Un evento activado no puede volver al estado borrador';
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- Evento nunca activado: impedir manipulación manual de primera_activacion_at
  IF NEW.primera_activacion_at IS NOT NULL
     AND NEW.primera_activacion_at IS DISTINCT FROM OLD.primera_activacion_at THEN
    IF NOT (NEW.estado = 'activo' AND OLD.estado = 'borrador') THEN
      RAISE EXCEPTION 'primera_activacion_at no puede manipularse manualmente';
    END IF;
  END IF;

  -- borrador -> inactivo: no permitido
  IF OLD.estado = 'borrador' AND NEW.estado = 'inactivo' THEN
    RAISE EXCEPTION 'No se puede desactivar un evento que nunca fue activado';
  END IF;

  -- Primera activación: borrador -> activo
  IF OLD.estado = 'borrador' AND NEW.estado = 'activo' THEN
    -- La fila del evento ya está bloqueada por el UPDATE que dispara el trigger
    SELECT count(*) INTO v_count_participantes
    FROM public.participantes WHERE evento_id = OLD.id;
    SELECT count(*) INTO v_count_premios
    FROM public.premios WHERE evento_id = OLD.id;

    IF v_count_participantes = 0 OR v_count_premios = 0 THEN
      RAISE EXCEPTION 'El evento debe tener al menos un participante y un premio para activarse';
    END IF;
    IF v_count_participantes <> v_count_premios THEN
      RAISE EXCEPTION 'La cantidad de participantes (%) debe ser igual a la cantidad de premios (%)',
        v_count_participantes, v_count_premios;
    END IF;

    NEW.primera_activacion_at := now();
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Función: fn_registros_evento_proteger()
-- Trigger: trg_participantes_proteger (BEFORE INSERT OR UPDATE OR DELETE) ON participantes
-- Trigger: trg_premios_proteger (BEFORE INSERT OR UPDATE OR DELETE) ON premios
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_registros_evento_proteger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_primera_activacion timestamptz;
BEGIN
  -- ===== DELETE =====
  IF TG_OP = 'DELETE' THEN
    -- Sincronización: bloquear la fila del evento
    PERFORM 1 FROM public.eventos WHERE id = OLD.evento_id FOR UPDATE;

    SELECT primera_activacion_at INTO v_primera_activacion
    FROM public.eventos WHERE id = OLD.evento_id;

    IF v_primera_activacion IS NOT NULL THEN
      RAISE EXCEPTION 'No se pueden modificar registros de un evento activado';
    END IF;
    RETURN OLD;
  END IF;

  -- ===== INSERT =====
  IF TG_OP = 'INSERT' THEN
    -- Sincronización: bloquear la fila del evento
    PERFORM 1 FROM public.eventos WHERE id = NEW.evento_id FOR UPDATE;

    SELECT primera_activacion_at INTO v_primera_activacion
    FROM public.eventos WHERE id = NEW.evento_id;

    IF v_primera_activacion IS NOT NULL THEN
      RAISE EXCEPTION 'No se pueden modificar registros de un evento activado';
    END IF;
    RETURN NEW;
  END IF;

  -- ===== UPDATE =====
  -- Proteger id y created_at
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'No se puede modificar el id';
  END IF;
  IF NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'No se puede modificar created_at';
  END IF;

  -- Impedir cambio de evento_id
  IF NEW.evento_id IS DISTINCT FROM OLD.evento_id THEN
    RAISE EXCEPTION 'No se puede cambiar el evento de un registro';
  END IF;

  -- Sincronización: bloquear y consultar una sola vez el evento correspondiente
  PERFORM 1 FROM public.eventos WHERE id = NEW.evento_id FOR UPDATE;

  SELECT primera_activacion_at INTO v_primera_activacion
  FROM public.eventos WHERE id = NEW.evento_id;

  IF v_primera_activacion IS NOT NULL THEN
    RAISE EXCEPTION 'No se pueden modificar registros de un evento activado';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- Triggers
-- ============================================================
CREATE TRIGGER trg_eventos_proteger
  BEFORE INSERT OR UPDATE OR DELETE ON public.eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_eventos_proteger();

CREATE TRIGGER trg_participantes_proteger
  BEFORE INSERT OR UPDATE OR DELETE ON public.participantes
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_registros_evento_proteger();

CREATE TRIGGER trg_premios_proteger
  BEFORE INSERT OR UPDATE OR DELETE ON public.premios
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_registros_evento_proteger();
