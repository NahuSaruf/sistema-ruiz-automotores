import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ClienteCartera,
  AdjudicadoSAP,
  buscarClientePorConsulta as buscarClienteLocal,
  extraerMesDeFecha,
} from '../utils/excelParser';

export const TABLA_CARTERA = 'cartera_clientes';
export const TABLA_ADJUDICADOS = 'adjudicados';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// El cliente sólo se crea si las variables de entorno están configuradas
// (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY). Si faltan, `supabase` queda en
// null y toda la app sigue funcionando 100% con el respaldo en localStorage —
// nunca se rompe por falta de configuración de la nube.
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const nubeConfigurada = supabase !== null;

// ==== Mapeo fila de Supabase (snake_case) <-> tipos de la app (camelCase) ====

interface FilaCartera {
  grupo_orden: string;
  dni: string;
  nombre: string;
  telefono: string;
  estado: string;
}

const aFilaCartera = (c: ClienteCartera): FilaCartera => ({
  grupo_orden: c.grupoOrden,
  dni: c.dni,
  nombre: c.nombre,
  telefono: c.telefono,
  estado: c.estado,
});

const aClienteCartera = (f: FilaCartera): ClienteCartera => ({
  grupoOrden: f.grupo_orden,
  dni: f.dni,
  nombre: f.nombre,
  telefono: f.telefono,
  estado: f.estado,
});

interface FilaAdjudicado {
  grupo_orden: string;
  fecha_adjudicacion: string;
  modalidad_ganadora: string;
  modelo_suscripto: string;
  modelo_adjudicado: string;
  titular: string;
  domicilio: string;
  localidad: string;
  codigo_postal: string;
  provincia: string;
  estado_adjudicacion: string;
  codigo_pin: string;
  email: string;
}

const aFilaAdjudicado = (a: AdjudicadoSAP): FilaAdjudicado => ({
  grupo_orden: a.grupoOrden,
  fecha_adjudicacion: a.fechaAdjudicacion,
  modalidad_ganadora: a.modalidadGanadora,
  modelo_suscripto: a.modeloSuscripto,
  modelo_adjudicado: a.modeloAdjudicado,
  titular: a.titular,
  domicilio: a.domicilio,
  localidad: a.localidad,
  codigo_postal: a.codigoPostal,
  provincia: a.provincia,
  estado_adjudicacion: a.estadoAdjudicacion,
  codigo_pin: a.codigoPin,
  email: a.email,
});

const aAdjudicadoSAP = (f: FilaAdjudicado): AdjudicadoSAP => ({
  grupoOrden: f.grupo_orden,
  fechaAdjudicacion: f.fecha_adjudicacion,
  modalidadGanadora: f.modalidad_ganadora,
  modeloSuscripto: f.modelo_suscripto,
  modeloAdjudicado: f.modelo_adjudicado,
  titular: f.titular,
  domicilio: f.domicilio,
  localidad: f.localidad,
  codigoPostal: f.codigo_postal,
  provincia: f.provincia,
  estadoAdjudicacion: f.estado_adjudicacion,
  codigoPin: f.codigo_pin,
  email: f.email,
});

// ==== CARTERA DE CLIENTES ====

// Inserta y actualiza (upsert) por Grupo y Orden. Nunca lanza: si falla o no hay
// nube configurada, devuelve false y el llamador sigue con lo que ya guardó en
// localStorage.
export const guardarCarteraEnNube = async (clientes: ClienteCartera[]): Promise<boolean> => {
  if (!supabase || clientes.length === 0) return false;
  try {
    const { error } = await supabase
      .from(TABLA_CARTERA)
      .upsert(clientes.map(aFilaCartera), { onConflict: 'grupo_orden' });
    return !error;
  } catch {
    return false;
  }
};

export const obtenerCarteraDeNube = async (): Promise<ClienteCartera[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(TABLA_CARTERA).select('*');
    if (error || !data) return null;
    return (data as FilaCartera[]).map(aClienteCartera);
  } catch {
    return null;
  }
};

const buscarClienteEnNube = async (query: string): Promise<ClienteCartera | null> => {
  if (!supabase || !query) return null;
  try {
    const porDni = await supabase.from(TABLA_CARTERA).select('*').eq('dni', query).maybeSingle();
    if (!porDni.error && porDni.data) return aClienteCartera(porDni.data as FilaCartera);

    const porGrupo = await supabase.from(TABLA_CARTERA).select('*').eq('grupo_orden', query).maybeSingle();
    if (!porGrupo.error && porGrupo.data) return aClienteCartera(porGrupo.data as FilaCartera);

    return null;
  } catch {
    return null;
  }
};

// ==== ADJUDICADOS ====

export const guardarAdjudicadosEnNube = async (adjudicados: AdjudicadoSAP[]): Promise<boolean> => {
  if (!supabase || adjudicados.length === 0) return false;
  try {
    const { error } = await supabase
      .from(TABLA_ADJUDICADOS)
      .upsert(adjudicados.map(aFilaAdjudicado), { onConflict: 'grupo_orden' });
    return !error;
  } catch {
    return false;
  }
};

export const obtenerAdjudicadosDeNube = async (): Promise<AdjudicadoSAP[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(TABLA_ADJUDICADOS).select('*');
    if (error || !data) return null;
    return (data as FilaAdjudicado[]).map(aAdjudicadoSAP);
  } catch {
    return null;
  }
};

const buscarAdjudicadoEnNube = async (grupoOrden: string): Promise<AdjudicadoSAP | null> => {
  if (!supabase || !grupoOrden) return null;
  try {
    const { data, error } = await supabase
      .from(TABLA_ADJUDICADOS)
      .select('*')
      .eq('grupo_orden', grupoOrden)
      .maybeSingle();
    if (error || !data) return null;
    return aAdjudicadoSAP(data as FilaAdjudicado);
  } catch {
    return null;
  }
};

// ==== LOGIN / CONSULTA DEL CLIENTE (nube primero, localStorage como respaldo) ====

export interface ResultadoBusquedaCliente {
  cliente: ClienteCartera | null;
  origen: 'nube' | 'local';
}

// Usado por el login (App.tsx) y por cualquier pantalla que necesite resolver un
// DNI / Grupo y Orden. Intenta Supabase primero; si no hay nube configurada, si no
// hay conexión, o si la consulta falla por cualquier motivo, cae automáticamente
// al mismo lookup que ya funciona 100% local (buscarClientePorConsulta).
export const buscarClientePorConsultaConNube = async (query: string): Promise<ResultadoBusquedaCliente> => {
  const q = query.trim().toUpperCase();

  if (supabase && q) {
    try {
      const match = await buscarClienteEnNube(q);
      const ganador = await buscarAdjudicadoEnNube(match?.grupoOrden || q);

      if (match || ganador) {
        if (ganador) {
          const mes = extraerMesDeFecha(ganador.fechaAdjudicacion);
          const estado = mes
            ? `Adjudicado - Ganador Acto de ${mes}`
            : `Adjudicado - Ganador por ${ganador.modalidadGanadora || 'Acto'}`;

          return {
            cliente: {
              grupoOrden: match?.grupoOrden || ganador.grupoOrden,
              dni: match?.dni || '',
              nombre: match?.nombre || ganador.titular,
              telefono: match?.telefono || '3815000000',
              estado,
              mesAdjudicacion: mes,
            },
            origen: 'nube',
          };
        }
        return { cliente: match, origen: 'nube' };
      }
    } catch {
      // sin conexión a internet u otro error de red: seguimos al respaldo local
    }
  }

  return { cliente: buscarClienteLocal(query), origen: 'local' };
};
