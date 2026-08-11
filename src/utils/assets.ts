// ==== ASSETS DE FOTOGRAMAS 360° (public/) ====
//
// Convención universal: cada versión con giro 360° tiene 8 fotogramas en public/
// nombrados "<prefijo de archivo> 1.png" ... "<prefijo de archivo> 8.png". El
// nombre de versión (la clave de PREFIJOS_ARCHIVO) es el mismo "nombre" que ya
// usan versionesPorModelo (App.tsx) y el visor de DashboardCliente.tsx — de ahí
// se resuelve el prefijo real de archivo, que puede diferir bastante del nombre
// legible (ver mapeo abajo).
//
// Kangoo Stepway es la única excepción: un solo archivo estático sin secuencia
// 1..8 ("KANGOO II STEPWAY 1.6.png"), así que nunca gira.

export const TOTAL_FOTOS_360 = 8;

const PREFIJOS_ARCHIVO: Record<string, string> = {
  'Arkana E-Tech Hybrid': 'ARKANA HYBRID E-TECH',
  'Boreal Evolution': 'BOREAL evolution',
  'Boreal Techno': 'BOREAL techno',
  'Boreal Iconic': 'BOREAL iconic',
  'Duster Intens MT': 'DUSTER Duster Intens 1.6 MT',
  'Duster Iconic CVT': 'DUSTER Duster Iconic 1.3T CVT',
  'Kangoo Express 2A': 'KANGOO EXPRESS 2A 1.6',
  'Kangoo Express 5A': 'KANGOO EXPRESS 5A 1.6',
  'Kardian Evolution 156 MT': 'KARDIAN Evolution 156 MT',
  'Kardian Evolution 200 EDC': 'KARDIAN Evolution 200 EDC',
  'Kardian Iconic 200 EDC': 'KARDIAN Iconic 200 EDC',
  'Koleos Techno': 'KOLEOS Techno',
  'Kwid Bitono': 'KWID Iconic Bitono',
  'Kwid Outsider': 'KWID Iconic Outsider',
  Master: 'Master',
  'Oroch Emotion': 'OROCH Emotion 1.6 S 4x2',
  'Oroch Iconic': 'OROCH Iconic 1.3 4x2 CVT',
};

// Versiones con un único archivo estático (sin secuencia 1..8).
const ARCHIVO_UNICO: Record<string, string> = {
  'Kangoo Stepway': 'KANGOO II STEPWAY 1.6.png',
};

// Ruta pública exacta del fotograma N (1..8) de una versión. Si la versión no
// gira (ej. Kangoo Stepway) siempre devuelve su único archivo, sin importar qué
// frameNumber se pida. Si la versión no está mapeada, devuelve '' — el llamador
// decide el fallback en vez de romper con una ruta inventada.
export const get360Frame = (versionName: string, frameNumber: number): string => {
  const archivoUnico = ARCHIVO_UNICO[versionName];
  if (archivoUnico) return `/${archivoUnico}`;

  const prefijo = PREFIJOS_ARCHIVO[versionName];
  if (!prefijo) return '';

  const frame = Math.min(Math.max(Math.round(frameNumber), 1), TOTAL_FOTOS_360);
  return `/${prefijo} ${frame}.png`;
};

// Secuencia completa de 8 fotogramas para el visor 360°. Devuelve [] para
// versiones sin rotación (Kangoo Stepway) o no mapeadas — mismo contrato que
// esperaba VisorVersion360: total === 0 => usar sólo la portada, sin girar.
export const get360Frames = (versionName: string): string[] => {
  if (ARCHIVO_UNICO[versionName] || !PREFIJOS_ARCHIVO[versionName]) return [];
  return Array.from({ length: TOTAL_FOTOS_360 }, (_, i) => get360Frame(versionName, i + 1));
};

// Fotograma 1 como portada por defecto en listas y catálogos.
export const get360Cover = (versionName: string): string => get360Frame(versionName, 1);
