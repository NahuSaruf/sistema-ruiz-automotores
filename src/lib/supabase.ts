import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ClienteCartera,
  AdjudicadoSAP,
  GrupoInvitado,
  buscarClientePorConsulta as buscarClienteLocal,
  extraerMesDeFecha,
} from '../utils/excelParser';
import { CondicionesComerciales } from '../utils/condicionesComerciales';

export const TABLA_CARTERA = 'cartera_clientes';
export const TABLA_ADJUDICADOS = 'adjudicados';
export const TABLA_GRUPOS_INVITADOS = 'grupos_invitados';
export const TABLA_CONDICIONES = 'condiciones_comerciales';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// El cliente sólo se crea si las variables de entorno están configuradas
// (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY). Si faltan, `supabase` queda en
// null y toda la app sigue funcionando 100% con el respaldo en localStorage —
// nunca se rompe por falta de configuración de la nube.
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export const nubeConfigurada = supabase !== null;

// ==== AUTENTICACIÓN REAL DE ADMINISTRADOR (Supabase Auth) ====
//
// Reemplaza la vieja validación de texto plano ("ADMIN" tipeado en el login) por
// sesiones reales de Supabase Auth. El rol de Administrador de la agencia se
// resuelve del lado del servidor vía RLS (tabla `admins` + función `is_admin_ruiz()`,
// ver supabase/schema.sql) — este módulo sólo maneja el login/logout/sesión; quién
// puede efectivamente escribir en `cartera_clientes`/`adjudicados` lo decide Postgres,
// no este código de cliente.

export interface SesionAdmin {
  email: string;
}

const aSesionAdmin = (session: { user: { email?: string | null } } | null): SesionAdmin | null =>
  session ? { email: session.user.email || '' } : null;

export interface ResultadoLoginAdmin {
  ok: boolean;
  error?: string;
}

export const iniciarSesionAdmin = async (email: string, password: string): Promise<ResultadoLoginAdmin> => {
  if (!supabase) return { ok: false, error: 'La autenticación en la nube no está configurada.' };
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: 'No se pudo contactar al servicio de autenticación.' };
  }
};

export const cerrarSesionAdmin = async (): Promise<void> => {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch {
    // sin conexión u otro error de red: igual limpiamos el estado local en App.tsx
  }
};

export const obtenerSesionAdminActual = async (): Promise<SesionAdmin | null> => {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return aSesionAdmin(data.session);
  } catch {
    return null;
  }
};

// Notifica a `callback` en cada login/logout/refresh de token. Devuelve una función
// para desuscribirse (usarla en el cleanup de un useEffect).
export const suscribirseASesionAdmin = (callback: (sesion: SesionAdmin | null) => void): (() => void) => {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
    callback(aSesionAdmin(session));
  });
  return () => data.subscription.unsubscribe();
};

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

interface FilaGrupoInvitado {
  acto: string;
  grupo_orden: string;
  fecha_web: string;
  titular: string;
  porcentaje_financia: string;
  modelo: string;
  oferta_comercial: string;
  ultima_cuota: string;
  cuota_licitacion: string;
}

const aFilaGrupoInvitado = (g: GrupoInvitado): FilaGrupoInvitado => ({
  acto: g.acto,
  grupo_orden: g.grupoOrden,
  fecha_web: g.fechaWeb,
  titular: g.titular,
  porcentaje_financia: g.porcentajeFinancia,
  modelo: g.modelo,
  oferta_comercial: g.ofertaComercial,
  ultima_cuota: g.ultimaCuota,
  cuota_licitacion: g.cuotaLicitacion,
});

const aGrupoInvitado = (f: FilaGrupoInvitado): GrupoInvitado => ({
  acto: f.acto,
  grupoOrden: f.grupo_orden,
  fechaWeb: f.fecha_web,
  titular: f.titular,
  porcentajeFinancia: f.porcentaje_financia,
  modelo: f.modelo,
  ofertaComercial: f.oferta_comercial,
  ultimaCuota: f.ultima_cuota,
  cuotaLicitacion: f.cuota_licitacion,
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

// ==== GRUPOS INVITADOS A LICITAR ====

export const guardarGruposInvitadosEnNube = async (grupos: GrupoInvitado[]): Promise<boolean> => {
  if (!supabase || grupos.length === 0) return false;
  try {
    const { error } = await supabase
      .from(TABLA_GRUPOS_INVITADOS)
      .upsert(grupos.map(aFilaGrupoInvitado), { onConflict: 'acto,grupo_orden' });
    return !error;
  } catch {
    return false;
  }
};

export const obtenerGruposInvitadosDeNube = async (): Promise<GrupoInvitado[] | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from(TABLA_GRUPOS_INVITADOS).select('*');
    if (error || !data) return null;
    return (data as FilaGrupoInvitado[]).map(aGrupoInvitado);
  } catch {
    return null;
  }
};

// Usado por DashboardCliente.tsx para chequear en vivo si el grupo del cliente
// está habilitado para licitar, sin depender de que ya esté en el localStorage
// de ese dispositivo (por ejemplo, un cliente entrando desde un celular nuevo).
export const buscarGruposInvitadosPorGrupoEnNube = async (grupoOrden: string): Promise<GrupoInvitado[] | null> => {
  if (!supabase || !grupoOrden) return null;
  try {
    const { data, error } = await supabase
      .from(TABLA_GRUPOS_INVITADOS)
      .select('*')
      .eq('grupo_orden', grupoOrden);
    if (error || !data) return null;
    return (data as FilaGrupoInvitado[]).map(aGrupoInvitado);
  } catch {
    return null;
  }
};

// ==== CONDICIONES COMERCIALES (catálogo de precios/fichas técnicas — fila única) ====
//
// A diferencia de cartera_clientes/adjudicados (una fila por cliente), acá hay una
// única fila global (id=1) con todo el objeto CondicionesComerciales serializado en
// la columna `data` — es más simple que modelar una tabla por vehículo para un
// catálogo de 9 modelos que sólo edita el Administrador. Ver supabase/schema.sql:
// la escritura requiere sesión de Administrador (is_admin_ruiz()), la lectura queda
// abierta porque el Catálogo/Vitrina/Estado de Cuenta del cliente la necesitan sin
// estar autenticado.

export const guardarCondicionesEnNube = async (condiciones: CondicionesComerciales): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from(TABLA_CONDICIONES)
      .upsert({ id: 1, data: condiciones }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
};

export const obtenerCondicionesDeNube = async (): Promise<CondicionesComerciales | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLA_CONDICIONES)
      .select('data')
      .eq('id', 1)
      .maybeSingle();
    if (error || !data) return null;
    return data.data as CondicionesComerciales;
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
