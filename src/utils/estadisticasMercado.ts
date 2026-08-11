// ==== ESTADÍSTICAS DE MERCADO NACIONAL (Fuente: CCA / PlaneroDeLey) ====
//
// Snapshot real relevado manualmente de https://cca.com.ar/estadisticas/ el 11/08/2026
// (la propia página marca sus datos como "actualizados al 5 de agosto de 2026"), usado
// como referencia mientras no haya una sincronización en vivo (ver src/services/ccaService.ts
// y api/cca-stats.ts). No son cifras inventadas: coinciden con lo que devuelve el proxy
// de sincronización cuando corre — van a quedar desactualizadas con el tiempo porque CCA
// actualiza sus números, así que conviene resincronizar cada tanto en vez de confiar
// indefinidamente en este archivo.
//
// El período mensual de la pestaña "Mercado Total" (evolucionConversion) es el único dato
// de esta lista que no viene del scraping automático — se cargó a mano porque esa serie
// mes a mes no forma parte de lo que api/cca-stats.ts lee hoy del DOM.

export interface ItemRanking {
  marca: string;
  valor: number; // unidades (Suscripciones/FC) o % (Conversión), según la vista
}

export interface VistaMetricaMercado {
  total: number;
  marcaLider: string;
  variacionMensual: number; // %
  promedioMensual: number | null; // no aplica a Conversión
  ranking: ItemRanking[]; // ordenado de mayor a menor valor
}

export interface PuntoEvolucion {
  mes: string;
  valor: number;
}

export interface EstadisticasMercadoNacional {
  periodo: string;
  fechaActualizacion: string;
  suscripciones: VistaMetricaMercado;
  facturacion: VistaMetricaMercado; // pestaña "FC" de CCA
  conversion: VistaMetricaMercado; // total, variación y ranking ya expresados en %
  mercadoTotal: {
    suscripciones: number;
    facturacion: number;
    conversionPromedio: number;
    evolucionConversion: PuntoEvolucion[];
  };
}

const MARCA_PROPIA = 'RENAULT';

export const ESTADISTICAS_MERCADO_DEFAULT: EstadisticasMercadoNacional = {
  periodo: 'Ene 2026 – Jul 2026',
  fechaActualizacion: '11/08/2026 (datos de CCA actualizados al 05/08/2026)',
  suscripciones: {
    total: 184881,
    marcaLider: 'FIAT',
    variacionMensual: 12.2,
    promedioMensual: 26412,
    ranking: [
      { marca: 'FIAT', valor: 34621 },
      { marca: 'TOYOTA', valor: 27699 },
      { marca: 'VOLKSWAGEN', valor: 22883 },
      { marca: 'PEUGEOT', valor: 22582 },
      { marca: 'RENAULT', valor: 22448 },
      { marca: 'CHEVROLET', valor: 18420 },
      { marca: 'CITROEN', valor: 13650 },
      { marca: 'FORD', valor: 13207 },
      { marca: 'NISSAN', valor: 4684 },
      { marca: 'JEEP', valor: 2739 },
      { marca: 'RAM', valor: 1809 },
      { marca: 'LEAPMOTOR', valor: 139 },
    ],
  },
  facturacion: {
    total: 69037,
    marcaLider: 'TOYOTA',
    variacionMensual: -14.2,
    promedioMensual: 9862,
    ranking: [
      { marca: 'TOYOTA', valor: 14071 },
      { marca: 'FIAT', valor: 13208 },
      { marca: 'PEUGEOT', valor: 10999 },
      { marca: 'VOLKSWAGEN', valor: 6324 },
      { marca: 'CHEVROLET', valor: 5546 },
      { marca: 'CITROEN', valor: 4677 },
      { marca: 'RENAULT', valor: 4344 },
      { marca: 'FORD', valor: 4321 },
      { marca: 'NISSAN', valor: 2536 },
      { marca: 'JEEP', valor: 2247 },
      { marca: 'RAM', valor: 764 },
      { marca: 'LEAPMOTOR', valor: 0 },
    ],
  },
  conversion: {
    total: 37.34,
    marcaLider: 'JEEP',
    variacionMensual: -28.0,
    promedioMensual: null,
    ranking: [
      { marca: 'JEEP', valor: 82.04 },
      { marca: 'NISSAN', valor: 54.14 },
      { marca: 'TOYOTA', valor: 50.8 },
      { marca: 'PEUGEOT', valor: 48.71 },
      { marca: 'RAM', valor: 42.23 },
      { marca: 'FIAT', valor: 38.15 },
      { marca: 'CITROEN', valor: 34.26 },
      { marca: 'FORD', valor: 32.72 },
      { marca: 'CHEVROLET', valor: 30.11 },
      { marca: 'VOLKSWAGEN', valor: 27.64 },
      { marca: 'RENAULT', valor: 19.35 },
      { marca: 'LEAPMOTOR', valor: 0 },
    ],
  },
  mercadoTotal: {
    suscripciones: 184881,
    facturacion: 69037,
    conversionPromedio: 37.34,
    evolucionConversion: [
      { mes: 'Ene', valor: 35.4 },
      { mes: 'Feb', valor: 36.4 },
      { mes: 'Mar', valor: 42.1 },
      { mes: 'Abr', valor: 37.0 },
      { mes: 'May', valor: 40.9 },
      { mes: 'Jun', valor: 40.2 },
      { mes: 'Jul', valor: 30.7 },
    ],
  },
};

// Posición (1-based) y datos de Renault dentro de un ranking dado (dinámico: sirve
// tanto para el dato de referencia como para un ranking recién sincronizado en vivo).
export const posicionMarcaPropia = (
  ranking: ItemRanking[]
): { posicion: number; datos: ItemRanking | undefined } => {
  const ordenado = [...ranking].sort((a, b) => b.valor - a.valor);
  const indice = ordenado.findIndex((m) => m.marca.toUpperCase() === MARCA_PROPIA);
  return { posicion: indice + 1, datos: ordenado[indice] };
};
