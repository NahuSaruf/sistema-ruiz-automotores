// ==== SINCRONIZACIÓN CON CCA (https://cca.com.ar/estadisticas/) ====
//
// El navegador no puede leer cca.com.ar directo: ese dominio no envía cabeceras
// CORS para otros orígenes, y aunque las enviara, esa página renderiza sus cifras
// vía JavaScript del lado del cliente (el HTML crudo no las contiene). Por eso el
// scraping real vive en el servidor: api/cca-stats.ts abre la página con un Chromium
// headless (Puppeteer), espera a que termine de pintar los números y los lee del DOM
// ya renderizado. Esta función sólo llama a ese endpoint propio (mismo origen, sin
// problema de CORS) y nunca simula un éxito: cualquier falla del proxy o del fetch
// devuelve un motivo específico, y el llamador decide si mostrar el último cacheado.

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

const CCA_PROXY_ENDPOINT = '/api/cca-stats';
const CCA_CACHE_KEY = 'cca_stats_cache';
// El proxy renderiza una página real con Chromium headless (más lento que un fetch
// simple): le damos más margen que a un pedido HTTP común.
const TIMEOUT_MS = 25000;

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

// Intenta sincronizar en vivo a través del proxy propio. Nunca lanza: si falla por
// cualquier motivo (timeout, proxy caído, CCA cambió de diseño) devuelve ok:false
// con un error explicativo, y el llamador decide si mostrar el último cacheado.
export const fetchCCAStats = async (): Promise<ResultadoSincronizacionCCA> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const respuesta = await fetch(CCA_PROXY_ENDPOINT, { signal: controller.signal });
    clearTimeout(timeoutId);

    const cuerpo = await respuesta.json().catch(() => null);

    if (!respuesta.ok || !cuerpo?.ok || !cuerpo?.datos) {
      return {
        ok: false,
        datos: null,
        error: cuerpo?.error || `El servicio de sincronización respondió con error (HTTP ${respuesta.status}).`,
      };
    }

    const datos = cuerpo.datos as CcaStats;
    guardarCacheCCA(datos);
    return { ok: true, datos };
  } catch (err) {
    clearTimeout(timeoutId);
    const fueTimeout = err instanceof DOMException && err.name === 'AbortError';
    return {
      ok: false,
      datos: null,
      error: fueTimeout
        ? 'Se agotó el tiempo de espera sincronizando con CCA (el renderizado en el servidor tardó demasiado).'
        : 'No se pudo contactar al servicio de sincronización con CCA.',
    };
  }
};
