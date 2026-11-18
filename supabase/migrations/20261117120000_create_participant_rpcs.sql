-- Sorteos App - Fase: Funciones RPC para flujo del participante
-- Funciones públicas (SECURITY DEFINER) para consulta y canje de premios.
-- No modifica tablas ni triggers existentes.

-- ============================================================
-- Función: consultar_sorteo_por_codigo(p_codigo text)
-- Devuelve en JSONB los datos del sorteo, participante, casillas
-- ocupadas, canje propio y premios descubiertos (sin identidades).
-- ============================================================
CREATE OR REPLACE FUNCTION public.consultar_sorteo_por_codigo(p_codigo text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participante record;
  v_evento record;
  v_total_casillas integer;
  v_casillas_ocupadas integer[];
  v_mi_canje jsonb;
  v_premios_descubiertos jsonb;
BEGIN
  -- Buscar participante por código (normalizado)
  SELECT id, evento_id, nombre INTO v_participante
  FROM public.participantes
  WHERE codigo = UPPER(TRIM(p_codigo));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código inválido';
  END IF;

  -- Cargar evento asociado
  SELECT id, nombre, descripcion, estado INTO v_evento
  FROM public.eventos
  WHERE id = v_participante.evento_id;

  IF v_evento.estado = 'borrador' THEN
    RAISE EXCEPTION 'Este sorteo aún no ha iniciado';
  END IF;
  IF v_evento.estado = 'inactivo' THEN
    RAISE EXCEPTION 'Este sorteo se encuentra temporalmente inactivo';
  END IF;

  -- Total de casillas = cantidad de premios del evento
  SELECT count(*) INTO v_total_casillas
  FROM public.premios
  WHERE evento_id = v_evento.id;

  -- Casillas ya ocupadas
  SELECT COALESCE(array_agg(casilla ORDER BY casilla), ARRAY[]::integer[])
  INTO v_casillas_ocupadas
  FROM public.canjes
  WHERE evento_id = v_evento.id;

  -- Canje propio del participante (si existe)
  SELECT jsonb_build_object(
    'casilla', c.casilla,
    'premio_nombre', p.nombre,
    'premio_descripcion', p.descripcion,
    'created_at', c.fecha_canje
  )
  INTO v_mi_canje
  FROM public.canjes c
  JOIN public.premios p ON p.id = c.premio_id
  WHERE c.participante_id = v_participante.id
  LIMIT 1;

  IF NOT FOUND THEN
    v_mi_canje := NULL;
  END IF;

  -- Premios descubiertos (sin identidad de participantes)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'casilla', c.casilla,
      'premio_nombre', p.nombre,
      'created_at', c.fecha_canje
    ) ORDER BY c.fecha_canje DESC
  ), '[]'::jsonb)
  INTO v_premios_descubiertos
  FROM public.canjes c
  JOIN public.premios p ON p.id = c.premio_id
  WHERE c.evento_id = v_evento.id;

  RETURN jsonb_build_object(
    'evento', jsonb_build_object(
      'id', v_evento.id,
      'nombre', v_evento.nombre,
      'descripcion', v_evento.descripcion,
      'estado', v_evento.estado
    ),
    'participante', jsonb_build_object(
      'id', v_participante.id,
      'nombre', v_participante.nombre
    ),
    'total_casillas', v_total_casillas,
    'casillas_ocupadas', to_jsonb(v_casillas_ocupadas),
    'mi_canje', v_mi_canje,
    'premios_descubiertos', v_premios_descubiertos
  );
END;
$$;

-- ============================================================
-- Función: canjear_premio(p_codigo text, p_casilla integer)
-- Registra un canje de forma atómica: valida código, evento activo,
-- casilla válida y disponible, selecciona premio al azar y retorna
-- el premio asignado.
-- ============================================================
CREATE OR REPLACE FUNCTION public.canjear_premio(p_codigo text, p_casilla integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_participante record;
  v_evento record;
  v_total_premios integer;
  v_premio record;
  v_fecha_canje timestamptz;
BEGIN
  -- Buscar participante por código normalizado
  SELECT id, evento_id, nombre INTO v_participante
  FROM public.participantes
  WHERE codigo = UPPER(TRIM(p_codigo));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código inválido';
  END IF;

  -- Cargar evento
  SELECT id, estado INTO v_evento
  FROM public.eventos
  WHERE id = v_participante.evento_id;

  IF v_evento.estado = 'borrador' THEN
    RAISE EXCEPTION 'Este sorteo aún no ha iniciado';
  END IF;
  IF v_evento.estado = 'inactivo' THEN
    RAISE EXCEPTION 'Este sorteo se encuentra temporalmente inactivo';
  END IF;
  IF v_evento.estado <> 'activo' THEN
    RAISE EXCEPTION 'El evento no está activo';
  END IF;

  -- Validar casilla
  SELECT count(*) INTO v_total_premios
  FROM public.premios
  WHERE evento_id = v_evento.id;

  IF p_casilla < 1 OR p_casilla > v_total_premios THEN
    RAISE EXCEPTION 'Casilla inválida';
  END IF;

  -- Bloquear fila del participante
  PERFORM 1 FROM public.participantes WHERE id = v_participante.id FOR UPDATE;

  -- Verificar que no haya canje previo
  IF EXISTS (SELECT 1 FROM public.canjes WHERE participante_id = v_participante.id) THEN
    RAISE EXCEPTION 'Ya has descubierto un premio en este evento';
  END IF;

  -- Verificar que la casilla no esté ocupada
  IF EXISTS (SELECT 1 FROM public.canjes WHERE evento_id = v_evento.id AND casilla = p_casilla) THEN
    RAISE EXCEPTION 'Esta casilla ya fue elegida';
  END IF;

  -- Seleccionar premio disponible al azar
  SELECT id, nombre, descripcion INTO v_premio
  FROM public.premios
  WHERE evento_id = v_evento.id
    AND id NOT IN (SELECT premio_id FROM public.canjes WHERE evento_id = v_evento.id)
  ORDER BY random()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay premios disponibles';
  END IF;

  -- Insertar canje
  INSERT INTO public.canjes (evento_id, participante_id, premio_id, casilla, fecha_canje)
  VALUES (v_evento.id, v_participante.id, v_premio.id, p_casilla, now())
  RETURNING fecha_canje INTO v_fecha_canje;

  RETURN jsonb_build_object(
    'casilla', p_casilla,
    'premio_nombre', v_premio.nombre,
    'premio_descripcion', v_premio.descripcion,
    'created_at', v_fecha_canje
  );
END;
$$;

-- ============================================================
-- Permisos
-- ============================================================
GRANT EXECUTE ON FUNCTION public.consultar_sorteo_por_codigo(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.canjear_premio(text, integer) TO anon, authenticated;
