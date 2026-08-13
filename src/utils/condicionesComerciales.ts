import * as XLSX from 'xlsx';

export const CONDICIONES_STORAGE_KEY = 'condiciones_comerciales_ruiz';

export interface FichaTecnicaVehiculo {
  motor: string;
  transmision: string;
  traccion: string;
  consumo: string;
  baul: string;
  equipamiento: string;
}

// Un combo de financiación concreto (ej. "Kardian 75% en 84 cuotas"). Un mismo
// modelo suele tener 2-3 de éstos vigentes en simultáneo (confirmado contra la
// Lista de Precios RED, la imagen de Integración Mínima y la Política Comercial
// reales de Plan Rombo) — por eso ConfiguracionVehiculo tiene una LISTA de planes,
// no un solo modalidad/plazo/cuota fijo.
export interface PlanFinanciacion {
  modalidadPct: number; // % que financia Plan Rombo (ej. 75, 80, 100) — número plano, no ratio "75/25"
  plazoCuotas: number; // cantidad de cuotas del plan (ej. 84, 120; a veces 100 en variantes puntuales)
  valorCuota1: number; // "Cuota Desde" del combo (precio final, con impuestos), en pesos
  version: string; // versión de fábrica a la que corresponde este combo, ej. "Kardian Evolution MT MY25"
  precioPublico?: number; // "Precio público" del combo si el archivo lo trae, en pesos
  // Integración Mínima (documentos reales "Integración Mínima" y Política Comercial
  // de Plan Rombo — ambos son imagen/PDF, sin forma confiable de auto-cargarlos como
  // las Excel de arriba, así que estos 2 campos se completan a mano). Texto libre
  // porque el valor real no siempre es un %: puede decir "cuota extra" o "-" (no
  // aplica) en vez de un número. Vacíos = todavía no se cargó ese dato para este plan.
  integracionMinimaPct?: string; // ej. "30%", "25%", "cuota extra"
  cuotasIntegracionMinima?: string; // ej. "34 cuotas", "-"
}

// Configuración comercial de UN modelo (Kardian, Boreal, Duster, ...). Ésta es la
// fuente única de verdad para precio, planes y ficha técnica en toda la app:
// Catálogo de Modelos, Vitrina "Quiero mi 0km" y Estado de Cuenta del cliente leen
// todos de acá (ver App.tsx y DashboardCliente.tsx) en vez de tener cada uno su
// propia copia hardcodeada.
export interface ConfiguracionVehiculo {
  nombre: string; // nombre comercial mostrado, ej. "Kardian"
  precioLista: number; // Valor Móvil de lista de la versión principal, en pesos
  planes: PlanFinanciacion[]; // uno o más combos de financiación vigentes
  planDestacadoIndex: number; // qué entrada de `planes` se muestra como principal (Vitrina, Estado de Cuenta)
  bonificacionPct: number; // % de bonificación vigente este mes (0 = sin bonificación)
  vigenciaMes: string; // ej. "Agosto 2026" — texto libre, lo fija el Administrador a mano
  fichaTecnica: FichaTecnicaVehiculo;
}

// Claves = mismos códigos de familia que FAMILIAS_CATALOGO en App.tsx.
export type CatalogoVehiculos = Record<string, ConfiguracionVehiculo>;

// Si una versión de fábrica puntual está habilitada para entregar este mes (ver
// "Particularidades Carta Vigencia" / procesarDisponibilidadVersiones más abajo).
// Referencia interna del Admin para gestión de cambio de modelo — no se le muestra
// esto al cliente tal cual: la planilla real no diferencia de forma útil "qué
// modelo suscripto habilita qué modelo pedido" (casi cualquier combinación da
// habilitado); lo único con señal real es si la versión puntual tiene stock este
// mes o no, sea cual sea el modelo originalmente suscripto.
export interface DisponibilidadVersion {
  familia: string; // una de las 9 familias trackeadas (FAMILIAS_CATALOGO en App.tsx)
  codigo: string; // "Cód. Ind." tal cual viene (puede traer sufijo "(*)")
  version: string; // "MODELO PEDIDO", ej. "Kardian Techno 200 DCT"
  habilitada: boolean; // tiene al menos un "a" (habilitado) en alguna columna de modelo suscripto
}

export interface CondicionesComerciales {
  tituloPromo: string;
  descripcionPromo: string;
  vehiculos: CatalogoVehiculos;
  disponibilidadVersiones: DisponibilidadVersion[];
}

// Valores iniciales: calcados de los que ya estaban hardcodeados en App.tsx
// (versionesPorModelo/vitrinaComercial) y DashboardCliente.tsx (CARACTERISTICAS_KARDIAN)
// antes de centralizar esta configuración, para que la migración no cambie ningún
// precio o dato técnico ya visible en la app. Cada modelo arranca con UN solo plan
// (el que ya existía) — subir la Lista de Precios RED desde "Gestión Comercial &
// Precios" reemplaza esto por los combos reales vigentes ese mes, que suelen ser
// varios por modelo. Arkana y Koleos no tenían entrada en la vitrina comercial
// original (sólo en el catálogo completo); su precioLista acá es una ESTIMACIÓN a
// partir de la relación precio/cuota de modelos comparables — conviene revisarla.
// integracionMinimaPct/cuotasIntegracionMinima de cada plan salen de los documentos
// reales "Integración Mínima" y "Política Comercial" (imagen y PDF, respectivamente
// — sin forma confiable de auto-cargarlos como las Excel, ver comentario en
// PlanFinanciacion) transcriptos a mano una vez; no están para Arkana/Koleos porque
// esos documentos no los incluyen.
const VIGENCIA_INICIAL = 'Agosto 2026';

export const CATALOGO_VEHICULOS_DEFAULT: CatalogoVehiculos = {
  KWID: {
    nombre: 'Kwid', precioLista: 23100000,
    planes: [{ modalidadPct: 100, plazoCuotas: 120, valorCuota1: 231000, version: 'Kwid Bitono', integracionMinimaPct: '25%', cuotasIntegracionMinima: '30 cuotas' }],
    planDestacadoIndex: 0, bonificacionPct: 0, vigenciaMes: VIGENCIA_INICIAL,
    fichaTecnica: { motor: '1.0 SCe 66cv', transmision: 'Manual 5v', traccion: '4x2', consumo: '16 km/l', baul: '300 litros', equipamiento: 'Llantas bitono, aire acondicionado, dirección asistida' },
  },
  KARDIAN: {
    nombre: 'Kardian', precioLista: 25550000,
    planes: [{ modalidadPct: 75, plazoCuotas: 84, valorCuota1: 245500, version: 'Kardian Evolution 156 MT', integracionMinimaPct: '30%', cuotasIntegracionMinima: '34 cuotas' }],
    planDestacadoIndex: 0, bonificacionPct: 0, vigenciaMes: VIGENCIA_INICIAL,
    fichaTecnica: { motor: '1.6 SCe 156cv', transmision: 'Manual 5v', traccion: '4x2', consumo: '14.5 km/l', baul: '410 litros', equipamiento: 'Pantalla 7" Android Auto/CarPlay, cámara trasera' },
  },
  DUSTER: {
    nombre: 'Duster', precioLista: 32480000,
    planes: [{ modalidadPct: 75, plazoCuotas: 84, valorCuota1: 279000, version: 'Duster Intens MT', integracionMinimaPct: '30%', cuotasIntegracionMinima: '34 cuotas' }],
    planDestacadoIndex: 0, bonificacionPct: 0, vigenciaMes: VIGENCIA_INICIAL,
    fichaTecnica: { motor: '1.6 SCe 115cv', transmision: 'Manual 6v', traccion: '4x2', consumo: '13 km/l', baul: '445 litros', equipamiento: 'Multimedia 8", cámara trasera, control de estabilidad' },
  },
  BOREAL: {
    nombre: 'Boreal', precioLista: 48900000,
    planes: [{ modalidadPct: 75, plazoCuotas: 84, valorCuota1: 457000, version: 'Boreal Iconic', integracionMinimaPct: '30%', cuotasIntegracionMinima: '34 cuotas' }],
    planDestacadoIndex: 0, bonificacionPct: 0, vigenciaMes: VIGENCIA_INICIAL,
    fichaTecnica: { motor: '1.3 TCe 156cv Turbo', transmision: 'Automática EDC 6v', traccion: '4x2', consumo: '12 km/l', baul: '500 litros', equipamiento: 'Asientos de cuero, ADAS completo, sonido premium' },
  },
  KANGOO: {
    nombre: 'Kangoo', precioLista: 27200000,
    planes: [{ modalidadPct: 75, plazoCuotas: 120, valorCuota1: 275000, version: 'Kangoo Express 5A', integracionMinimaPct: 'cuota extra', cuotasIntegracionMinima: '-' }],
    planDestacadoIndex: 0, bonificacionPct: 0, vigenciaMes: VIGENCIA_INICIAL,
    fichaTecnica: { motor: '1.6 SCe 114cv', transmision: 'Manual 5v', traccion: '4x2', consumo: '13 km/l', baul: '5 plazas + espacio de carga', equipamiento: '5 plazas, aire acondicionado' },
  },
  OROCH: {
    nombre: 'Oroch', precioLista: 31900000,
    planes: [{ modalidadPct: 75, plazoCuotas: 84, valorCuota1: 285000, version: 'Oroch Emotion', integracionMinimaPct: '30%', cuotasIntegracionMinima: '34 cuotas' }],
    planDestacadoIndex: 0, bonificacionPct: 0, vigenciaMes: VIGENCIA_INICIAL,
    fichaTecnica: { motor: '1.6 SCe 114cv', transmision: 'Manual 6v', traccion: '4x2', consumo: '12.8 km/l', baul: 'Caja de carga 650 kg', equipamiento: 'Barras antivuelco, paragolpes protegidos' },
  },
  MASTER: {
    nombre: 'Master', precioLista: 62300000,
    planes: [{ modalidadPct: 75, plazoCuotas: 84, valorCuota1: 587000, version: 'Master', integracionMinimaPct: '30%', cuotasIntegracionMinima: '34 cuotas' }],
    planDestacadoIndex: 0, bonificacionPct: 0, vigenciaMes: VIGENCIA_INICIAL,
    fichaTecnica: { motor: '2.3 dCi 130cv Diesel', transmision: 'Manual 6v', traccion: '4x2', consumo: '9.5 km/l', baul: 'Hasta 17 m³', equipamiento: 'Doble puerta lateral, ABS + ESP' },
  },
  ARKANA: {
    nombre: 'Arkana', precioLista: 67000000,
    planes: [{ modalidadPct: 75, plazoCuotas: 84, valorCuota1: 620000, version: 'Arkana E-Tech Hybrid' }],
    planDestacadoIndex: 0, bonificacionPct: 0, vigenciaMes: VIGENCIA_INICIAL,
    fichaTecnica: { motor: '1.6 E-Tech Hybrid 145cv', transmision: 'Automática E-Tech (multi-modo)', traccion: '4x2', consumo: '18.5 km/l', baul: '480 litros', equipamiento: 'Techo panorámico, tapizado de cuero, sonido premium Harman Kardon' },
  },
  KOLEOS: {
    nombre: 'Koleos', precioLista: 74500000,
    planes: [{ modalidadPct: 75, plazoCuotas: 84, valorCuota1: 690000, version: 'Koleos Techno' }],
    planDestacadoIndex: 0, bonificacionPct: 0, vigenciaMes: VIGENCIA_INICIAL,
    fichaTecnica: { motor: '2.5 4 cil. 170cv', transmision: 'Automática CVT', traccion: '4x4', consumo: '10.5 km/l', baul: '458 litros', equipamiento: 'Techo panorámico, cámara 360°, asistentes ADAS completos' },
  },
};

export const CONDICIONES_DEFAULT: CondicionesComerciales = {
  tituloPromo: 'Conocé la Nueva Gama Renault en Plan Rombo',
  descripcionPromo: 'Renová tu plan o suscribite a los nuevos Kardian, Boreal y Kangoo Express 5A con cuotas bonificadas.',
  vehiculos: CATALOGO_VEHICULOS_DEFAULT,
  disponibilidadVersiones: [],
};

// El plan que se muestra como "el" plan del modelo (Vitrina, Estado de Cuenta). Si
// el índice guardado quedó fuera de rango (ej. se borró ese plan a mano) cae al
// primero de la lista; null sólo si el modelo se quedó sin ningún plan cargado.
export const obtenerPlanDestacado = (vehiculo: ConfiguracionVehiculo): PlanFinanciacion | null =>
  vehiculo.planes[vehiculo.planDestacadoIndex] ?? vehiculo.planes[0] ?? null;

export const formatModalidadPct = (modalidadPct: number): string => `${modalidadPct}%`;

export const formatearMoneda = (valor: number): string => `$${valor.toLocaleString('es-AR')}`;

// Regla de inmutabilidad: esta función NUNCA reinicia ni recalcula precios por su
// cuenta — sólo lee lo último guardado (o, si no hay nada guardado todavía, el
// snapshot inicial de arriba) y lo devuelve tal cual. Los valores quedan fijos mes
// a mes hasta que el Administrador los edite/suba de nuevo desde el panel — no hay
// ningún timer, cron ni recálculo automático en ninguna parte de la app.
export const cargarCondiciones = (): CondicionesComerciales => {
  try {
    const guardado = localStorage.getItem(CONDICIONES_STORAGE_KEY);
    if (!guardado) return CONDICIONES_DEFAULT;
    const parseado = JSON.parse(guardado);
    const vehiculosGuardados: Partial<CatalogoVehiculos> = parseado.vehiculos || {};

    // Merge por vehículo y por campo (no sólo superficial): una config guardada
    // antes de agregar un campo nuevo, un modelo nuevo, o con el esquema anterior
    // de un solo plan por modelo (sin `planes`/`planDestacadoIndex`) igual completa
    // con el default en vez de romper la pantalla con un campo undefined.
    const vehiculos: CatalogoVehiculos = {};
    for (const familia of Object.keys(CATALOGO_VEHICULOS_DEFAULT)) {
      const base = CATALOGO_VEHICULOS_DEFAULT[familia];
      const guardadoVehiculo = vehiculosGuardados[familia];
      vehiculos[familia] = {
        ...base,
        ...guardadoVehiculo,
        planes: Array.isArray(guardadoVehiculo?.planes) && guardadoVehiculo.planes.length > 0
          ? guardadoVehiculo.planes
          : base.planes,
        planDestacadoIndex: typeof guardadoVehiculo?.planDestacadoIndex === 'number'
          ? guardadoVehiculo.planDestacadoIndex
          : 0,
        fichaTecnica: { ...base.fichaTecnica, ...(guardadoVehiculo?.fichaTecnica || {}) },
      };
    }

    return { ...CONDICIONES_DEFAULT, ...parseado, vehiculos };
  } catch {
    return CONDICIONES_DEFAULT;
  }
};

export const guardarCondiciones = (condiciones: CondicionesComerciales): void => {
  localStorage.setItem(CONDICIONES_STORAGE_KEY, JSON.stringify(condiciones));
};

// ==== INGESTA DE LA "LISTA DE PRECIOS RED" (Plan Rombo, formato real) ====
//
// El archivo no es una tabla plana: es una serie de "bloques" (uno por combo
// modelo+modalidad+plazo, ej. "Kardian 75% en 84 cuotas"), cada uno con varias
// filas de detalle debajo. Se ubica cada bloque por su fila encabezado ("84 cuotas
// | modalidad 75%" en alguna columna cercana a la B), y dentro de ese bloque se
// buscan por etiqueta (no por posición fija, porque el layout varía levemente
// entre modelos) las filas "> Versión" y "Cuota Desde"/"Precio público". Un bloque
// sin Versión o sin Cuota Desde se descarta entero en vez de guardar un plan a
// medias con datos inventados.

const FAMILIAS_CONOCIDAS = ['KWID', 'KARDIAN', 'DUSTER', 'BOREAL', 'KANGOO', 'OROCH', 'MASTER', 'ARKANA', 'KOLEOS'];

// Reemplazo directo de vocales acentuadas (en vez de normalize('NFD') + rango
// Unicode de diacríticos, para no depender de que ese rango se preserve intacto
// en cualquier editor/herramienta que toque este archivo).
const SIN_ACENTOS: Record<string, string> = { 'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U', 'Ü': 'U' };

const normalizarTexto = (s: string): string =>
  s
    .toUpperCase()
    .split('')
    .map((c) => SIN_ACENTOS[c] || c)
    .join('');

// La etiqueta del bloque puede ser "Kardian Evolution", "Kangoo Stepway", "Kangoo
// 2A", "Kangoo 5A", etc. — todas las variantes de Kangoo caen en la misma familia
// KANGOO (la app sólo trackea un modelo Kangoo "principal", ver App.tsx). Exportada
// porque DashboardCliente.tsx también la usa para comparar modeloSuscripto vs
// modeloAdjudicado (ver DisponibilidadVersion más arriba).
export const identificarFamilia = (etiquetaModelo: string): string | null => {
  const norm = normalizarTexto(etiquetaModelo);
  return FAMILIAS_CONOCIDAS.find((f) => norm.includes(f)) || null;
};

// "$394,665" / "$27,740,000.00" -> 394665 / 27740000. Formato Plan Rombo: coma de
// miles, punto decimal. Devuelve null si no hay nada parseable (nunca 0 por defecto,
// para no confundir "no vino el dato" con "vale cero").
const numeroDesdeMoneda = (texto: string): number | null => {
  const limpio = texto.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (!limpio) return null;
  const num = Number(limpio);
  return Number.isFinite(num) ? Math.round(num) : null;
};

// Detecta la fila de encabezado de un bloque ("84 cuotas | modalidad 75%", a veces
// "120 cuotas | modalidad 100%" en una sola celda) buscando el patrón en las
// columnas B a I de esa fila, sin asumir una columna fija (el archivo real no es
// perfectamente uniforme entre modelos).
const RE_BLOQUE = /(\d+)\s*cuotas?\s*\|?\s*modalidad\s+(\d+)\s*%/i;

export const procesarListaPreciosRed = (fileBuffer: ArrayBuffer): Record<string, PlanFinanciacion[]> => {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];

  const celda = (fila: unknown[], idx: number): string => String(fila?.[idx] ?? '').trim();

  const inicios: { fila: number; etiquetaModelo: string; plazoCuotas: number; modalidadPct: number }[] = [];
  for (let i = 0; i < filas.length; i++) {
    const texto = filas[i].slice(1, 9).map((c) => String(c ?? '').trim()).filter(Boolean).join(' ');
    const m = texto.match(RE_BLOQUE);
    if (m) {
      inicios.push({ fila: i, etiquetaModelo: celda(filas[i], 1), plazoCuotas: Number(m[1]), modalidadPct: Number(m[2]) });
    }
  }

  const resultado: Record<string, PlanFinanciacion[]> = {};

  inicios.forEach((inicio, idx) => {
    const familia = identificarFamilia(inicio.etiquetaModelo);
    if (!familia) return; // etiqueta de modelo no reconocida: no se adivina a qué familia pertenece

    const finBloque = idx + 1 < inicios.length ? inicios[idx + 1].fila : filas.length;
    let version = '';
    let valorCuota1: number | null = null;
    let precioPublico: number | undefined;

    for (let f = inicio.fila; f < finBloque; f++) {
      const fila = filas[f];
      if (!version && celda(fila, 5) === '> Versión') {
        version = celda(fila, 7);
      }
      if (precioPublico === undefined && celda(fila, 6) === 'Precio público') {
        precioPublico = numeroDesdeMoneda(celda(fila, 8)) ?? undefined;
      }
      if (valorCuota1 === null && celda(fila, 6) === 'Cuota Desde') {
        valorCuota1 = numeroDesdeMoneda(celda(fila, 8));
      }
    }

    if (!version || valorCuota1 === null) return; // bloque incompleto: se descarta en vez de guardar datos a medias

    const plan: PlanFinanciacion = {
      modalidadPct: inicio.modalidadPct,
      plazoCuotas: inicio.plazoCuotas,
      valorCuota1,
      version,
      ...(precioPublico !== undefined ? { precioPublico } : {}),
    };

    (resultado[familia] ||= []).push(plan);
  });

  return resultado;
};

// Reemplaza los `planes` de cada familia detectada en el Excel por los recién
// parseados (una Lista de Precios es una foto completa del mes, no un incremento
// para acumular) y resetea planDestacadoIndex a 0. Las familias que el archivo no
// trae (o que no reconocimos) quedan intactas con lo que ya había.
export const combinarPlanesDesdeRed = (
  vehiculos: CatalogoVehiculos,
  planesPorFamilia: Record<string, PlanFinanciacion[]>
): CatalogoVehiculos => {
  const resultado = { ...vehiculos };
  for (const familia of Object.keys(planesPorFamilia)) {
    if (!resultado[familia]) continue; // familia detectada en el Excel pero fuera de nuestro catálogo de 9 modelos
    resultado[familia] = { ...resultado[familia], planes: planesPorFamilia[familia], planDestacadoIndex: 0 };
  }
  return resultado;
};

// ==== INGESTA DE LA "LISTA DE PRECIOS" (raza — precio de lista/MSRP por versión) ====
//
// A diferencia de la Lista RED (por combo modelo+modalidad+plazo), este archivo es
// una tabla plana con un precio de lista por CADA versión/trim de fábrica — mucha
// más cobertura que RED (trae, por ejemplo, Arkana y Koleos, que RED no incluye).
// El layout: filas de "encabezado de sección" con sólo la familia/línea en la
// columna C (ej. "KARDIAN", "KWID E-Tech 100% Eléctrico") seguidas de N filas de
// versión con Código de Modelo (columna D) sí presente — se recorre linealmente
// llevando cuál es la "familia actual" y agrupando cada versión bajo ella.

export interface PrecioListaTrim {
  familia: string;
  version: string;
  precioLista: number; // "Público con impuestos nacionales" (precio final redondeado)
}

const normalizarEspacios = (s: string): string => normalizarTexto(s).replace(/\s+/g, ' ').trim();

export const procesarListaPreciosRaza = (fileBuffer: ArrayBuffer): PrecioListaTrim[] => {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];
  const celda = (fila: unknown[], idx: number): string => String(fila?.[idx] ?? '').trim();

  const resultado: PrecioListaTrim[] = [];
  let familiaActual: string | null = null;

  for (const fila of filas) {
    const columnaC = celda(fila, 2);
    const codigoDeModelo = celda(fila, 3);

    // Fila de encabezado de sección: sólo la columna C tiene contenido (el nombre
    // de la línea/familia), la columna D (Código de Modelo) está vacía.
    if (columnaC && !codigoDeModelo) {
      familiaActual = identificarFamilia(columnaC);
      continue;
    }

    if (!familiaActual) continue;
    const version = celda(fila, 6);
    const precioLista = numeroDesdeMoneda(celda(fila, 12));
    if (!version || precioLista === null) continue;

    resultado.push({ familia: familiaActual, version, precioLista });
  }

  return resultado;
};

export interface CambioPrecioLista {
  familia: string;
  version: string;
  precioLista: number;
  coincideConPlanCargado: boolean;
}

// Para cada familia detectada, elige qué versión de la lista se convierte en el
// `precioLista` del vehículo: si alguna coincide (por nombre, sin importar
// mayúsculas/acentos/espacios dobles) con la versión de algún plan de financiación
// ya cargado (típicamente desde la Lista RED), usa ese precio — es el más
// confiable, porque corresponde exactamente a la versión que se está financiando.
// Si no hay ninguna coincidencia (como hoy pasa con Arkana/Koleos, que no están en
// RED), usa el precio más bajo de la sección como valor "desde". Nunca promedia ni
// inventa un número: siempre es el precio real de alguna versión del archivo.
export const combinarPrecioListaDesdeRaza = (
  vehiculos: CatalogoVehiculos,
  trims: PrecioListaTrim[]
): { vehiculos: CatalogoVehiculos; cambios: CambioPrecioLista[] } => {
  const porFamilia = new Map<string, PrecioListaTrim[]>();
  trims.forEach((t) => {
    if (!porFamilia.has(t.familia)) porFamilia.set(t.familia, []);
    porFamilia.get(t.familia)!.push(t);
  });

  const resultado = { ...vehiculos };
  const cambios: CambioPrecioLista[] = [];

  for (const [familia, listaTrims] of porFamilia) {
    if (!resultado[familia]) continue; // familia detectada en el Excel pero fuera de nuestro catálogo de 9 modelos

    const vehiculo = resultado[familia];
    const nombresPlanes = new Set(vehiculo.planes.map((p) => normalizarEspacios(p.version)));
    const coincidencia = listaTrims.find((t) => nombresPlanes.has(normalizarEspacios(t.version)));
    const elegido = coincidencia || listaTrims.reduce((mas, t) => (t.precioLista < mas.precioLista ? t : mas), listaTrims[0]);

    resultado[familia] = { ...vehiculo, precioLista: elegido.precioLista };
    cambios.push({
      familia,
      version: elegido.version,
      precioLista: elegido.precioLista,
      coincideConPlanCargado: !!coincidencia,
    });
  }

  return { vehiculos: resultado, cambios };
};

// ==== INGESTA DE "PARTICULARIDADES CARTA VIGENCIA" (disponibilidad por versión) ====
//
// El archivo real es una matriz "modelo suscripto" (columnas, desde la fila 1) ×
// "modelo pedido" (filas, agrupadas en secciones por familia) con una marca "a" en
// cada celda habilitada. En la práctica, casi cualquier modelo suscripto habilita
// casi cualquier modelo pedido — la señal real y útil no es esa combinación, sino
// si una VERSIÓN puntual tiene alguna marca en absoluto (habilitada este mes) o
// ninguna (sin stock/discontinuada este mes, para cualquier origen). Por eso este
// parser ignora la dimensión de columnas y sólo reporta, por versión, si está
// habilitada o no — ver DisponibilidadVersion.

// Fila de encabezado de sección (familia del modelo pedido, ej. "KARDIAN", "OROCH"):
// la columna A (Cód. Ind.) está vacía Y todas las columnas de la matriz (C a Q)
// están vacías. Ambas condiciones son necesarias — hay filas de datos reales sin
// código (ej. "Kangoo Express 2A 1.5 dCi 89") que sí tienen marcas "a" y no deben
// confundirse con un encabezado.
const filaSinMarcas = (fila: unknown[], colDesde: number, colHasta: number): boolean => {
  for (let col = colDesde; col <= colHasta; col++) {
    if (String(fila[col] ?? '').trim() !== '') return false;
  }
  return true;
};

export const procesarDisponibilidadVersiones = (fileBuffer: ArrayBuffer): DisponibilidadVersion[] => {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  // La hoja real se llama "Novedades"; si el archivo cambiara de nombre de hoja
  // algún mes, se cae a la primera hoja en vez de fallar.
  const worksheet = workbook.Sheets['Novedades'] || workbook.Sheets[workbook.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as unknown[][];
  const celda = (fila: unknown[], idx: number): string => String(fila?.[idx] ?? '').trim();

  // Columnas de la matriz: desde la C (índice 2) hasta la última columna no vacía
  // de la fila de encabezados (fila índice 1).
  const filaEncabezados = filas[1] || [];
  let ultimaColumna = 2;
  for (let col = 2; col < filaEncabezados.length; col++) {
    if (celda(filaEncabezados, col) !== '') ultimaColumna = col;
  }

  const resultado: DisponibilidadVersion[] = [];
  let familiaActual: string | null = null;

  for (let i = 2; i < filas.length; i++) {
    const fila = filas[i];
    const codigo = celda(fila, 0);
    const modeloPedido = celda(fila, 1);

    if (!codigo && modeloPedido && filaSinMarcas(fila, 2, ultimaColumna)) {
      // Fila de encabezado de sección: cambia la familia actual (o null si la
      // sección no es una de las 9 familias trackeadas, ej. "SANDERO"/"LOGAN").
      familiaActual = identificarFamilia(modeloPedido);
      continue;
    }

    if (!familiaActual || !modeloPedido) continue;

    const habilitada = !filaSinMarcas(fila, 2, ultimaColumna);
    resultado.push({ familia: familiaActual, codigo, version: modeloPedido, habilitada });
  }

  return resultado;
};
