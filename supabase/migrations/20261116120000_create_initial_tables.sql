-- Sorteos App - Fase 1: estructura inicial de base de datos
-- Crea las cinco tablas base: usuarios, eventos, participantes, premios, canjes.
-- No incluye RLS, funciones, triggers ni datos de prueba.

-- ============================================================
-- Tabla: usuarios
-- Perfil administrativo vinculado a Supabase Auth (auth.users).
-- El administrador se pre-registra manualmente; no hay signup público.
-- ============================================================
CREATE TABLE public.usuarios (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    nombre text NOT NULL,
    activo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabla: eventos
-- Cabecera del sorteo. El estado inicial es 'borrador'.
-- primera_activacion_at distingue eventos nunca activados de los
-- que ya fueron activados y posteriormente desactivados.
-- ============================================================
CREATE TABLE public.eventos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre text NOT NULL,
    descripcion text,
    estado text NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'activo', 'inactivo')),
    primera_activacion_at timestamptz,
    created_by uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Tabla: participantes
-- Cada registro pertenece a un evento. Una misma persona puede
-- registrarse en varios eventos con registros y códigos distintos.
-- codigo es NULL hasta la primera activación del evento.
-- ============================================================
CREATE TABLE public.participantes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    correo text,
    codigo text UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_participantes_evento_id UNIQUE (evento_id, id)
);

-- ============================================================
-- Tabla: premios
-- Cada unidad de premio es un registro individual por evento.
-- ============================================================
CREATE TABLE public.premios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    descripcion text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_premios_evento_id UNIQUE (evento_id, id)
);

-- ============================================================
-- Tabla: canjes
-- Registro de la casilla seleccionada y el premio asignado.
-- Las FK compuestas garantizan que participante y premio pertenezcan
-- al mismo evento. Las restricciones UNIQUE impiden doble asignación.
-- ============================================================
CREATE TABLE public.canjes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id uuid NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    participante_id uuid NOT NULL,
    premio_id uuid NOT NULL,
    casilla integer NOT NULL CHECK (casilla > 0),
    fecha_canje timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT fk_canjes_participante_evento
        FOREIGN KEY (evento_id, participante_id)
        REFERENCES public.participantes(evento_id, id),
    CONSTRAINT fk_canjes_premio_evento
        FOREIGN KEY (evento_id, premio_id)
        REFERENCES public.premios(evento_id, id),
    CONSTRAINT uq_canjes_participante_evento UNIQUE (evento_id, participante_id),
    CONSTRAINT uq_canjes_premio_evento UNIQUE (evento_id, premio_id),
    CONSTRAINT uq_canjes_casilla_evento UNIQUE (evento_id, casilla)
);
