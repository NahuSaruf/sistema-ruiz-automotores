import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Zap, Plus, UploadCloud, FileSpreadsheet,
  Search, Trophy, RefreshCw, Target, X, ExternalLink, Save, CheckCircle2, Files,
  Trash2, AlertTriangle, Award, MessageCircle, Eye, MapPin, Cloud,
  TrendingUp, TrendingDown, Percent, BarChart3, Building2, Crown,
  Receipt, Layers, LineChart, ChevronDown,
} from 'lucide-react';
import {
  procesarArchivoExcel, ClientePlan,
  ClienteCartera, procesarArchivoCartera,
  AdjudicadoSAP, procesarReporteAdjudicadosSAP,
  MejorOferta, procesarReporteLicitaciones,
  cargarCartera, guardarCartera, vaciarCartera, combinarCarteraConConteo,
  cargarAdjudicados, guardarAdjudicados, vaciarAdjudicados, combinarAdjudicadosConConteo,
  cargarMejoresOfertas, guardarMejoresOfertas, combinarMejoresOfertasConConteo,
  traducirModeloSAP, formatearModeloCliente,
} from '../utils/excelParser';
import { cargarCondiciones, guardarCondiciones } from '../utils/condicionesComerciales';
import {
  nubeConfigurada, guardarCarteraEnNube, guardarAdjudicadosEnNube,
  obtenerCarteraDeNube, obtenerAdjudicadosDeNube,
} from '../lib/supabase';
import { ESTADISTICAS_MERCADO_DEFAULT, posicionMarcaPropia, ItemRanking } from '../utils/estadisticasMercado';
import { fetchCCAStats, cargarCacheCCA, CcaStats } from '../services/ccaService';

type AlertaCarga = { agregados: number; omitidos: number; nube: boolean } | null;
type EstadoContacto = 'pendiente' | 'contactado' | 'whatsapp';

// La nube (si está configurada) manda: cualquier registro que traiga desde
// Supabase pisa al local con el mismo Grupo y Orden; lo que sólo existe en
// localStorage (por ejemplo, cargado offline) se conserva igual.
const fusionarPorGrupoOrden = <T extends { grupoOrden: string }>(local: T[], nube: T[]): T[] => {
  const mapa = new Map<string, T>();
  local.forEach((item) => { if (item.grupoOrden) mapa.set(item.grupoOrden, item); });
  nube.forEach((item) => { if (item.grupoOrden) mapa.set(item.grupoOrden, item); });
  return Array.from(mapa.values());
};

// Etiquetas legibles por vista, usadas en el selector y en las tarjetas KPI de
// Mercado Nacional.
const ETIQUETAS_VISTA: Record<'suscripciones' | 'facturacion' | 'conversion', string> = {
  suscripciones: 'Suscripciones',
  facturacion: 'Facturación',
  conversion: 'Conversión',
};

// Ficha unificada de un adjudicado: cruza el reporte de Adjudicados (fecha, modalidad,
// domicilio, PIN, email...) con la Cartera General (DNI, Teléfono) por Grupo y Orden.
interface FichaCliente {
  grupoOrden: string;
  nombre: string;
  dni: string;
  telefono: string;
  estado: string;
  modeloComercial: string;
  fechaAdjudicacion: string;
  modalidadGanadora: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  codigoPin: string;
  email: string;
}

const leerArchivoComoBuffer = (file: File): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => resolve(evt.target?.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

export default function DashboardAdmin() {
  const [activeTab, setActiveTab] = useState<'cartera' | 'operativo' | 'licitaciones' | 'estadisticas'>('cartera');
  const [subTabCartera, setSubTabCartera] = useState<'general' | 'adjudicados' | 'multiple'>('general');

  const [baseDatosCargada, setBaseDatosCargada] = useState(false);
  const [clientesData, setClientesData] = useState<ClientePlan[]>([]);
  const [oportunidadesDetectadas, setOportunidadesDetectadas] = useState(0);
  const [modalOportunidadesOpen, setModalOportunidadesOpen] = useState(false);
  const [contactadosMap, setContactadosMap] = useState<Record<string, EstadoContacto>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [alertaGeneral, setAlertaGeneral] = useState<AlertaCarga>(null);

  const [adjudicadosData, setAdjudicadosData] = useState<AdjudicadoSAP[]>(() => cargarAdjudicados());
  const [baseAdjudicadosCargada, setBaseAdjudicadosCargada] = useState(() => cargarAdjudicados().length > 0);
  const [alertaAdjudicados, setAlertaAdjudicados] = useState<AlertaCarga>(null);
  const [fichaSeleccionada, setFichaSeleccionada] = useState<FichaCliente | null>(null);

  // Cartera general en memoria (para cruzar DNI/Teléfono con el reporte de Adjudicados
  // sin depender de recargar la página después de cada carga).
  const [carteraData, setCarteraData] = useState<ClienteCartera[]>(() => cargarCartera());

  const [mejoresOfertasData, setMejoresOfertasData] = useState<MejorOferta[]>(() => cargarMejoresOfertas());
  const [baseLicitacionesCargada, setBaseLicitacionesCargada] = useState(() => cargarMejoresOfertas().length > 0);
  const [alertaLicitaciones, setAlertaLicitaciones] = useState<AlertaCarga>(null);
  const [procesandoLicitaciones, setProcesandoLicitaciones] = useState(false);

  // CONDICIONES COMERCIALES (precios, promos y cuotas) — persistidas en localStorage
  const [condiciones, setCondiciones] = useState(() => cargarCondiciones());
  const [condicionesGuardadas, setCondicionesGuardadas] = useState(false);

  // ESTADÍSTICAS DE MERCADO (CCA) — última sincronización en vivo cacheada en
  // localStorage; si nunca se sincronizó con éxito, la pestaña Estadísticas cae
  // a los valores de referencia de ESTADISTICAS_MERCADO_DEFAULT.
  const [ccaStats, setCcaStats] = useState<CcaStats | null>(() => cargarCacheCCA());
  const [sincronizandoCCA, setSincronizandoCCA] = useState(false);
  const [errorSincronizacionCCA, setErrorSincronizacionCCA] = useState<string | null>(null);

  const handleSincronizarCCA = async () => {
    setSincronizandoCCA(true);
    setErrorSincronizacionCCA(null);
    const resultado = await fetchCCAStats();
    if (resultado.ok && resultado.datos) {
      setCcaStats(resultado.datos);
    } else {
      setErrorSincronizacionCCA(resultado.error || 'No se pudo sincronizar con cca.com.ar.');
    }
    setSincronizandoCCA(false);
  };

  // Al abrir el panel, si hay nube configurada, trae lo último guardado en Supabase
  // y lo fusiona con el respaldo local (la nube tiene prioridad ante conflictos).
  useEffect(() => {
    if (!nubeConfigurada) return;
    (async () => {
      const [carteraNube, adjudicadosNube] = await Promise.all([
        obtenerCarteraDeNube(),
        obtenerAdjudicadosDeNube(),
      ]);

      if (carteraNube) {
        const fusionada = fusionarPorGrupoOrden(cargarCartera(), carteraNube);
        guardarCartera(fusionada);
        setCarteraData(fusionada);
      }

      if (adjudicadosNube) {
        const fusionada = fusionarPorGrupoOrden(cargarAdjudicados(), adjudicadosNube);
        guardarAdjudicados(fusionada);
        setAdjudicadosData(fusionada);
        if (fusionada.length > 0) setBaseAdjudicadosCargada(true);
      }
    })();
  }, []);

  const handleGuardarCondiciones = () => {
    guardarCondiciones(condiciones);
    setCondicionesGuardadas(true);
    setTimeout(() => setCondicionesGuardadas(false), 2500);
  };

  // "Limpiar Cartera": único botón explícito que vacía cartera_general_ruiz y
  // adjudicados_ruiz. Las bases nunca se borran solas — requieren esta confirmación.
  // OJO: esto sólo limpia el respaldo local de ESTE dispositivo; los datos ya
  // sincronizados en Supabase no se tocan (para eso hay que borrarlos desde la
  // nube directamente, ya que es la base compartida por todos los dispositivos).
  const handleLimpiarCartera = () => {
    const confirmado = window.confirm(
      '¿Vaciar la Cartera General y la base de Adjudicados guardadas en ESTE dispositivo? Esto no borra lo ya sincronizado en la nube (Supabase), sólo el respaldo local. Esta acción no se puede deshacer.'
    );
    if (!confirmado) return;

    vaciarCartera();
    vaciarAdjudicados();

    setClientesData([]);
    setBaseDatosCargada(false);
    setOportunidadesDetectadas(0);
    setSearchTerm('');
    setAlertaGeneral(null);
    setCarteraData([]);

    setAdjudicadosData([]);
    setBaseAdjudicadosCargada(false);
    setAlertaAdjudicados(null);

    setResultadoCargaMultiple(null);
  };

  // Carga de Base General: usa el parser SAP existente para la tabla de gestión,
  // y además suma los mismos registros (proyectados a Grupo y Orden + Titular) a
  // la cartera compartida en localStorage para conectar con el login del cliente.
  const handleArchivoGeneralSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const datosProcesados = procesarArchivoExcel(buffer);

      const ops = datosProcesados.filter(row => row.esOportunidad).length;
      setOportunidadesDetectadas(ops);
      setClientesData(datosProcesados);
      setBaseDatosCargada(true);

      const comoCartera: ClienteCartera[] = datosProcesados
        .map((row) => ({
          grupoOrden: row.suscripcion,
          dni: '',
          nombre: row.titular,
          telefono: row.telefono,
          estado: row.estado,
        }))
        .filter((c) => c.grupoOrden);

      const { resultado, agregados, omitidos } = combinarCarteraConConteo(cargarCartera(), comoCartera);
      guardarCartera(resultado);
      setCarteraData(resultado);

      // Guardado indestructible: localStorage ya quedó actualizado arriba pase lo
      // que pase; esto además intenta subirlo a la nube (Supabase). Si no hay
      // conexión o no está configurada, sigue funcionando sólo local.
      const sincronizadoNube = await guardarCarteraEnNube(comoCartera);
      setAlertaGeneral({ agregados, omitidos, nube: sincronizadoNube });
    };
    reader.readAsArrayBuffer(file);
  };

  // Carga del Reporte SAP de Adjudicados: extrae los 13 campos y persiste,
  // acumulando sobre lo ya guardado y avisando cuántos se omitieron por duplicados.
  const handleArchivoAdjudicadosSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const nuevos = procesarReporteAdjudicadosSAP(buffer);

      const { resultado, agregados, omitidos } = combinarAdjudicadosConConteo(cargarAdjudicados(), nuevos);
      guardarAdjudicados(resultado);

      setAdjudicadosData(resultado);
      setBaseAdjudicadosCargada(true);

      const sincronizadoNube = await guardarAdjudicadosEnNube(nuevos);
      setAlertaAdjudicados({ agregados, omitidos, nube: sincronizadoNube });
    };
    reader.readAsArrayBuffer(file);
  };

  // Carga del Reporte "5 Mejores Ofertas de Licitación": alimenta el histórico
  // que consume LicitacionesCliente.
  const handleArchivoLicitacionesSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcesandoLicitaciones(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result as ArrayBuffer;
      const nuevos = procesarReporteLicitaciones(buffer);

      const { resultado, agregados, omitidos } = combinarMejoresOfertasConConteo(cargarMejoresOfertas(), nuevos);
      guardarMejoresOfertas(resultado);

      setMejoresOfertasData(resultado);
      setBaseLicitacionesCargada(true);
      setAlertaLicitaciones({ agregados, omitidos, nube: false });
      setProcesandoLicitaciones(false);
    };
    reader.readAsArrayBuffer(file);
  };

  // CARGA MÚLTIPLE: varios archivos de suscriptores a la vez (con DNI), sumados a
  // la cartera general compartida en localStorage.
  const [archivosMultipleProcesando, setArchivosMultipleProcesando] = useState(false);
  const [resultadoCargaMultiple, setResultadoCargaMultiple] = useState<{
    archivos: number;
    agregados: number;
    omitidos: number;
    nube: boolean;
    ultimosRegistros: ClienteCartera[];
    totalCartera: number;
  } | null>(null);

  const handleArchivosMultiplesSeleccionados = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const files = inputEl.files;
    if (!files || files.length === 0) return;

    setArchivosMultipleProcesando(true);

    let todosLosRegistros: ClienteCartera[] = [];
    for (const file of Array.from(files)) {
      const buffer = await leerArchivoComoBuffer(file);
      todosLosRegistros = todosLosRegistros.concat(procesarArchivoCartera(buffer));
    }

    const { resultado, agregados, omitidos } = combinarCarteraConConteo(cargarCartera(), todosLosRegistros);
    guardarCartera(resultado);
    setCarteraData(resultado);

    const sincronizadoNube = await guardarCarteraEnNube(todosLosRegistros);

    setResultadoCargaMultiple({
      archivos: files.length,
      agregados,
      omitidos,
      nube: sincronizadoNube,
      ultimosRegistros: todosLosRegistros.slice(0, 8),
      totalCartera: resultado.length,
    });
    setArchivosMultipleProcesando(false);
    inputEl.value = '';
  };

  const toggleContactado = (id: string) => {
    setContactadosMap(prev => ({
      ...prev,
      [id]: (!prev[id] || prev[id] === 'pendiente') ? 'contactado' : 'pendiente',
    }));
  };

  // Al hacer clic en el botón de WhatsApp se marca automáticamente como contactado
  // por ese medio, con su propio badge distintivo.
  const marcarWhatsappEnviado = (id: string) => {
    setContactadosMap(prev => ({ ...prev, [id]: 'whatsapp' }));
  };

  // Filtrado en tiempo real por búsqueda
  const clientesFiltrados = clientesData.filter(cliente => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      cliente.suscripcion.toLowerCase().includes(query) ||
      cliente.titular.toLowerCase().includes(query)
    );
  });

  const listaOportunidades = clientesData.filter(c => c.esOportunidad);

  // === MÉTRICAS INTERNAS PARA LA PESTAÑA ESTADÍSTICAS ===
  // Cartera vigente: excluye a quienes ya rescindieron o finalizaron el plan.
  const carteraVigente = carteraData.filter((c) => {
    const estado = c.estado.toUpperCase();
    return !estado.includes('RESCINDIDO') && !estado.includes('FINALIZ');
  });
  const clientesMorosos = clientesData.filter((c) => c.moroso).length;
  const indiceMorosidad = clientesData.length > 0 ? (clientesMorosos / clientesData.length) * 100 : 0;
  // Índice de conversión: proporción de la cartera cargada que efectivamente se adjudicó.
  const indiceConversion = carteraData.length > 0 ? (adjudicadosData.length / carteraData.length) * 100 : 0;

  // Vista activa dentro del selector de 4 pestañas de Mercado Nacional.
  const [vistaMercado, setVistaMercado] = useState<'suscripciones' | 'facturacion' | 'conversion' | 'mercadoTotal'>('suscripciones');

  // Trae la vista pedida (Suscripciones/FC/Conversión) desde la sincronización en
  // vivo si existe; si no, cae al snapshot de referencia real relevado manualmente
  // (ver comentario en estadisticasMercado.ts). Misma forma en ambos casos.
  const obtenerVistaMetrica = (clave: 'suscripciones' | 'facturacion' | 'conversion') => {
    if (ccaStats) {
      const m = ccaStats[clave];
      return {
        total: m.total,
        marcaLider: m.marcaLider,
        variacionMensual: m.variacionMensual,
        promedioMensual: m.promedioMensual,
        ranking: m.ranking,
      };
    }
    return ESTADISTICAS_MERCADO_DEFAULT[clave];
  };

  const vistaMercadoTotalActual = ccaStats
    ? {
        suscripciones: ccaStats.mercadoTotal.suscripciones,
        facturacion: ccaStats.mercadoTotal.facturacion,
        conversionPromedio: ccaStats.mercadoTotal.conversionPct,
        // La evolución mes a mes no forma parte de lo que sincroniza el proxy hoy;
        // se usa siempre el dato de referencia cargado a mano (ver estadisticasMercado.ts).
        evolucionConversion: ESTADISTICAS_MERCADO_DEFAULT.mercadoTotal.evolucionConversion,
      }
    : ESTADISTICAS_MERCADO_DEFAULT.mercadoTotal;

  const vistaActual =
    vistaMercado === 'mercadoTotal' ? null : obtenerVistaMetrica(vistaMercado);
  const { posicion: posicionRenault, datos: datosRenault } = vistaActual
    ? posicionMarcaPropia(vistaActual.ranking)
    : { posicion: 0, datos: undefined };
  const valorMaximoRanking = vistaActual ? Math.max(...vistaActual.ranking.map((m) => m.valor), 1) : 1;

  // === FILTRO POR MARCA Y COMPARATIVA INTERNA vs. RENAULT ===
  // null = "Todas" (vista normal por pestañas); con una marca elegida se reemplaza
  // el panel por la comparativa frente a frente, sin importar qué pestaña estaba activa.
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<string | null>(null);
  // Selector "Mirando ahora: <marca> ▾" dentro del panel Comparativa, para cambiar
  // de competidor sin salir de la vista ni volver a la franja de filtro de arriba.
  const [dropdownMarcaAbierto, setDropdownMarcaAbierto] = useState(false);

  const MARCAS_FILTRO = ['RENAULT', 'FIAT', 'TOYOTA', 'VOLKSWAGEN', 'PEUGEOT', 'CHEVROLET', 'FORD', 'NISSAN'];
  // Mismo listado sin Renault: es el que se ofrece para "cambiar de competidor",
  // porque Renault siempre queda fijo en su propio cuadrito al lado.
  const MARCAS_COMPETIDORAS = MARCAS_FILTRO.filter((m) => m !== 'RENAULT');
  const formatoMarca = (marca: string): string => marca.charAt(0) + marca.slice(1).toLowerCase();

  const valorDeMarca = (ranking: ItemRanking[], marca: string): number =>
    ranking.find((r) => r.marca === marca)?.valor ?? 0;

  const posicionDeMarca = (ranking: ItemRanking[], marca: string): number | null => {
    const ordenado = [...ranking].sort((a, b) => b.valor - a.valor);
    const indice = ordenado.findIndex((r) => r.marca === marca);
    return indice === -1 ? null : indice + 1;
  };

  const promedioRanking = (ranking: ItemRanking[]): number =>
    ranking.length > 0 ? ranking.reduce((acc, r) => acc + r.valor, 0) / ranking.length : 0;

  // Trae Suscripciones/FC/Conversión completas (no sólo la pestaña activa), porque
  // la comparativa muestra las 3 métricas a la vez para la marca elegida.
  const vistaSuscripciones = obtenerVistaMetrica('suscripciones');
  const vistaFacturacion = obtenerVistaMetrica('facturacion');
  const vistaConversion = obtenerVistaMetrica('conversion');

  const comparativaMarca = marcaSeleccionada
    ? {
        suscripciones: {
          marca: valorDeMarca(vistaSuscripciones.ranking, marcaSeleccionada),
          renault: valorDeMarca(vistaSuscripciones.ranking, 'RENAULT'),
          promedio: promedioRanking(vistaSuscripciones.ranking),
        },
        facturacion: {
          marca: valorDeMarca(vistaFacturacion.ranking, marcaSeleccionada),
          renault: valorDeMarca(vistaFacturacion.ranking, 'RENAULT'),
          promedio: promedioRanking(vistaFacturacion.ranking),
        },
        conversion: {
          marca: valorDeMarca(vistaConversion.ranking, marcaSeleccionada),
          renault: valorDeMarca(vistaConversion.ranking, 'RENAULT'),
          promedio: promedioRanking(vistaConversion.ranking),
        },
        // "Puesto en el Ranking Nacional" toma Suscripciones como métrica de referencia
        // (la misma que usa CCA como pestaña por defecto).
        puestoNacional: posicionDeMarca(vistaSuscripciones.ranking, marcaSeleccionada),
      }
    : null;

  // Ficha completa por adjudicado: cruza el reporte de Adjudicados con la Cartera
  // General (por Grupo y Orden) para completar DNI y Teléfono, y traduce el modelo
  // SAP a lenguaje comercial para mostrar en la tabla.
  const fichasCompletas: FichaCliente[] = adjudicadosData.map((adj) => {
    const cartera = carteraData.find((c) => c.grupoOrden === adj.grupoOrden);
    const modeloRaw = adj.modeloAdjudicado || adj.modeloSuscripto;
    return {
      grupoOrden: adj.grupoOrden,
      nombre: adj.titular || cartera?.nombre || 'Sin datos',
      dni: cartera?.dni || '',
      telefono: cartera?.telefono || '',
      estado: adj.estadoAdjudicacion || cartera?.estado || 'Sin datos',
      modeloComercial: modeloRaw ? formatearModeloCliente(traducirModeloSAP(modeloRaw)) : '-',
      fechaAdjudicacion: adj.fechaAdjudicacion || '-',
      modalidadGanadora: adj.modalidadGanadora || '-',
      domicilio: adj.domicilio,
      localidad: adj.localidad,
      provincia: adj.provincia,
      codigoPostal: adj.codigoPostal,
      codigoPin: adj.codigoPin,
      email: adj.email,
    };
  });

  // Badge de tipo de suscripción: DIGITAL en azul neón, FÍSICA en degradé verde/morado.
  const BadgeSuscripcion = ({ codigo }: { codigo: string }) => {
    const esDigital = codigo.toUpperCase().startsWith('D');
    return esDigital ? (
      <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.7)] w-fit">
        <Zap className="h-2.5 w-2.5 fill-white" /> DIGITAL
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-purple-600 text-white shadow-sm w-fit">
        FÍSICA
      </span>
    );
  };

  // Flechita de tendencia (verde ↗ si es positiva, roja ↘ si es negativa) usada
  // tanto en las métricas internas como en las de mercado nacional.
  const IndicadorTendencia = ({ valor }: { valor: number }) => {
    const esPositivo = valor >= 0;
    const Icono = esPositivo ? TrendingUp : TrendingDown;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-black ${esPositivo ? 'text-green-600' : 'text-red-600'}`}>
        <Icono className="h-3.5 w-3.5" /> {esPositivo ? '+' : ''}{valor.toFixed(1)}%
      </span>
    );
  };

  // Tarjeta genérica de indicador para la pestaña Estadísticas.
  const TarjetaMetrica = ({
    icono: Icono, colorIcono, colorFondo, titulo, valor, tendencia, subtexto, destacada,
  }: {
    icono: typeof Users;
    colorIcono: string;
    colorFondo: string;
    titulo: string;
    valor: string;
    tendencia?: number;
    subtexto?: string;
    destacada?: boolean;
  }) => (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}
      className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden ${
        destacada ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`${colorFondo} p-2 rounded-xl`}>
          <Icono className={`h-6 w-6 ${colorIcono}`} />
        </div>
        {tendencia !== undefined && <IndicadorTendencia valor={tendencia} />}
      </div>
      <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${destacada ? 'text-gray-300' : 'text-gray-500'}`}>{titulo}</h3>
      <p className="text-3xl font-black">{valor}</p>
      {subtexto && <p className={`text-xs font-medium mt-1 ${destacada ? 'text-gray-400' : 'text-gray-500'}`}>{subtexto}</p>}
    </motion.div>
  );

  // Estado vacío para las secciones de CCA que sólo existen con datos en vivo
  // (Facturación, Conversión, Mercado Total): a diferencia de Suscripciones, no hay
  // un dato de referencia inventado para éstas, así que antes de sincronizar se
  // muestra este aviso en vez de un número fabricado.
  // Variante oscura de IndicadorTendencia, para usar sobre el panel #0B0F19 de
  // Mercado Nacional (los tonos green-600/red-600 de la variante clara pierden
  // contraste ahí).
  const IndicadorTendenciaOscura = ({ valor }: { valor: number }) => {
    const esPositivo = valor >= 0;
    const Icono = esPositivo ? TrendingUp : TrendingDown;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-black ${esPositivo ? 'text-green-400' : 'text-red-400'}`}>
        <Icono className="h-3.5 w-3.5" /> {esPositivo ? '+' : ''}{valor.toFixed(1)}%
      </span>
    );
  };

  // Tarjeta KPI del panel oscuro de Mercado Nacional. Renault (destacada) se resalta
  // con acento dorado (#FFCC00 vía yellow-400/500) en vez del fondo gris-900 que usa
  // la variante clara TarjetaMetrica.
  const TarjetaKPIOscura = ({
    icono: Icono, titulo, valor, tendencia, subtexto, destacada, onClick,
  }: {
    icono: typeof Users;
    titulo: string;
    valor: string;
    tendencia?: number;
    subtexto?: string;
    destacada?: boolean;
    onClick?: () => void;
  }) => (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`p-5 rounded-2xl border relative overflow-hidden ${onClick ? 'cursor-pointer hover:border-yellow-500/40' : ''} ${
        destacada ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_24px_rgba(255,204,0,0.15)]' : 'bg-white/5 border-white/10'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-xl ${destacada ? 'bg-yellow-500/20' : 'bg-white/10'}`}>
          <Icono className={`h-5 w-5 ${destacada ? 'text-yellow-400' : 'text-gray-300'}`} />
        </div>
        {tendencia !== undefined && <IndicadorTendenciaOscura valor={tendencia} />}
      </div>
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">{titulo}</h3>
      <p className={`text-2xl font-black ${destacada ? 'text-yellow-400' : 'text-white'}`}>{valor}</p>
      {subtexto && <p className="text-xs font-medium text-gray-500 mt-1">{subtexto}</p>}
    </motion.div>
  );

  // Formatea según la métrica: Conversión va en % con 2 decimales, el resto como
  // cantidad entera localizada.
  const formatoValorMercado = (valor: number, sufijo: string): string =>
    sufijo === '%' ? `${valor.toFixed(2)}%` : valor.toLocaleString('es-AR', { maximumFractionDigits: 0 });

  // Mini tarjeta "marca vs Renault" de la vista Comparativa: dos barras apiladas,
  // la más alta resaltada en blanco/dorado según quién gane esa métrica.
  const TarjetaComparativa = ({
    titulo, nombreMarca, valorMarca, valorRenault, sufijo,
  }: {
    titulo: string;
    nombreMarca: string;
    valorMarca: number;
    valorRenault: number;
    sufijo: string;
  }) => {
    const maximo = Math.max(valorMarca, valorRenault, 1);
    const marcaGana = valorMarca > valorRenault;
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">{titulo}</p>
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-300 truncate pr-2">{nombreMarca}</span>
            <span className={`text-sm font-black shrink-0 ${marcaGana ? 'text-white' : 'text-gray-500'}`}>
              {formatoValorMercado(valorMarca, sufijo)}
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white/50 rounded-full" style={{ width: `${(valorMarca / maximo) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
              <Crown className="h-3 w-3 fill-yellow-400" /> Renault
            </span>
            <span className={`text-sm font-black shrink-0 ${!marcaGana ? 'text-yellow-400' : 'text-gray-500'}`}>
              {formatoValorMercado(valorRenault, sufijo)}
            </span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${(valorRenault / maximo) * 100}%` }} />
          </div>
        </div>
      </div>
    );
  };

  // Fila de la barra comparativa "frente a frente": Marca elegida vs. Renault vs.
  // Promedio del Mercado, para una métrica puntual (Suscripciones/FC/Conversión).
  const FilaComparativaTriple = ({
    etiqueta, nombreMarca, valorMarca, valorRenault, valorPromedio, sufijo,
  }: {
    etiqueta: string;
    nombreMarca: string;
    valorMarca: number;
    valorRenault: number;
    valorPromedio: number;
    sufijo: string;
  }) => {
    const maximo = Math.max(valorMarca, valorRenault, valorPromedio, 1);
    const filas = [
      { nombre: nombreMarca, valor: valorMarca, color: 'bg-white/50' },
      { nombre: 'Renault — Plan Rombo', valor: valorRenault, color: 'bg-yellow-400' },
      { nombre: 'Promedio del Mercado', valor: valorPromedio, color: 'bg-sky-400/70' },
    ];
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">{etiqueta}</p>
        <div className="space-y-2.5">
          {filas.map((fila) => (
            <div key={fila.nombre}>
              <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
                <span>{fila.nombre}</span>
                <span>{formatoValorMercado(fila.valor, sufijo)}</span>
              </div>
              <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(fila.valor / maximo) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className={`h-full rounded-full ${fila.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Gráfico de línea en SVG puro (sin librerías nuevas) para series cortas de puntos
  // mensuales. Pensado para el tema oscuro: fondo transparente, línea/relleno dorado
  // por defecto (acento de Renault / Plan Rombo), etiquetas claras.
  const GraficoLineasSVG = ({
    puntos, colorLinea = '#FFCC00', sufijo = '%',
  }: {
    puntos: { etiqueta: string; valor: number }[];
    colorLinea?: string;
    sufijo?: string;
  }) => {
    const ancho = 560;
    const alto = 190;
    const margen = { top: 26, right: 16, bottom: 28, left: 16 };
    const valores = puntos.map((p) => p.valor);
    const max = Math.max(...valores);
    const min = Math.min(...valores);
    const rango = max - min || 1;
    const pasoX = (ancho - margen.left - margen.right) / Math.max(puntos.length - 1, 1);

    const coords = puntos.map((p, i) => ({
      x: margen.left + i * pasoX,
      y: margen.top + (1 - (p.valor - min) / rango) * (alto - margen.top - margen.bottom),
      ...p,
    }));

    const lineaPath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
    const base = alto - margen.bottom;
    const areaPath = `${lineaPath} L ${coords[coords.length - 1].x.toFixed(1)} ${base} L ${coords[0].x.toFixed(1)} ${base} Z`;
    const gradientId = `gradienteEvolucion-${sufijo === '%' ? 'pct' : 'num'}`;

    return (
      <svg viewBox={`0 0 ${ancho} ${alto}`} className="w-full h-auto" role="img" aria-label="Gráfico de evolución mensual">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorLinea} stopOpacity="0.35" />
            <stop offset="100%" stopColor={colorLinea} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={lineaPath} fill="none" stroke={colorLinea} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c) => (
          <g key={c.etiqueta}>
            <circle cx={c.x} cy={c.y} r="3.5" fill={colorLinea} />
            <text x={c.x} y={alto - 8} textAnchor="middle" fontSize="10" fill="#9CA3AF" fontWeight={700}>{c.etiqueta}</text>
            <text x={c.x} y={c.y - 10} textAnchor="middle" fontSize="10" fill="#F3F4F6" fontWeight={800}>{c.valor.toFixed(1)}{sufijo}</text>
          </g>
        ))}
      </svg>
    );
  };

  // Banner reutilizable de resultado de carga con alerta de duplicados
  const BannerAlerta = ({ alerta }: { alerta: AlertaCarga }) => {
    if (!alerta) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`rounded-2xl p-4 flex items-start gap-3 border ${
          alerta.omitidos > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
        }`}
      >
        {alerta.omitidos > 0 ? (
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p className={`text-sm font-bold ${alerta.omitidos > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
            Se procesaron {alerta.agregados} nuevos registros. Se omitieron {alerta.omitidos} registros ya existentes.
          </p>
          {/* La sincronización con la nube es "best effort" y silenciosa: si falla o
              todavía no está configurada, el guardado local ya ocurrió igual y es
              instantáneo — no hace falta mostrarle una advertencia al admin por eso.
              Sólo confirmamos cuando SÍ se sincronizó, como dato positivo extra. */}
          {nubeConfigurada && alerta.nube && (
            <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mt-1">
              <Cloud className="h-3.5 w-3.5" /> Sincronizado con la nube (Supabase)
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-gray-50 p-4 sm:p-8 pb-32"
    >
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Hola, Nahuel <Zap className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            </h1>
            <p className="text-gray-500 font-medium mt-1">Panel de Administración - Ruiz Automotores.</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleLimpiarCartera}
              className="bg-white hover:bg-red-50 text-red-600 border border-red-200 px-5 py-3 rounded-xl font-bold transition-colors shadow-sm flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> Limpiar Cartera
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-6 py-3 rounded-xl font-black transition-colors shadow-md flex items-center gap-2">
              <Plus className="h-5 w-5" /> Nuevo Suscriptor
            </motion.button>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-4 border-b border-gray-200 pb-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cartera')}
            className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-xl transition-colors whitespace-nowrap ${
              activeTab === 'cartera'
                ? 'bg-white text-gray-900 border-t border-x border-gray-200 shadow-sm relative top-[1px]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Cartera de Clientes
          </button>
          <button
            onClick={() => setActiveTab('operativo')}
            className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-xl transition-colors whitespace-nowrap ${
              activeTab === 'operativo'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Control Operativo
          </button>
          <button
            onClick={() => setActiveTab('licitaciones')}
            className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-xl transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'licitaciones'
                ? 'bg-white text-gray-900 border-t border-x border-gray-200 shadow-sm relative top-[1px]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Award className="h-4 w-4" /> Licitaciones
          </button>
          <button
            onClick={() => setActiveTab('estadisticas')}
            className={`px-4 sm:px-6 py-3 font-bold text-sm sm:text-base rounded-t-xl transition-colors whitespace-nowrap ${
              activeTab === 'estadisticas'
                ? 'bg-white text-gray-900 border-t border-x border-gray-200 shadow-sm relative top-[1px]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Estadísticas
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
      <AnimatePresence mode="wait">

        {/* === TAB CARTERA === */}
        {activeTab === 'cartera' && (
          <motion.div
            key="tab-cartera"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="flex gap-2 bg-gray-200/50 p-1 rounded-xl w-fit">
              <button
                onClick={() => setSubTabCartera('general')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                  subTabCartera === 'general'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Base General
              </button>
              <button
                onClick={() => setSubTabCartera('adjudicados')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                  subTabCartera === 'adjudicados'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Trophy className="h-4 w-4" /> Actos y Adjudicados
              </button>
              <button
                onClick={() => setSubTabCartera('multiple')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                  subTabCartera === 'multiple'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Files className="h-4 w-4" /> Carga Múltiple
              </button>
            </div>

            {subTabCartera === 'general' && (
              <div className="space-y-4">
                <AnimatePresence>
                  <BannerAlerta key="alerta-general" alerta={alertaGeneral} />
                </AnimatePresence>

                {!baseDatosCargada ? (
                  <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border-2 border-dashed border-gray-300 text-center flex flex-col items-center justify-center min-h-[400px] transition-colors hover:border-yellow-500 hover:bg-yellow-50/50 group">
                    <div className="bg-gray-100 p-4 rounded-full mb-6 group-hover:bg-yellow-100 transition-colors">
                      <UploadCloud className="h-12 w-12 text-gray-400 group-hover:text-yellow-600 transition-colors" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">Cargar Base General</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto text-sm">Subí tu archivo de suscriptores (.xlsx o .csv). El sistema mapeará tus columnas exactas y sumará los registros a la cartera guardada — nunca la reemplaza.</p>
                    <motion.label whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="cursor-pointer bg-gray-900 hover:bg-gray-800 text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-md flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5" /> Seleccionar Archivo
                      <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleArchivoGeneralSeleccionado} />
                    </motion.label>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50/50">
                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-80">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por SUSCRIPCIÓN, TITULAR..."
                            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:border-gray-900 focus:ring-1 focus:ring-yellow-500 transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full lg:w-auto gap-4">
                         <motion.button
                           whileHover={{ scale: 1.05 }}
                           whileTap={{ scale: 0.96 }}
                           onClick={() => setModalOportunidadesOpen(true)}
                           className="text-xs font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm border border-orange-200 transition-colors cursor-pointer"
                         >
                           <Target className="h-4 w-4"/> {oportunidadesDetectadas} Oportunidades
                         </motion.button>
                         <label className="cursor-pointer text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                           <RefreshCw className="h-3 w-3" /> Sumar otro archivo
                           <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleArchivoGeneralSeleccionado} />
                         </label>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="sticky top-0 z-10 bg-white">
                          <tr className="border-b border-gray-200 shadow-sm">
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">SUSCRIPCIÓN</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">NOMBRE DEL CLIENTE</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">ESTADO DEL CONTRATO</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">SITUACIÓN VEHÍCULO</th>
                            <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right bg-white">ACCIÓN</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                          {clientesFiltrados.slice(0, 100).map((row) => {
                            const yaContactado = (contactadosMap[row.id] || 'pendiente') !== 'pendiente';

                            return (
                              <tr key={row.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="py-3 px-6">
                                  <div className="flex flex-col gap-1">
                                    <BadgeSuscripcion codigo={row.suscripcion} />
                                    <span className="font-black text-gray-900">{row.suscripcion}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-6 font-bold text-gray-800">{row.titular}</td>
                                <td className="py-3 px-6">
                                  <span className={`text-[11px] font-bold px-3 py-1.5 rounded-full border ${
                                    row.estado.includes('Ahorrista') ? 'bg-green-50 text-green-700 border-green-200' :
                                    row.estado.includes('Adjudicado') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                    row.estado.includes('Rescindido') ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-gray-100 text-gray-600 border-gray-200'
                                  }`}>
                                    {row.estado}
                                  </span>
                                </td>
                                <td className="py-3 px-6">
                                  {row.esOportunidad ? (
                                    <div className="flex flex-col gap-0.5 items-start">
                                      <span className="bg-orange-100 text-orange-800 text-[10px] font-black px-2.5 py-1 rounded-md border border-orange-200 flex items-center gap-1.5 w-fit">
                                        <span className="h-1.5 w-1.5 rounded-full bg-orange-600 animate-pulse"></span>ÚLTIMAS CUOTAS VIGENTES
                                      </span>
                                      <span className="text-[9px] text-orange-600 font-bold ml-1">Oportunidad de entrega</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-700 font-medium">{row.modelo || '-'}</span>
                                  )}
                                </td>
                                <td className="py-3 px-6 text-right">
                                  <button onClick={() => toggleContactado(row.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${yaContactado ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}>
                                    {yaContactado ? '✓ Contactado' : 'Pendiente'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ADJUDICADOS */}
            {subTabCartera === 'adjudicados' && (
              <div className="space-y-4">
                <AnimatePresence>
                  <BannerAlerta key="alerta-adjudicados" alerta={alertaAdjudicados} />
                </AnimatePresence>

                {!baseAdjudicadosCargada ? (
                  <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border-2 border-dashed border-gray-300 text-center flex flex-col items-center justify-center min-h-[400px] transition-colors hover:border-yellow-500 hover:bg-yellow-50/50 group">
                    <div className="bg-gray-100 p-4 rounded-full mb-6 group-hover:bg-yellow-100 transition-colors">
                      <Trophy className="h-12 w-12 text-gray-400 group-hover:text-yellow-500 transition-colors" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">Cargar Reporte SAP de Adjudicados</h3>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto text-sm">Subí el reporte de adjudicados (Grupo y Orden, F. Adju., Titular, domicilio y demás campos). Se suma al histórico guardado.</p>
                    <motion.label whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-8 py-3.5 rounded-xl font-black transition-colors shadow-md mt-4 inline-block">
                      Seleccionar Archivo
                      <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleArchivoAdjudicadosSeleccionado} />
                    </motion.label>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-black text-gray-900 flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500"/> Adjudicados ({fichasCompletas.length})</h3>
                      <label className="cursor-pointer text-xs font-bold text-gray-500 hover:text-gray-900 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5">
                        <RefreshCw className="h-3 w-3" /> Sumar otro archivo
                        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleArchivoAdjudicadosSeleccionado} />
                      </label>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead className="sticky top-0 z-10 bg-white">
                          <tr className="border-b border-gray-200 shadow-sm">
                            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">SUSCRIPCIÓN</th>
                            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">NOMBRE DEL CLIENTE</th>
                            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">DNI / TELÉFONO</th>
                            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">ESTADO DEL CONTRATO</th>
                            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">MODELO</th>
                            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">FECHA ADJUDICACIÓN / MODALIDAD</th>
                            <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right bg-white">ACCIÓN</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                          {fichasCompletas.slice(0, 100).map((ficha, index) => {
                            const key = ficha.grupoOrden || `ficha-${index}`;
                            const estadoContacto = contactadosMap[key] || 'pendiente';
                            const mensajeWa = encodeURIComponent(`Hola ${ficha.nombre}, te contacto de Ruiz Automotores sobre tu Plan Rombo (Suscripción ${ficha.grupoOrden}).`);
                            const linkWa = ficha.telefono ? `https://wa.me/${ficha.telefono}?text=${mensajeWa}` : null;

                            return (
                              <tr key={key} className="hover:bg-gray-50 transition-colors group">
                                <td className="py-3 px-4">
                                  <div className="flex flex-col gap-1">
                                    {ficha.grupoOrden && <BadgeSuscripcion codigo={ficha.grupoOrden} />}
                                    <span className="font-black text-gray-900">{ficha.grupoOrden || '-'}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-bold text-gray-700">{ficha.nombre}</td>
                                <td className="py-3 px-4 text-gray-600">
                                  <div>{ficha.dni || 'DNI s/d'}</div>
                                  <div className="text-xs text-gray-400">{ficha.telefono || 'Tel. s/d'}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="text-[11px] font-bold px-3 py-1.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                                    {ficha.estado}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-700 font-medium">{ficha.modeloComercial}</td>
                                <td className="py-3 px-4 text-gray-700">
                                  <div>{ficha.fechaAdjudicacion}</div>
                                  <div className="text-xs text-gray-400">{ficha.modalidadGanadora}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {estadoContacto === 'whatsapp' ? (
                                      <button onClick={() => toggleContactado(key)} title="Marcar como pendiente" className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">
                                        ✓ WhatsApp Enviado
                                      </button>
                                    ) : (
                                      <button onClick={() => toggleContactado(key)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${estadoContacto === 'contactado' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}>
                                        {estadoContacto === 'contactado' ? '✓ Contactado' : 'Pendiente'}
                                      </button>
                                    )}
                                    {linkWa ? (
                                      <a
                                        href={linkWa}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Enviar WhatsApp"
                                        onClick={() => marcarWhatsappEnviado(key)}
                                        className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                      >
                                        <MessageCircle className="h-4 w-4" />
                                      </a>
                                    ) : (
                                      <span title="Sin teléfono registrado" className="p-1.5 bg-gray-100 text-gray-300 rounded-lg">
                                        <MessageCircle className="h-4 w-4" />
                                      </span>
                                    )}
                                    <button onClick={() => setFichaSeleccionada(ficha)} title="Ver Ficha Completa" className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* CARGA MÚLTIPLE */}
            {subTabCartera === 'multiple' && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border-2 border-dashed border-gray-300 text-center flex flex-col items-center justify-center min-h-[320px] transition-colors hover:border-yellow-500 hover:bg-yellow-50/50 group">
                  <div className="bg-gray-100 p-4 rounded-full mb-6 group-hover:bg-yellow-100 transition-colors">
                    <Files className="h-12 w-12 text-gray-400 group-hover:text-yellow-600 transition-colors" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">Carga Múltiple de Archivos</h3>
                  <p className="text-gray-500 mb-8 max-w-lg mx-auto text-sm">
                    Seleccioná varios archivos de suscriptores a la vez (con DNI). Todos se suman a la cartera general guardada.
                  </p>
                  <motion.label
                    whileHover={{ scale: archivosMultipleProcesando ? 1 : 1.05 }}
                    whileTap={{ scale: archivosMultipleProcesando ? 1 : 0.97 }}
                    className={`cursor-pointer bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-md flex items-center gap-3 ${archivosMultipleProcesando ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <RefreshCw className={`h-5 w-5 ${archivosMultipleProcesando ? 'animate-spin' : ''}`} />
                    {archivosMultipleProcesando ? 'Procesando archivos...' : 'Seleccionar Archivos'}
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      multiple
                      disabled={archivosMultipleProcesando}
                      className="hidden"
                      onChange={handleArchivosMultiplesSeleccionados}
                    />
                  </motion.label>
                </div>

                <AnimatePresence>
                  {resultadoCargaMultiple && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sm:p-8"
                    >
                      <BannerAlerta alerta={{ agregados: resultadoCargaMultiple.agregados, omitidos: resultadoCargaMultiple.omitidos, nube: resultadoCargaMultiple.nube }} />

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Archivos</p>
                          <p className="text-2xl font-black text-gray-900">{resultadoCargaMultiple.archivos}</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Nuevos</p>
                          <p className="text-2xl font-black text-gray-900">{resultadoCargaMultiple.agregados}</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Cartera Total</p>
                          <p className="text-2xl font-black text-gray-900">{resultadoCargaMultiple.totalCartera}</p>
                        </div>
                      </div>

                      {resultadoCargaMultiple.ultimosRegistros.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                              <tr className="border-b border-gray-100">
                                <th className="py-2 px-3 text-xs font-bold text-gray-400 uppercase">Grupo y Orden</th>
                                <th className="py-2 px-3 text-xs font-bold text-gray-400 uppercase">DNI</th>
                                <th className="py-2 px-3 text-xs font-bold text-gray-400 uppercase">Nombre</th>
                                <th className="py-2 px-3 text-xs font-bold text-gray-400 uppercase">Teléfono</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-50">
                              {resultadoCargaMultiple.ultimosRegistros.map((r, i) => (
                                <tr key={i}>
                                  <td className="py-2 px-3 font-bold text-gray-900">{r.grupoOrden || '-'}</td>
                                  <td className="py-2 px-3 text-gray-600">{r.dni || '-'}</td>
                                  <td className="py-2 px-3 text-gray-700">{r.nombre || '-'}</td>
                                  <td className="py-2 px-3 text-gray-600">{r.telefono}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* === TAB OPERATIVO === */}
        {activeTab === 'operativo' && (
          <motion.div
            key="tab-operativo"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Control Operativo y Comercial</h2>
                <p className="text-gray-500 text-sm mt-1">Gestión de condiciones de cambio de modelo y morosidad de la agencia.</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200">
              <h3 className="text-lg font-black text-gray-900 mb-1">Condiciones Comerciales (Precios y Promociones)</h3>
              <p className="text-gray-500 text-sm mb-6">Estos valores se guardan en este dispositivo y se reflejan al instante en el panel del cliente.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Título de la Promoción</label>
                  <input
                    type="text"
                    value={condiciones.tituloPromo}
                    onChange={(e) => setCondiciones({ ...condiciones, tituloPromo: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-gray-900 focus:ring-1 focus:ring-yellow-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Plan Destacado</label>
                  <input
                    type="text"
                    value={condiciones.planDestacado}
                    onChange={(e) => setCondiciones({ ...condiciones, planDestacado: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-gray-900 focus:ring-1 focus:ring-yellow-500 transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Descripción / Condiciones</label>
                  <textarea
                    value={condiciones.descripcionPromo}
                    onChange={(e) => setCondiciones({ ...condiciones, descripcionPromo: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-gray-900 focus:ring-1 focus:ring-yellow-500 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Cuota Destacada</label>
                  <input
                    type="text"
                    value={condiciones.cuotaDestacada}
                    onChange={(e) => setCondiciones({ ...condiciones, cuotaDestacada: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-gray-900 focus:ring-1 focus:ring-yellow-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGuardarCondiciones}
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 px-6 py-3 rounded-xl font-black transition-colors shadow-md flex items-center gap-2"
                >
                  <Save className="h-4 w-4" /> Guardar Condiciones Comerciales
                </motion.button>
                <AnimatePresence>
                  {condicionesGuardadas && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-green-600 text-sm font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Cambios guardados
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* === TAB LICITACIONES === */}
        {activeTab === 'licitaciones' && (
          <motion.div
            key="tab-licitaciones"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-4"
          >
            <AnimatePresence>
              <BannerAlerta key="alerta-licitaciones" alerta={alertaLicitaciones} />
            </AnimatePresence>

            {!baseLicitacionesCargada ? (
              <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border-2 border-dashed border-gray-300 text-center flex flex-col items-center justify-center min-h-[400px] transition-colors hover:border-yellow-500 hover:bg-yellow-50/50 group">
                <div className="bg-gray-100 p-4 rounded-full mb-6 group-hover:bg-yellow-100 transition-colors">
                  <Award className="h-12 w-12 text-gray-400 group-hover:text-yellow-600 transition-colors" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">Cargar Reporte "5 Mejores Ofertas"</h3>
                <p className="text-gray-500 mb-8 max-w-md mx-auto text-sm">Subí el reporte de licitaciones (Grupo, Modelo, Fecha, % Financiación y las 5 mejores posiciones ofertadas). Alimenta el histórico que ve el cliente.</p>
                <motion.label
                  whileHover={{ scale: procesandoLicitaciones ? 1 : 1.05 }}
                  whileTap={{ scale: procesandoLicitaciones ? 1 : 0.97 }}
                  className={`cursor-pointer bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-md flex items-center gap-3 ${procesandoLicitaciones ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <RefreshCw className={`h-5 w-5 ${procesandoLicitaciones ? 'animate-spin' : ''}`} />
                  {procesandoLicitaciones ? 'Procesando...' : 'Seleccionar Archivo'}
                  <input type="file" accept=".xlsx, .xls, .csv" disabled={procesandoLicitaciones} className="hidden" onChange={handleArchivoLicitacionesSeleccionado} />
                </motion.label>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-black text-gray-900 flex items-center gap-2"><Award className="h-5 w-5 text-yellow-500"/> Histórico de Ofertas ({mejoresOfertasData.length})</h3>
                  <label className="cursor-pointer text-xs font-bold text-gray-500 hover:text-gray-900 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3" /> Sumar otro archivo
                    <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleArchivoLicitacionesSeleccionado} />
                  </label>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="border-b border-gray-200 shadow-sm">
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">GRUPO</th>
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">MODELO</th>
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">FECHA</th>
                        <th className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">% FINANC.</th>
                        {['1ER', '2DO', '3ER', '4TO', '5TO'].map((etiqueta) => (
                          <th key={etiqueta} className="py-4 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider bg-white">{etiqueta} PUESTO</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                      {mejoresOfertasData.slice(0, 100).map((oferta, index) => (
                        <tr key={`${oferta.grupo}-${oferta.fecha}-${index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-black text-gray-900">{oferta.grupo || '-'}</td>
                          <td className="py-3 px-4 text-gray-700">{oferta.modelo || '-'}</td>
                          <td className="py-3 px-4 text-gray-700">{oferta.fecha || '-'}</td>
                          <td className="py-3 px-4 text-gray-700">{oferta.porcentajeFinanciacion || '-'}</td>
                          {oferta.posiciones.map((pos) => (
                            <td key={pos.puesto} className="py-3 px-4">
                              <div className="font-bold text-gray-900">{pos.cuotaOfertada || '-'}</div>
                              {pos.modalidad && <div className="text-xs text-gray-400">{pos.modalidad}</div>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* === TAB ESTADISTICAS === */}
        {activeTab === 'estadisticas' && (
          <motion.div
            key="tab-estadisticas"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-10"
          >
            {/* === MÉTRICA INTERNA RUIZ AUTOMOTORES === */}
            <div>
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-gray-700" /> Métrica Interna — Ruiz Automotores
              </h2>
              <p className="text-gray-500 text-sm font-medium mb-4">Basada en la cartera y los reportes cargados en este panel.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <TarjetaMetrica
                  icono={Users}
                  colorIcono="text-blue-600"
                  colorFondo="bg-blue-50"
                  titulo="Cartera Activa Total"
                  valor={String(carteraVigente.length)}
                  subtexto={`${carteraData.length} suscriptores cargados en total`}
                />
                <TarjetaMetrica
                  icono={Target}
                  colorIcono="text-orange-600"
                  colorFondo="bg-orange-50"
                  titulo="Oportunidades Detectadas"
                  valor={String(oportunidadesDetectadas)}
                  subtexto="Últimas Cuotas / Vigente"
                />
                <TarjetaMetrica
                  icono={AlertTriangle}
                  colorIcono="text-red-600"
                  colorFondo="bg-red-50"
                  titulo="Morosidad (Cuotas Vencidas)"
                  valor={`${clientesMorosos}`}
                  subtexto={`${indiceMorosidad.toFixed(1)}% de la cartera cargada`}
                />
                <TarjetaMetrica
                  icono={Percent}
                  colorIcono="text-emerald-600"
                  colorFondo="bg-emerald-50"
                  titulo="Índice de Conversión"
                  valor={`${indiceConversion.toFixed(1)}%`}
                  subtexto="Cartera cargada que llegó a adjudicarse"
                />
              </div>
            </div>

            {/* === MÉTRICA DE MERCADO NACIONAL === */}
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-700" /> Métrica de Mercado Nacional
                </h2>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  {ESTADISTICAS_MERCADO_DEFAULT.periodo}
                </span>
              </div>
              <p className="text-gray-500 text-sm font-medium mb-4">Planes de ahorro 0km a nivel nacional (Fuente: CCA / PlaneroDeLey).</p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold">
                  {ccaStats ? (
                    <span className="text-green-700 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Sincronizado con CCA el {new Date(ccaStats.fechaSincronizacion).toLocaleString('es-AR')}
                    </span>
                  ) : (
                    <span className="text-yellow-700 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" /> Mostrando el snapshot de referencia (relevado {ESTADISTICAS_MERCADO_DEFAULT.fechaActualizacion}) — todavía no se sincronizó en vivo con CCA
                    </span>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: sincronizandoCCA ? 1 : 1.03 }}
                  whileTap={{ scale: sincronizandoCCA ? 1 : 0.97 }}
                  onClick={handleSincronizarCCA}
                  disabled={sincronizandoCCA}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-wait shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${sincronizandoCCA ? 'animate-spin' : ''}`} />
                  {sincronizandoCCA ? 'Sincronizando...' : 'Sincronizar Datos CCA Ahora'}
                </motion.button>
              </div>

              {errorSincronizacionCCA && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-2xl p-4 flex items-start gap-3 border bg-red-50 border-red-200"
                >
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-red-800">
                    No se pudo sincronizar con cca.com.ar: {errorSincronizacionCCA} Se muestran los últimos datos disponibles.
                  </p>
                </motion.div>
              )}

              {/* Filtro por marca: alterna entre la vista normal (Todas) y la
                  Comparativa Interna de una marca puntual vs. Renault. */}
              <div className="flex flex-wrap gap-2 mb-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMarcaSeleccionada(null)}
                  className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide transition-colors ${
                    marcaSeleccionada === null
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'bg-[#0B0F19] text-gray-300 hover:text-white border border-white/10'
                  }`}
                >
                  Todas
                </motion.button>
                {MARCAS_FILTRO.map((marca) => (
                  <motion.button
                    key={marca}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setMarcaSeleccionada(marca)}
                    className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide transition-colors flex items-center gap-1.5 ${
                      marcaSeleccionada === marca
                        ? 'bg-yellow-500 text-gray-900 shadow-md'
                        : 'bg-[#0B0F19] text-gray-300 hover:text-white border border-white/10'
                    }`}
                  >
                    {marca === 'RENAULT' && <Crown className="h-3.5 w-3.5" />} {formatoMarca(marca)}
                  </motion.button>
                ))}
              </div>

              {/* Selector de las 4 vistas de CCA — sólo tiene sentido con "Todas" activo,
                  la Comparativa de marca muestra las 3 métricas juntas. */}
              {!marcaSeleccionada && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {(
                    [
                      { clave: 'suscripciones', etiqueta: 'Suscripciones', icono: Users },
                      { clave: 'facturacion', etiqueta: 'FC (Facturación)', icono: Receipt },
                      { clave: 'conversion', etiqueta: 'Conversión', icono: Percent },
                      { clave: 'mercadoTotal', etiqueta: 'Mercado Total', icono: Layers },
                    ] as const
                  ).map(({ clave, etiqueta, icono: Icono }) => (
                    <motion.button
                      key={clave}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setVistaMercado(clave)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide transition-colors ${
                        vistaMercado === clave
                          ? 'bg-yellow-500 text-gray-900 shadow-md'
                          : 'bg-[#0B0F19] text-gray-300 hover:text-white border border-white/10'
                      }`}
                    >
                      <Icono className="h-4 w-4" /> {etiqueta}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Panel oscuro: Comparativa de marca si hay una elegida, si no la vista normal por pestañas */}
              <AnimatePresence mode="wait">
                {marcaSeleccionada && comparativaMarca ? (
                  <motion.div
                    key="comparativa"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="bg-[#0B0F19] rounded-3xl border border-white/10 shadow-2xl p-6"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Mirando ahora:</span>

                        {/* Selector "Mirando ahora: <marca> ▾" — cambia de competidor sin
                            salir de la Comparativa ni volver a la franja de filtro de arriba. */}
                        <div className="relative">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setDropdownMarcaAbierto((abierto) => !abierto)}
                            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl px-3.5 py-1.5 text-sm font-black text-white transition-colors"
                          >
                            {formatoMarca(marcaSeleccionada)}
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${dropdownMarcaAbierto ? 'rotate-180' : ''}`} />
                          </motion.button>

                          {dropdownMarcaAbierto && (
                            <div className="fixed inset-0 z-10" onClick={() => setDropdownMarcaAbierto(false)} />
                          )}
                          <AnimatePresence>
                            {dropdownMarcaAbierto && (
                              <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                className="absolute z-20 mt-2 w-52 bg-[#0B0F19] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1"
                              >
                                {MARCAS_COMPETIDORAS.map((marca) => (
                                  <button
                                    key={marca}
                                    onClick={() => { setMarcaSeleccionada(marca); setDropdownMarcaAbierto(false); }}
                                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                                      marca === marcaSeleccionada ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    {formatoMarca(marca)}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <span className="text-gray-500 text-xs font-bold uppercase">vs.</span>
                        <span className="flex items-center gap-1.5 text-sm font-black text-yellow-400">
                          <Crown className="h-4 w-4 fill-yellow-400" /> Renault — Plan Rombo
                        </span>
                      </div>
                      <button
                        onClick={() => setMarcaSeleccionada(null)}
                        className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Volver a Mercado Total
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <TarjetaComparativa
                        titulo="Suscripciones"
                        nombreMarca={marcaSeleccionada}
                        valorMarca={comparativaMarca.suscripciones.marca}
                        valorRenault={comparativaMarca.suscripciones.renault}
                        sufijo=""
                      />
                      <TarjetaComparativa
                        titulo="Facturación (FC)"
                        nombreMarca={marcaSeleccionada}
                        valorMarca={comparativaMarca.facturacion.marca}
                        valorRenault={comparativaMarca.facturacion.renault}
                        sufijo=""
                      />
                      <TarjetaComparativa
                        titulo="Tasa de Conversión"
                        nombreMarca={marcaSeleccionada}
                        valorMarca={comparativaMarca.conversion.marca}
                        valorRenault={comparativaMarca.conversion.renault}
                        sufijo="%"
                      />
                      <TarjetaKPIOscura
                        icono={Trophy}
                        titulo="Puesto Ranking Nacional"
                        valor={comparativaMarca.puestoNacional ? `${comparativaMarca.puestoNacional}°` : '-'}
                        subtexto={`${formatoMarca(marcaSeleccionada)} · Suscripciones`}
                        destacada
                      />
                    </div>

                    <h4 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-3">Comparativa Frente a Frente</h4>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <FilaComparativaTriple
                        etiqueta="Suscripciones"
                        nombreMarca={marcaSeleccionada}
                        valorMarca={comparativaMarca.suscripciones.marca}
                        valorRenault={comparativaMarca.suscripciones.renault}
                        valorPromedio={comparativaMarca.suscripciones.promedio}
                        sufijo=""
                      />
                      <FilaComparativaTriple
                        etiqueta="Facturación (FC)"
                        nombreMarca={marcaSeleccionada}
                        valorMarca={comparativaMarca.facturacion.marca}
                        valorRenault={comparativaMarca.facturacion.renault}
                        valorPromedio={comparativaMarca.facturacion.promedio}
                        sufijo=""
                      />
                      <FilaComparativaTriple
                        etiqueta="Conversión"
                        nombreMarca={marcaSeleccionada}
                        valorMarca={comparativaMarca.conversion.marca}
                        valorRenault={comparativaMarca.conversion.renault}
                        valorPromedio={comparativaMarca.conversion.promedio}
                        sufijo="%"
                      />
                    </div>
                  </motion.div>
                ) : (
                <motion.div
                  key={vistaMercado}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="bg-[#0B0F19] rounded-3xl border border-white/10 shadow-2xl p-6"
                >
                  {vistaMercado === 'mercadoTotal' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <TarjetaKPIOscura icono={Users} titulo="Total Mercado (Suscripciones)" valor={vistaMercadoTotalActual.suscripciones.toLocaleString('es-AR')} />
                        <TarjetaKPIOscura icono={Receipt} titulo="Total Facturación" valor={vistaMercadoTotalActual.facturacion.toLocaleString('es-AR')} />
                        <TarjetaKPIOscura icono={Percent} titulo="Conversión Promedio" valor={`${vistaMercadoTotalActual.conversionPromedio.toFixed(2)}%`} destacada />
                      </div>
                      <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                        <h3 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-1 flex items-center gap-2">
                          <LineChart className="h-4 w-4 text-yellow-400" /> Tendencia Mensual de Conversión
                        </h3>
                        <p className="text-[11px] text-gray-500 font-medium mb-3">
                          {ESTADISTICAS_MERCADO_DEFAULT.periodo} · dato cargado a mano (no forma parte de la sincronización automática todavía).
                        </p>
                        <GraficoLineasSVG
                          puntos={vistaMercadoTotalActual.evolucionConversion.map((p) => ({ etiqueta: p.mes, valor: p.valor }))}
                          colorLinea="#FFCC00"
                          sufijo="%"
                        />
                      </div>
                    </>
                  ) : vistaActual && (
                    <>
                      <div className={`grid grid-cols-1 sm:grid-cols-2 ${vistaActual.promedioMensual != null ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 mb-6`}>
                        <TarjetaKPIOscura
                          icono={vistaMercado === 'conversion' ? Percent : Users}
                          titulo={`Total ${ETIQUETAS_VISTA[vistaMercado]}`}
                          valor={vistaMercado === 'conversion' ? `${vistaActual.total.toFixed(2)}%` : vistaActual.total.toLocaleString('es-AR')}
                          tendencia={vistaActual.variacionMensual}
                          subtexto="vs. período anterior"
                        />
                        <TarjetaKPIOscura
                          icono={Crown}
                          titulo="Marca Líder"
                          valor={vistaActual.marcaLider}
                          subtexto="Ver comparativa vs. Renault"
                          onClick={() => setMarcaSeleccionada(vistaActual.marcaLider)}
                        />
                        {vistaActual.promedioMensual != null && (
                          <TarjetaKPIOscura icono={BarChart3} titulo="Promedio Mensual" valor={vistaActual.promedioMensual.toLocaleString('es-AR')} />
                        )}
                        <TarjetaKPIOscura
                          icono={Crown}
                          titulo="Renault"
                          valor={datosRenault ? (vistaMercado === 'conversion' ? `${datosRenault.valor.toFixed(2)}%` : datosRenault.valor.toLocaleString('es-AR')) : '-'}
                          subtexto={posicionRenault ? `Puesto ${posicionRenault}° del ranking` : undefined}
                          destacada
                        />
                      </div>

                      {vistaMercado === 'suscripciones' && (
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-6">
                          <h3 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-1 flex items-center gap-2">
                            <LineChart className="h-4 w-4 text-yellow-400" /> Resumen del Período ({ESTADISTICAS_MERCADO_DEFAULT.periodo})
                          </h3>
                          <p className="text-[11px] text-gray-500 font-medium mb-4">
                            No hay quiebre mes a mes disponible desde la sincronización automática: se compara el total real del período contra lo que resultaría de sostener el promedio mensual durante esos mismos 7 meses.
                          </p>
                          <div className="space-y-3">
                            {[
                              { etiqueta: 'Total real del período', valor: vistaActual.total },
                              { etiqueta: 'Promedio mensual × 7 meses', valor: (vistaActual.promedioMensual ?? 0) * 7 },
                            ].map((fila) => (
                              <div key={fila.etiqueta}>
                                <div className="flex justify-between text-xs font-bold text-gray-300 mb-1">
                                  <span>{fila.etiqueta}</span>
                                  <span>{fila.valor.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-400/70 rounded-full"
                                    style={{ width: `${Math.min((fila.valor / vistaActual.total) * 100, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        {/* Resumen lateral */}
                        <div className="lg:col-span-2 bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4 h-fit">
                          <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Resumen</h3>
                          <button
                            type="button"
                            onClick={() => setMarcaSeleccionada(vistaActual.marcaLider)}
                            title={`Ver comparativa de ${vistaActual.marcaLider} vs. Renault`}
                            className="w-full flex items-center gap-3 text-left rounded-xl hover:bg-white/5 -m-1 p-1 transition-colors"
                          >
                            <div className="bg-yellow-500/15 p-2 rounded-xl"><Crown className="h-5 w-5 text-yellow-400 fill-yellow-400" /></div>
                            <div>
                              <p className="text-[11px] font-bold text-gray-500 uppercase">Marca Líder</p>
                              <p className="text-lg font-black text-white">{vistaActual.marcaLider}</p>
                            </div>
                          </button>
                          <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-2 rounded-xl"><Building2 className="h-5 w-5 text-yellow-400" /></div>
                            <div>
                              <p className="text-[11px] font-bold text-gray-500 uppercase">Renault — Posición</p>
                              <p className="text-lg font-black text-yellow-400">
                                {posicionRenault > 0 ? `${posicionRenault}° lugar` : '-'}
                                {datosRenault && (
                                  <span className="text-sm text-gray-400 font-bold ml-1.5">
                                    ({vistaMercado === 'conversion' ? `${datosRenault.valor.toFixed(2)}%` : datosRenault.valor.toLocaleString('es-AR')})
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Ranking completo por marca */}
                        <div className="lg:col-span-3 bg-white/5 rounded-2xl border border-white/10 p-5">
                          <h3 className="text-xs font-black uppercase tracking-wide text-gray-400 mb-4">Ranking por Marca</h3>
                          <div className="space-y-3">
                            {vistaActual.ranking.map((item, idx) => {
                              const esRenault = item.marca === 'RENAULT';
                              return (
                                <button
                                  key={item.marca}
                                  type="button"
                                  onClick={() => setMarcaSeleccionada(item.marca)}
                                  title={`Ver comparativa de ${item.marca} vs. Renault`}
                                  className={`w-full text-left rounded-xl p-2.5 transition-colors hover:bg-white/10 ${esRenault ? 'bg-yellow-500/10 border border-yellow-500/40 shadow-[0_0_20px_rgba(255,204,0,0.25)]' : ''}`}
                                >
                                  <div className="flex items-center justify-between mb-1.5 gap-2">
                                    <span className={`text-sm font-black flex items-center gap-1.5 ${esRenault ? 'text-yellow-400' : 'text-gray-200'}`}>
                                      #{idx + 1} {item.marca}
                                      {esRenault && <Crown className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />}
                                    </span>
                                    <span className={`text-sm font-black ${esRenault ? 'text-yellow-400' : 'text-gray-300'}`}>
                                      {vistaMercado === 'conversion' ? `${item.valor.toFixed(2)}%` : item.valor.toLocaleString('es-AR')}
                                    </span>
                                  </div>
                                  <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(item.valor / valorMaximoRanking) * 100}%` }}
                                      transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.04 }}
                                      className={`h-full rounded-full ${esRenault ? 'bg-yellow-400' : 'bg-white/30'}`}
                                    />
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* LEYENDA OFICIAL DE LA FUENTE */}
            <p className="text-[11px] text-gray-400 font-medium text-center">
              Fuente: Datos de Mercado CCA (
              <a
                href="https://cca.com.ar/estadisticas/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                https://cca.com.ar/estadisticas/
              </a>
              ). Cifras de referencia — pendientes de actualización manual con los valores publicados.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* POP-UP OPORTUNIDADES */}
      <AnimatePresence>
      {modalOportunidadesOpen && (
        <motion.div
          key="modal-oportunidades"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col"
          >
            <div className="bg-orange-600 p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-black flex items-center gap-2"><Target className="h-6 w-6"/> Oportunidades ({oportunidadesDetectadas})</h2>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setModalOportunidadesOpen(false)} className="text-orange-200 hover:text-white transition-colors"><X className="h-6 w-6" /></motion.button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <div className="space-y-3">
                {listaOportunidades.map((op, idx) => {
                  const mensajeWa = encodeURIComponent(`Hola ${op.titular}, te contacto de Ruiz Automotores sobre tu Plan Rombo (Suscripción ${op.suscripcion}). Queremos ofrecerte opciones para tu renovación o entrega.`);
                  const linkWa = `https://wa.me/${op.telefono}?text=${mensajeWa}`;

                  return (
                    <motion.div
                      key={op.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.6), ease: 'easeOut' }}
                      whileHover={{ x: 4 }}
                      className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl font-black text-xs">{op.suscripcion}</div>
                        <div>
                          <h4 className="font-bold text-gray-900">{op.titular}</h4>
                          <p className="text-xs text-gray-500">Tel: {op.telefono}</p>
                        </div>
                      </div>
                      <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={linkWa} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                        WhatsApp <ExternalLink className="h-3 w-3" />
                      </motion.a>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* MODAL FICHA COMPLETA */}
      <AnimatePresence>
      {fichaSeleccionada && (
        <motion.div
          key="modal-ficha-completa"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[100]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
          >
            <div className="bg-gray-900 p-6 flex justify-between items-center text-white">
              <div>
                <h2 className="text-xl font-black flex items-center gap-2"><Eye className="h-5 w-5 text-yellow-500" /> Ficha Completa</h2>
                <p className="text-gray-400 text-sm mt-1">{fichaSeleccionada.nombre} · {fichaSeleccionada.grupoOrden}</p>
              </div>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setFichaSeleccionada(null)} className="text-gray-400 hover:text-white transition-colors"><X className="h-6 w-6" /></motion.button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Domicilio</p>
                  <p className="font-bold text-gray-900">{fichaSeleccionada.domicilio || 'Sin datos'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Localidad</p>
                  <p className="font-bold text-gray-900">{fichaSeleccionada.localidad || 'Sin datos'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Código Postal</p>
                  <p className="font-bold text-gray-900">{fichaSeleccionada.codigoPostal || 'Sin datos'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Provincia</p>
                  <p className="font-bold text-gray-900">{fichaSeleccionada.provincia || 'Sin datos'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Código PIN</p>
                  <p className="font-bold text-gray-900 font-mono">{fichaSeleccionada.codigoPin || 'Sin datos'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Email</p>
                <p className="font-bold text-gray-900">{fichaSeleccionada.email || 'Sin datos'}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
