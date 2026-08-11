// ==== SINCRONIZACIÓN CON CCA (https://cca.com.ar/estadisticas/) ====
//
// Intenta leer en vivo el Total de Suscripciones, la Variación Mensual y la
// Cuota de Renault desde el HTML público de cca.com.ar. Esto es un intento
// honesto, no garantizado: el dominio probablemente no envía cabeceras CORS
// habilitando este origen (el fetch fallará directo desde el navegador), y
// aunque respondiera, esa página renderiza sus cifras vía JavaScript del lado
// del cliente — el HTML crudo que devuelve fetch() no las contiene. Por eso
// cada fallo devuelve un motivo específico en vez de simular un éxito.

export interface CcaStats {
  totalSuscripciones: number;
  variacionMensual: number; // %
  cuotaRenault: number; // %
  fechaSincronizacion: string; // ISO
}

export interface ResultadoSincronizacionCCA {
  ok: boolean;
  datos: CcaStats | null;
  error?: string;
}

const CCA_URL = 'https://cca.com.ar/estadisticas/';
const CCA_CACHE_KEY = 'cca_stats_cache';
const TIMEOUT_MS = 8000;

const REGEX_TOTAL = /([\d.,]{4,})\s*(?:suscripciones|subscripciones)/i;
const REGEX_VARIACION = /variaci[oó]n[^%+\-\d]{0,20}([+-]?[\d.,]+)\s*%/i;
const REGEX_RENAULT = /Renault[^%\d]{0,40}([\d.,]+)\s*%/i;

const numeroDesdeTexto = (texto: string): number =>
  Number(texto.replace(/\./g, '').replace(',', '.'));

export const cargarCacheCCA = (): CcaStats | null => {
  try {
    const guardado = localStorage.getItem(CCA_CACHE_KEY);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
};

const guardarCacheCCA = (datos: CcaStats): void => {
  localStorage.setItem(CCA_CACHE_KEY, JSON.stringify(datos));
};

// Intenta sincronizar en vivo. Nunca lanza: si falla por cualquier motivo
// (CORS, timeout, datos no encontrados en el HTML) devuelve ok:false con un
// error explicativo, y el llamador decide si mostrar el último dato cacheado.
export const fetchCCAStats = async (): Promise<ResultadoSincronizacionCCA> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const respuesta = await fetch(CCA_URL, { mode: 'cors', signal: controller.signal });
    clearTimeout(timeoutId);

    if (!respuesta.ok) {
      return { ok: false, datos: null, error: `cca.com.ar respondió con error (HTTP ${respuesta.status}).` };
    }

    const html = await respuesta.text();
    const totalMatch = html.match(REGEX_TOTAL);
    const variacionMatch = html.match(REGEX_VARIACION);
    const renaultMatch = html.match(REGEX_RENAULT);

    if (!totalMatch || !variacionMatch || !renaultMatch) {
      return {
        ok: false,
        datos: null,
        error: 'cca.com.ar renderiza estas cifras vía JavaScript del lado del cliente: el HTML estático recibido no las contiene, así que no se pueden leer con un fetch simple.',
      };
    }

    const datos: CcaStats = {
      totalSuscripciones: numeroDesdeTexto(totalMatch[1]),
      variacionMensual: numeroDesdeTexto(variacionMatch[1]),
      cuotaRenault: numeroDesdeTexto(renaultMatch[1]),
      fechaSincronizacion: new Date().toISOString(),
    };

    guardarCacheCCA(datos);
    return { ok: true, datos };
  } catch (err) {
    clearTimeout(timeoutId);
    const fueTimeout = err instanceof DOMException && err.name === 'AbortError';
    return {
      ok: false,
      datos: null,
      error: fueTimeout
        ? 'Se agotó el tiempo de espera al contactar cca.com.ar.'
        : 'No se pudo conectar con cca.com.ar (probablemente bloqueado por CORS, ya que el sitio no expone una API pública pensada para consumirse desde otro dominio).',
    };
  }
};
