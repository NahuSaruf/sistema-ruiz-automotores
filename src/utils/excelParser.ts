import * as XLSX from 'xlsx';

export interface ClientePlan {
  id: string;
  suscripcion: string;
  titular: string;
  estado: string;
  modelo: string;
  cuotasPagadas: number;
  cuotasTotales: number;
  telefono: string;
  esOportunidad: boolean;
  moroso: boolean;
  cuotasVencidas: number;
}

// 1. Normalización de estados según reglas de negocio
export const normalizarEstadoSAP = (estadoRaw: string): string => {
  const estadoUpper = (estadoRaw || '').toUpperCase();

  if (estadoUpper.includes('AHORRISTA')) {
    return 'Ahorrista (Al día)';
  }
  if (estadoUpper.includes('ADJUDICADO')) {
    return 'Adjudicado (Pidió auto)';
  }
  if (estadoUpper.includes('RESCINDIDO')) {
    return 'Rescindido (Dejó de pagar)';
  }
  if (estadoUpper.includes('FINALIZO') || estadoUpper.includes('LIQUIDADO')) {
    return 'Finalizado (Liquidación)';
  }

  return estadoRaw.trim() || 'Desconocido';
};

// 2. Búsqueda flexible de columnas con variaciones SAP
const buscarValorColumna = (row: Record<string, any>, posiblesNombres: string[]): any => {
  const keys = Object.keys(row);
  for (const nombre of posiblesNombres) {
    const keyEncontrada = keys.find(
      (k) => k.trim().toUpperCase() === nombre.trim().toUpperCase()
    );
    if (keyEncontrada && row[keyEncontrada] !== undefined && row[keyEncontrada] !== null) {
      return row[keyEncontrada];
    }
  }
  return '';
};

// 3. Procesador principal de planillas
export const procesarArchivoExcel = (fileBuffer: ArrayBuffer): ClientePlan[] => {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawData.map((row, index) => {
    const suscripcion = String(
      buscarValorColumna(row, ['SUSCRIPCION', 'CONTRATO', 'NRO_SUSCRIPCION', 'GRUPO_ORDEN'])
    ).trim();

    const titular = String(
      buscarValorColumna(row, ['NOMBRE_SU', 'TITULAR', 'CLIENTE', 'NOMBRE_Y_APELLIDO', 'NOMBRES'])
    ).trim();

    const estadoRaw = String(
      buscarValorColumna(row, ['ESTADO_CON', 'SITUACION', 'ESTADO', 'SITUACION_PLAN'])
    ).trim();

    const estado = normalizarEstadoSAP(estadoRaw);

    const modelo = String(
      buscarValorColumna(row, ['MODELO_VIC', 'OFERTA', 'MODELO', 'VEHICULO'])
    ).trim();

    const cuotasPagadas = Number(
      buscarValorColumna(row, ['CUOTAS_PAGADAS', 'CUOTAS_PAG', 'PAGADAS', 'CUOTA_ACTUAL'])
    ) || 0;

    const cuotasTotales = Number(
      buscarValorColumna(row, ['CUOTAS_TOTALES', 'TOTAL_CUOTAS', 'PLAN'])
    ) || 84;

    const cuotasVencidas = Number(
      buscarValorColumna(row, ['CUOTAS_VENCIDAS', 'CUOTAS_VEN', 'MOROSIDAD'])
    ) || 0;

    // Regla de teléfono con fallback
    let telefonoRaw = String(
      buscarValorColumna(row, ['TELEFONO', 'CELULAR', 'TEL', 'MOVIL', 'TEL_CONTACTO'])
    ).trim();

    if (!telefonoRaw || telefonoRaw === '-' || telefonoRaw.length < 6) {
      telefonoRaw = '3815000000';
    } else {
      telefonoRaw = telefonoRaw.replace(/\D/g, '');
      if (!telefonoRaw) telefonoRaw = '3815000000';
    }

    // Detección de oportunidad
    const modeloUpper = modelo.toUpperCase();
    const esOportunidad =
      modeloUpper.includes('ULTIMAS CUOTAS') || modeloUpper.includes('VIGENTE');

    return {
      id: suscripcion || `row-${index}`,
      suscripcion,
      titular,
      estado,
      modelo,
      cuotasPagadas,
      cuotasTotales,
      cuotasVencidas,
      telefono: telefonoRaw,
      esOportunidad,
      moroso: cuotasVencidas > 0,
    };
  });
};