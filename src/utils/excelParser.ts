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

// 2. Búsqueda flexible de columnas con variaciones SAP.
// Limpia puntos, guiones y espacios en blanco tanto del encabezado real de la
// planilla como de cada nombre candidato, para que variantes como "F. Adju.",
// "F - Adju" o "F Adju" matcheen sin importar la puntuación exacta que traiga
// el reporte.
const normalizarEncabezado = (texto: string): string =>
  String(texto || '')
    .toUpperCase()
    .replace(/[.-]/g, '')
    .replace(/\s+/g, '')
    .trim();

export const buscarValorColumna = (row: Record<string, any>, posiblesNombres: string[]): any => {
  const keys = Object.keys(row);
  const keysNormalizadas = keys.map((k) => ({ original: k, normalizada: normalizarEncabezado(k) }));

  for (const nombre of posiblesNombres) {
    const nombreNormalizado = normalizarEncabezado(nombre);
    const keyEncontrada = keysNormalizadas.find((k) => k.normalizada === nombreNormalizado);
    if (keyEncontrada && row[keyEncontrada.original] !== undefined && row[keyEncontrada.original] !== null && row[keyEncontrada.original] !== '') {
      return row[keyEncontrada.original];
    }
  }
  return '';
};

// Listas canónicas de nombres de columna posibles por campo, según el reporte SAP real.
const COLUMNAS_TITULAR = ['TITULAR', 'NOMBRE_SU', 'NOMBRE DEL CLIENTE', 'CLIENTE', 'NOMBRES', 'NOMBRE Y APELLIDO', 'NOMBRE_Y_APELLIDO'];
const COLUMNAS_GRUPO_ORDEN = ['GRUPO Y ORDEN', 'GRUPO_ORDEN', 'SUSCRIPCION', 'CONTRATO', 'NRO_SUSCRIPCION'];
const COLUMNAS_DNI = ['DNI', 'DOCUMENTO', 'NRO_DOC', 'NRO_DNI', 'CUIT'];
const COLUMNAS_TELEFONO = ['TELEFONO', 'CELULAR', 'TEL', 'MOVIL', 'TEL_CONTACTO'];
const COLUMNAS_ESTADO = ['ESTADO ADJ', 'ESTADO_CON', 'SITUACION', 'ESTADO', 'SITUACION_PLAN'];
const COLUMNAS_FECHA_ADJUDICACION = ['F. ADJU.', 'F_ADJU', 'FECHA ADJU', 'FECHA_ADJU'];
const COLUMNAS_MODALIDAD_GANADORA = ['MOD. GAN. DENOMINACI', 'MOD_GAN', 'MODALIDAD'];
const COLUMNAS_MODELO_SUSCRIPTO = ['MOD. SUSCR', 'MOD_SUSCR', 'MODELO_SUSCRIPTO'];
const COLUMNAS_MODELO_ADJUDICADO = ['MOD. ADJU.', 'MOD_ADJU', 'MODELO_ADJUDICADO', 'MODELO_VIC', 'OFERTA'];
const COLUMNAS_DOMICILIO = ['DOMICILIO', 'DIRECCION'];
const COLUMNAS_LOCALIDAD = ['LOCALIDAD'];
const COLUMNAS_PROVINCIA = ['PROVINCIA'];
const COLUMNAS_CODIGO_POSTAL = ['CODIGO POS', 'CODIGO_POSTAL', 'CP'];
const COLUMNAS_CODIGO_PIN = ['COD. PIN', 'COD_PIN', 'PIN', 'CODIGO PIN'];
const COLUMNAS_EMAIL = ['E-MAIL', 'EMAIL'];

// 3. Procesador principal de planillas
export const procesarArchivoExcel = (fileBuffer: ArrayBuffer): ClientePlan[] => {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawData.map((row, index) => {
    const suscripcion = String(
      buscarValorColumna(row, COLUMNAS_GRUPO_ORDEN)
    ).trim();

    const titular = String(
      buscarValorColumna(row, COLUMNAS_TITULAR)
    ).trim();

    const estadoRaw = String(
      buscarValorColumna(row, COLUMNAS_ESTADO)
    ).trim();

    const estado = normalizarEstadoSAP(estadoRaw);

    const modeloCodigo = String(
      buscarValorColumna(row, [...COLUMNAS_MODELO_ADJUDICADO, 'MODELO', 'VEHICULO'])
    ).trim();
    // Traduce el código de material SAP (ej. "U792 570", "HJF1 110") a su nombre
    // comercial completo (ej. "Oroch Emotion 1.6 MT", "Kardian Evolution 156 MT").
    const modelo = modeloCodigo ? traducirModeloSAP(modeloCodigo) : '';

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
      buscarValorColumna(row, COLUMNAS_TELEFONO)
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

// ==== CARTERA UNIFICADA (persistencia acumulativa + conexión con el login del cliente) ====

export interface ClienteCartera {
  grupoOrden: string;
  dni: string;
  nombre: string;
  telefono: string;
  estado: string;
  mesAdjudicacion?: string;
}

export const CARTERA_STORAGE_KEY = 'cartera_general_ruiz';
export const ADJUDICADOS_STORAGE_KEY = 'adjudicados_ruiz';
export const MEJORES_OFERTAS_STORAGE_KEY = 'mejores_ofertas_ruiz';

// Extrae los 5 campos clave de una planilla de suscriptores (base general).
export const procesarArchivoCartera = (fileBuffer: ArrayBuffer): ClienteCartera[] => {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawData
    .map((row): ClienteCartera => {
      const grupoOrden = String(
        buscarValorColumna(row, COLUMNAS_GRUPO_ORDEN)
      ).trim();

      const dni = String(
        buscarValorColumna(row, COLUMNAS_DNI)
      ).trim().replace(/\D/g, '');

      const nombre = String(
        buscarValorColumna(row, COLUMNAS_TITULAR)
      ).trim();

      let telefono = String(
        buscarValorColumna(row, COLUMNAS_TELEFONO)
      ).trim().replace(/\D/g, '');
      if (!telefono || telefono.length < 6) telefono = '3815000000';

      return { grupoOrden, dni, nombre, telefono, estado: 'Ahorrista' };
    })
    .filter((c) => c.grupoOrden || c.dni);
};

export const cargarCartera = (): ClienteCartera[] => {
  try {
    const guardado = localStorage.getItem(CARTERA_STORAGE_KEY);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
};

export const guardarCartera = (clientes: ClienteCartera[]): void => {
  localStorage.setItem(CARTERA_STORAGE_KEY, JSON.stringify(clientes));
};

export const vaciarCartera = (): void => {
  localStorage.removeItem(CARTERA_STORAGE_KEY);
};

// Combina sumando SOLO los registros nuevos (por DNI o Grupo y Orden); los que ya
// existen se omiten y se cuentan, para poder avisarle al admin cuántos se salteó.
export const combinarCarteraConConteo = (
  existentes: ClienteCartera[],
  nuevos: ClienteCartera[]
): { resultado: ClienteCartera[]; agregados: number; omitidos: number } => {
  const resultado = [...existentes];
  let agregados = 0;
  let omitidos = 0;
  nuevos.forEach((nuevo) => {
    const yaExiste = resultado.some(
      (c) => (!!nuevo.dni && c.dni === nuevo.dni) || (!!nuevo.grupoOrden && c.grupoOrden === nuevo.grupoOrden)
    );
    if (yaExiste) {
      omitidos++;
    } else {
      resultado.push(nuevo);
      agregados++;
    }
  });
  return { resultado, agregados, omitidos };
};

// ==== REPORTE SAP DE ADJUDICADOS ====

export interface AdjudicadoSAP {
  grupoOrden: string;
  fechaAdjudicacion: string;
  modalidadGanadora: string;
  modeloSuscripto: string;
  modeloAdjudicado: string;
  titular: string;
  domicilio: string;
  localidad: string;
  codigoPostal: string;
  provincia: string;
  estadoAdjudicacion: string;
  codigoPin: string;
  email: string;
}

// Mapea dinámicamente las columnas del reporte SAP de Adjudicados (Grupo y Orden,
// F. Adju., Mod. Gan. Denominaci, Mod. Suscr, Mod. Adju., Titular, Domicilio,
// Localidad, Codigo Pos, Provincia, Estado Adj, Cod. PIN, E-mail).
export const procesarReporteAdjudicadosSAP = (fileBuffer: ArrayBuffer): AdjudicadoSAP[] => {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  return rawData
    .map((row): AdjudicadoSAP => ({
      grupoOrden: String(buscarValorColumna(row, COLUMNAS_GRUPO_ORDEN)).trim(),
      fechaAdjudicacion: String(buscarValorColumna(row, COLUMNAS_FECHA_ADJUDICACION)).trim(),
      modalidadGanadora: String(buscarValorColumna(row, COLUMNAS_MODALIDAD_GANADORA)).trim(),
      modeloSuscripto: traducirModeloSAP(String(buscarValorColumna(row, COLUMNAS_MODELO_SUSCRIPTO)).trim()),
      modeloAdjudicado: traducirModeloSAP(String(buscarValorColumna(row, COLUMNAS_MODELO_ADJUDICADO)).trim()),
      titular: String(buscarValorColumna(row, COLUMNAS_TITULAR)).trim(),
      domicilio: String(buscarValorColumna(row, COLUMNAS_DOMICILIO)).trim(),
      localidad: String(buscarValorColumna(row, COLUMNAS_LOCALIDAD)).trim(),
      codigoPostal: String(buscarValorColumna(row, COLUMNAS_CODIGO_POSTAL)).trim(),
      provincia: String(buscarValorColumna(row, COLUMNAS_PROVINCIA)).trim(),
      estadoAdjudicacion: String(buscarValorColumna(row, COLUMNAS_ESTADO)).trim(),
      codigoPin: String(buscarValorColumna(row, COLUMNAS_CODIGO_PIN)).trim(),
      email: String(buscarValorColumna(row, COLUMNAS_EMAIL)).trim(),
    }))
    .filter((a) => a.grupoOrden || a.titular);
};

export const cargarAdjudicados = (): AdjudicadoSAP[] => {
  try {
    const guardado = localStorage.getItem(ADJUDICADOS_STORAGE_KEY);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
};

export const guardarAdjudicados = (adjudicados: AdjudicadoSAP[]): void => {
  localStorage.setItem(ADJUDICADOS_STORAGE_KEY, JSON.stringify(adjudicados));
};

export const vaciarAdjudicados = (): void => {
  localStorage.removeItem(ADJUDICADOS_STORAGE_KEY);
};

// Combina sumando solo los adjudicados nuevos (identificador único: Grupo y Orden).
export const combinarAdjudicadosConConteo = (
  existentes: AdjudicadoSAP[],
  nuevos: AdjudicadoSAP[]
): { resultado: AdjudicadoSAP[]; agregados: number; omitidos: number } => {
  const resultado = [...existentes];
  let agregados = 0;
  let omitidos = 0;
  nuevos.forEach((nuevo) => {
    const yaExiste = resultado.some((a) => !!nuevo.grupoOrden && a.grupoOrden === nuevo.grupoOrden);
    if (yaExiste) {
      omitidos++;
    } else {
      resultado.push(nuevo);
      agregados++;
    }
  });
  return { resultado, agregados, omitidos };
};

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Extrae el nombre del mes en español a partir de una fecha en formato dd/mm/aaaa,
// dd-mm-aaaa, o de un texto que ya contenga el nombre del mes.
export const extraerMesDeFecha = (fechaStr: string): string | undefined => {
  if (!fechaStr) return undefined;
  const capitalizar = (m: string) => m.charAt(0).toUpperCase() + m.slice(1);

  const match = fechaStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (match) {
    const mesNum = parseInt(match[2], 10);
    if (mesNum >= 1 && mesNum <= 12) return capitalizar(MESES_ES[mesNum - 1]);
  }

  const lower = fechaStr.toLowerCase();
  const encontrado = MESES_ES.find((m) => lower.includes(m));
  return encontrado ? capitalizar(encontrado) : undefined;
};

// Busca un cliente por DNI o Grupo y Orden/Suscripción (usado en el login del cliente).
// Si figura en el reporte de adjudicados, arma el distintivo "Adjudicado - Ganador
// Acto de [Mes]" a partir de la fecha real de adjudicación.
export const buscarClientePorConsulta = (consulta: string): ClienteCartera | null => {
  const query = consulta.trim().toUpperCase();
  if (!query) return null;

  const cartera = cargarCartera();
  const adjudicados = cargarAdjudicados();

  const match = cartera.find(
    (c) => (c.dni && c.dni.toUpperCase() === query) || (c.grupoOrden && c.grupoOrden.toUpperCase() === query)
  );

  const ganador = adjudicados.find(
    (a) => a.grupoOrden.toUpperCase() === query || (!!match?.grupoOrden && a.grupoOrden === match.grupoOrden)
  );

  if (!match && !ganador) return null;

  if (ganador) {
    const mes = extraerMesDeFecha(ganador.fechaAdjudicacion);
    const estado = mes
      ? `Adjudicado - Ganador Acto de ${mes}`
      : `Adjudicado - Ganador por ${ganador.modalidadGanadora || 'Acto'}`;

    return {
      grupoOrden: match?.grupoOrden || ganador.grupoOrden,
      dni: match?.dni || '',
      nombre: match?.nombre || ganador.titular,
      telefono: match?.telefono || '3815000000',
      estado,
      mesAdjudicacion: mes,
    };
  }

  return match!;
};

// ==== REPORTE "5 MEJORES OFERTAS DE LICITACIÓN" ====

export interface PosicionOferta {
  puesto: number;
  cuotaOfertada: string;
  modalidad: string;
}

export interface MejorOferta {
  grupo: string;
  modelo: string;
  fecha: string;
  porcentajeFinanciacion: string;
  posiciones: PosicionOferta[];
}

// Parsea el reporte de las 5 mejores ofertas por posición. Se lee en modo "array"
// (por posición de columna, no por nombre) porque el reporte real repite el
// encabezado "Mod. Gan." varias veces y eso pisaría las claves si se leyera por objeto.
export const procesarReporteLicitaciones = (fileBuffer: ArrayBuffer): MejorOferta[] => {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const filas: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  if (filas.length < 2) return [];

  const encabezados = (filas[0] as unknown[]).map((h) => String(h ?? '').trim().toUpperCase());
  const indiceDe = (posibles: string[]): number =>
    encabezados.findIndex((h) => posibles.some((p) => h === p.toUpperCase() || h.includes(p.toUpperCase())));

  const idxGrupo = indiceDe(['GRUPO']);
  const idxModelo = indiceDe(['MODELO']);
  const idxFecha = indiceDe(['FECHA']);
  const idxFinanc = indiceDe(['% FINANC', 'FINANC']);

  // Las 5 columnas de posición (1er./2do./3er./4to./5to.); la modalidad ganadora de
  // cada una es, si existe, la columna inmediatamente siguiente ("Mod. Gan.").
  const etiquetasPuesto = ['1ER', '2DO', '3ER', '4TO', '5TO'];
  const posicionesIdx = etiquetasPuesto.map((etiqueta) => encabezados.findIndex((h) => h.startsWith(etiqueta)));

  const filasDeDatos = filas.slice(1).filter((fila) => fila.some((celda) => String(celda ?? '').trim() !== ''));

  return filasDeDatos
    .map((fila): MejorOferta => {
      const grupoCompleto = String(idxGrupo >= 0 ? fila[idxGrupo] ?? '' : '').trim();

      const posiciones: PosicionOferta[] = posicionesIdx.map((idx, i) => {
        const cuotaOfertada = idx >= 0 ? String(fila[idx] ?? '').trim() : '';
        const idxModalidad = idx >= 0 && String(encabezados[idx + 1] ?? '').includes('MOD') ? idx + 1 : -1;
        const modalidad = idxModalidad >= 0 ? String(fila[idxModalidad] ?? '').trim() : '';
        return { puesto: i + 1, cuotaOfertada, modalidad };
      });

      return {
        grupo: grupoCompleto.slice(0, 4),
        modelo: idxModelo >= 0 ? String(fila[idxModelo] ?? '').trim() : '',
        fecha: idxFecha >= 0 ? String(fila[idxFecha] ?? '').trim() : '',
        porcentajeFinanciacion: idxFinanc >= 0 ? String(fila[idxFinanc] ?? '').trim() : '',
        posiciones,
      };
    })
    .filter((o) => o.grupo);
};

export const cargarMejoresOfertas = (): MejorOferta[] => {
  try {
    const guardado = localStorage.getItem(MEJORES_OFERTAS_STORAGE_KEY);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
};

export const guardarMejoresOfertas = (ofertas: MejorOferta[]): void => {
  localStorage.setItem(MEJORES_OFERTAS_STORAGE_KEY, JSON.stringify(ofertas));
};

export const vaciarMejoresOfertas = (): void => {
  localStorage.removeItem(MEJORES_OFERTAS_STORAGE_KEY);
};

// Combina el histórico sumando solo los actos nuevos (identificados por grupo + fecha).
export const combinarMejoresOfertasConConteo = (
  existentes: MejorOferta[],
  nuevos: MejorOferta[]
): { resultado: MejorOferta[]; agregados: number; omitidos: number } => {
  const resultado = [...existentes];
  let agregados = 0;
  let omitidos = 0;
  nuevos.forEach((nuevo) => {
    const yaExiste = resultado.some((o) => o.grupo === nuevo.grupo && o.fecha === nuevo.fecha);
    if (yaExiste) {
      omitidos++;
    } else {
      resultado.push(nuevo);
      agregados++;
    }
  });
  return { resultado, agregados, omitidos };
};

// ==== FORMATO DUAL DE NOMBRES DE VEHÍCULO (Vista Admin vs Vista Cliente) ====

// Mapea el código de material SAP al nombre técnico completo, tal como figura
// en el sistema (motor, caja, paquete de equipamiento, etc.). Es lo que se
// muestra en la Vista de Administración.
export const MAPPING_MODELOS_SAP: Record<string, string> = {
  HJD1121: 'Duster Intens 1.6 MT',
  HJD1151: 'Duster Iconic 1.3T CVT',
  HJD1171: 'Duster Iconic 1.3T 4x4 MT',
  HJF1110: 'Kardian Evolution 156 MT',
  HJF1121: 'Kardian Evolution 200 EDC MY25 ADAS Pack',
  HJF1140: 'Kardian Iconic 200 EDC MY25 ADAS Pack',
  P3FC108: 'Kardian Iconic 200 EDC',
  F67N237: 'Kangoo II Express 2A 1.6 SCe 114',
  F67N257: 'Kangoo II Express 5A 1.6 SCe 114',
  K67N247: 'Kangoo Stepway 1.6 SCe 114 MT',
  BB1K400: 'Kwid Iconic Bitono 1.0 MT',
  BB1K450: 'Kwid Iconic Outsider 1.0 MT',
  U792502: 'Oroch Outsider 1.6 4x4 MT',
  U792550: 'Oroch Outsider 1.6 MT',
  U792570: 'Oroch Emotion 1.6 MT',
  U792571: 'Oroch Iconic 1.3T CVT',
  RM10020: 'Boreal Evolution 1.3 TCe 156 MT',
  RM10030: 'Boreal Techno 1.3 TCe 156 EDC',
  RM10040: 'Boreal Iconic 1.3 TCe 156 EDC',
  ADC2110: 'Master Furgón L1H1 2.3 dCi MT',
  ADC2220: 'Master Furgón L2H2 2.3 dCi MT',
  ADC2320: 'Master Furgón L3H2 2.3 dCi MT',
  U60A310: 'Alaskan Confort 4x4 MT',
  U60A355: 'Alaskan Intens Noir 4x4 AT',
  AU1T100: 'Koleos Techno AT',
  A4M1365: 'Sandero Life 1.6 MT',
  A4M2390: 'Stepway Intens 1.6 MT',
  LJL1200: 'Arkana E-Tech Hybrid AT',
};

// VISTA ADMINISTRACIÓN: nombre técnico oficial tal como figura en SAP.
// Busca el código dentro del texto crudo (puede venir con sufijos, ej "P3FC108-U")
// y devuelve el nombre completo mapeado; si no hay coincidencia, devuelve el texto original.
export const traducirModeloSAP = (codigoRaw: string = ''): string => {
  const texto = String(codigoRaw).replace(/\s+/g, '').toUpperCase();
  for (const [codigo, nombreCompleto] of Object.entries(MAPPING_MODELOS_SAP)) {
    if (texto.includes(codigo)) return nombreCompleto;
  }
  return String(codigoRaw).trim();
};

// Modelos del catálogo donde la tracción 4x2/4x4 es una variante real y vale la
// pena mostrarla al cliente (Kangoo, Kardian, Kwid, etc. no ofrecen 4x4).
const MODELOS_CON_TRACCION_RELEVANTE = ['DUSTER', 'OROCH', 'ALASKAN'];

// VISTA CLIENTE: traduce el nombre técnico SAP a lenguaje simple e intuitivo.
export const formatearModeloCliente = (nombreSAP: string): string => {
  const original = String(nombreSAP || '').trim();
  if (!original) return original;

  const upper = original.toUpperCase();

  // Caja de transmisión: CVT / EDC / AT -> Automática; MT o sin especificar -> Manual
  const esAutomatica = /\b(CVT|EDC|AT)\b/.test(upper);
  const caja = esAutomatica ? 'Automática' : 'Manual';

  // Tracción: 4x4 / 4WD -> "Tracción 4x4"; si no lo especifica -> "Tracción 4x2"
  const es4x4 = /\b(4X4|4WD)\b/.test(upper);
  const traccion = es4x4 ? '4x4' : '4x2';
  const mostrarTraccion = MODELOS_CON_TRACCION_RELEVANTE.some((m) => upper.includes(m));

  // Capacidad Kangoo: 2A / 5A / Stepway tienen su propio nombre de base
  let base = original;
  let esCasoEspecialKangoo = false;

  if (upper.includes('KANGOO') && upper.includes('STEPWAY')) {
    base = 'Kangoo Stepway';
    esCasoEspecialKangoo = true;
  } else if (upper.includes('KANGOO') && /\b2A\b/.test(upper)) {
    base = 'Kangoo Express 2 Asientos';
    esCasoEspecialKangoo = true;
  } else if (upper.includes('KANGOO') && /\b5A\b/.test(upper)) {
    base = 'Kangoo Express 5 Asientos';
    esCasoEspecialKangoo = true;
  }

  // Para el resto de los modelos, se limpia el ruido técnico del nombre
  // (motor, código de caja, año de modelo, paquete de equipamiento, etc.)
  if (!esCasoEspecialKangoo) {
    base = original
      .replace(/\bKangoo\s+II\b/gi, 'Kangoo')
      .replace(/\b\d+\.\d+T?\b/gi, '')
      .replace(/\bSCe\s*\d*\b/gi, '')
      .replace(/\bTCe\s*\d*\b/gi, '')
      .replace(/\bdCi\b/gi, '')
      .replace(/\bMY\d+\b/gi, '')
      .replace(/\bADAS\s*Pack\b/gi, '')
      .replace(/\bADAS\b/gi, '')
      .replace(/\bPack\b/gi, '')
      .replace(/\b(CVT|EDC|MT|AT)\b/gi, '')
      .replace(/\b4X4\b/gi, '')
      .replace(/\b4WD\b/gi, '')
      .replace(/\b\d{2,4}\b/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  const cajaConTraccion = mostrarTraccion ? `${caja} - Tracción ${traccion}` : caja;

  return `${base} (${cajaConTraccion})`;
};