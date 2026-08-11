// ==== ESTADÍSTICAS DE MERCADO NACIONAL (Fuente: CCA / PlaneroDeLey) ====
//
// DATOS DE REFERENCIA — el sitio https://cca.com.ar/estadisticas/ renderiza sus
// cifras vía JavaScript (no expone una API pública ni JSON embebido en el HTML),
// así que estos valores son placeholders ilustrativos y NO datos reales de mercado.
// Reemplazá los campos de abajo con las cifras vigentes publicadas en esa página
// (o cargalas manualmente cada vez que el admin lo pida) antes de usar esto en producción.

export interface MetricaMarca {
  marca: string;
  suscripciones: number;
  cuotaMercado: number; // % de participación sobre el total del mercado
  variacion: number; // % vs. período anterior (puede ser negativo)
}

export interface EstadisticasMercadoNacional {
  periodoActual: string;
  periodoAnterior: string;
  totalSuscripciones: number;
  variacionTotalSuscripciones: number; // %
  promedioMensual: number;
  variacionPromedioMensual: number; // %
  rankingMarcas: MetricaMarca[]; // ordenado de mayor a menor cuota de mercado
  fechaActualizacion: string;
}

const MARCA_PROPIA = 'Renault';

export const ESTADISTICAS_MERCADO_DEFAULT: EstadisticasMercadoNacional = {
  periodoActual: 'Julio 2026',
  periodoAnterior: 'Junio 2026',
  totalSuscripciones: 38500,
  variacionTotalSuscripciones: 4.2,
  promedioMensual: 36800,
  variacionPromedioMensual: 2.1,
  rankingMarcas: [
    { marca: 'Volkswagen', suscripciones: 8200, cuotaMercado: 21.3, variacion: 3.5 },
    { marca: 'Renault', suscripciones: 7100, cuotaMercado: 18.4, variacion: 6.8 },
    { marca: 'Fiat', suscripciones: 6300, cuotaMercado: 16.4, variacion: -1.2 },
    { marca: 'Toyota', suscripciones: 5400, cuotaMercado: 14.0, variacion: 2.0 },
    { marca: 'Peugeot', suscripciones: 4100, cuotaMercado: 10.6, variacion: -3.4 },
  ],
  fechaActualizacion: 'Placeholder — actualizar con cifras reales de cca.com.ar/estadisticas/',
};

// Devuelve la posición (1-based) y los datos de la marca propia dentro del ranking.
export const posicionMarcaPropia = (
  estadisticas: EstadisticasMercadoNacional
): { posicion: number; datos: MetricaMarca | undefined } => {
  const ordenado = [...estadisticas.rankingMarcas].sort((a, b) => b.cuotaMercado - a.cuotaMercado);
  const indice = ordenado.findIndex((m) => m.marca === MARCA_PROPIA);
  return { posicion: indice + 1, datos: ordenado[indice] };
};
