// Tipos compartidos de la aplicación.

export type EstadoEvento = "borrador" | "activo" | "inactivo";

export type Evento = {
  id: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoEvento;
  primera_activacion_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Participante = {
  id: string;
  evento_id: string;
  nombre: string;
  correo: string | null;
  codigo: string | null;
  created_at: string;
};

export type Premio = {
  id: string;
  evento_id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
};

export type PremioDescubierto = {
  casilla: number;
  premio_nombre: string;
  created_at: string;
};

export type MiCanje = {
  casilla: number;
  premio_nombre: string;
  premio_descripcion: string | null;
  created_at: string;
};

export type SorteoData = {
  evento: {
    id: string;
    nombre: string;
    descripcion: string | null;
    estado: string;
  };
  participante: {
    id: string;
    nombre: string;
  };
  total_casillas: number;
  casillas_ocupadas: number[];
  mi_canje: MiCanje | null;
  premios_descubiertos: PremioDescubierto[];
};