import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award, CreditCard, Download, AlertTriangle, Info, Trophy, Lock, Bot, Phone, Send, X, User, MapPin, Mail, FileText, MessageSquare, ExternalLink, Sparkles, Play, Pause, Search, Cloud, Settings, Fuel, Package, Gauge, Activity, Briefcase
} from 'lucide-react';
import { CONDICIONES_STORAGE_KEY, cargarCondiciones } from '../utils/condicionesComerciales';
import { ClienteCartera } from '../utils/excelParser';
import { nubeConfigurada } from '../lib/supabase';
import { TOTAL_FOTOS_360, get360Frame, get360Cover } from '../utils/assets';

interface Props {
  clienteActivo?: ClienteCartera | null;
  onIrALicitaciones?: () => void;
}

// Mismo nombre de versión que usa App.tsx (versionesPorModelo.KARDIAN) — resuelve
// al mismo prefijo de archivo real vía src/utils/assets.ts.
const KARDIAN_VERSION_NOMBRE = 'Kardian Evolution 156 MT';

const CARACTERISTICAS_KARDIAN: { Icono: typeof Settings; label: string; valor: string }[] = [
  { Icono: Settings, label: 'Motor', valor: '1.6 SCe 156cv' },
  { Icono: Gauge, label: 'Transmisión', valor: 'Manual 5v' },
  { Icono: Activity, label: 'Tracción', valor: '4x2' },
  { Icono: Fuel, label: 'Consumo', valor: '14.5 km/l' },
  { Icono: Briefcase, label: 'Baúl', valor: '410 litros' },
  { Icono: Package, label: 'Equipamiento Clave', valor: 'Pantalla 7" Android Auto/CarPlay, cámara trasera' },
];

export default function DashboardCliente({ clienteActivo, onIrALicitaciones }: Props) {
  const [mostrarModalPagos, setMostrarModalPagos] = useState(false);
  const [mostrarModalLicitacion, setMostrarModalLicitacion] = useState(false);
  const [mostrarModalTalon, setMostrarModalTalon] = useState(false);

  // PERFIL DEL CLIENTE: datos reales si figura en la cartera cargada por el Admin,
  // con los datos de demostración como respaldo cuando no hay coincidencia.
  const nombreCompleto = clienteActivo?.nombre?.trim() || 'Juan Pérez';
  const primerNombre = nombreCompleto.split(' ')[0];
  const dni = clienteActivo?.dni?.trim() || '30123456';
  const dniDisplay = /^\d+$/.test(dni) ? dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : dni;
  const grupoOrden = clienteActivo?.grupoOrden?.trim() || 'P2GH169-T';
  const telefonoDisplay = clienteActivo?.telefono ? `+54 9 ${clienteActivo.telefono}` : '+54 9 381 555-1234';
  const esAdjudicado = !!clienteActivo?.mesAdjudicacion;
  const mesAdjudicacion = clienteActivo?.mesAdjudicacion;

  // CONDICIONES COMERCIALES (precios/promos editados desde el Panel Admin)
  const [condiciones, setCondiciones] = useState(() => cargarCondiciones());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONDICIONES_STORAGE_KEY) setCondiciones(cargarCondiciones());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // VISOR 360° CON GIRO AUTOMÁTICO (8 fotogramas universales, ver src/utils/assets.ts)
  // Sólo animación en bucle + botón de Pausa/Play — sin arrastre manual.
  const [rotacion, setRotacion] = useState(1);
  const [autoGirar, setAutoGirar] = useState(true);

  const grupoHabilitadoLicitacion = true; 

  const [menuRombitoAbierto, setMenuRombitoAbierto] = useState(false);
  const [chatRombitoAbierto, setChatRombitoAbierto] = useState(false);
  const [mensajeChat, setMensajeChat] = useState('');

  // ROMBITO AI: Barrera de Datos (validación de identidad obligatoria)
  const [identidadValidada, setIdentidadValidada] = useState(false);
  const [datoIdentidad, setDatoIdentidad] = useState('');

  const [historialChat, setHistorialChat] = useState<{ emisor: 'rombito' | 'user' | 'interno'; texto: string }[]>([
    { emisor: 'rombito', texto: '¡Hola! Soy Rombito 🤖, el asistente de Ruiz Automotores (Plan Rombo). Antes de ayudarte con tu plan necesito validar tu identidad: pasame tu **DNI** o tu **Grupo y Orden** (ej: 30123456 o P2GH169-T). 🔐' }
  ]);

  // Giro automático estilo GIF
  useEffect(() => {
    if (!autoGirar) return;
    const interval = setInterval(() => {
      setRotacion((prev) => (prev >= TOTAL_FOTOS_360 ? 1 : prev + 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [autoGirar]);

  // ROMBITO AI — Horarios de Atención (Lun-Vie 09-13 y 16-20, Sáb 09-13)
  const dentroDeHorario = (): boolean => {
    const ahora = new Date();
    const dia = ahora.getDay(); // 0=Dom ... 6=Sáb
    const horaDecimal = ahora.getHours() + ahora.getMinutes() / 60;
    if (dia >= 1 && dia <= 5) return (horaDecimal >= 9 && horaDecimal < 13) || (horaDecimal >= 16 && horaDecimal < 20);
    if (dia === 6) return horaDecimal >= 9 && horaDecimal < 13;
    return false;
  };

  const sufijoHorario = (): string => {
    if (dentroDeHorario()) return '\n\n🟢 Estamos en horario de atención, un asesor te va a responder en breve.';
    return '\n\n🔴 Estamos fuera de nuestro horario de atención (Lun a Vie 09:00-13:00 y 16:00-20:00, Sáb 09:00-13:00 hs). Un asesor te va a contactar apenas reabramos.';
  };

  // ROMBITO AI — Barrera de Datos: valida DNI o Grupo y Orden
  const pareceIdentidad = (texto: string): boolean => {
    const limpio = texto.trim().toUpperCase();
    if (/^\d{6,9}$/.test(limpio)) return true; // DNI
    if (/^[A-Z0-9]{5,}-[A-Z0-9]{1,3}$/.test(limpio)) return true; // Grupo y Orden, ej P2GH169-T
    return false;
  };

  // ROMBITO AI — Clasificación por etiquetas (tags) y derivación
  type Departamento = 'Cobranzas' | 'Adjudicaciones' | 'Postventa' | 'Atención Personalizada' | 'Consultas Generales';

  const clasificarIntencion = (texto: string): Departamento => {
    const t = texto.toLowerCase();
    if (t.includes('cuota') || t.includes('deuda') || t.includes('vencimiento') || t.includes('pago')) return 'Cobranzas';
    if (t.includes('licitac') || t.includes('adjudic') || t.includes('sorteo')) return 'Adjudicaciones';
    if (t.includes('modelo') || t.includes('entrega') || t.includes('cambio')) return 'Postventa';
    if (t.includes('asesor') || t.includes('humano') || t.includes('hablar con alguien')) return 'Atención Personalizada';
    return 'Consultas Generales';
  };

  // Respuestas automáticas ya validada la identidad
  const responderRombito = (mensajeUsuario: string): string => {
    const tag = clasificarIntencion(mensajeUsuario);

    if (tag === 'Cobranzas') {
      return `Tu Cuota 15 de 84 está al día ✅. El próximo vencimiento es de $184.500. Podés bajar tu talón o revisar el detalle completo en "Estado de Cuenta" y "Resumen de Cuotas Pagadas" de tu panel. 💳\n\n🏷️ Etiqueta: ${tag}`;
    }
    if (tag === 'Adjudicaciones') {
      return `Tu grupo está habilitado para licitar este mes 🏆. Podés hacer tu Oferta Rápida de Licitación desde "Estado de Cuenta", o consultar la invitación oficial en Plan Rombo. El último sorteo se adjudicó con 35 cuotas ofertadas.\n\n🏷️ Etiqueta: ${tag}`;
    }
    if (tag === 'Postventa') {
      return `Para gestionar un cambio de modelo o coordinar tu entrega necesitás hablar con un asesor de Postventa. Te dejo derivado con esa etiqueta.\n\n🏷️ Etiqueta: ${tag}${sufijoHorario()}`;
    }
    if (tag === 'Atención Personalizada') {
      return `Entendido, te derivo con un asesor humano para que te atienda personalmente.\n\n🏷️ Etiqueta: ${tag}${sufijoHorario()}`;
    }
    return `Todavía estoy aprendiendo a responder esa consulta puntual. Te dejo derivado para que un asesor lo revise.\n\n🏷️ Etiqueta: ${tag}${sufijoHorario()}`;
  };

  // ROMBITO AI — Comandos secretos de uso interno (empiezan con "!")
  const responderComandoInterno = (comandoRaw: string): string => {
    const comando = comandoRaw.trim().toLowerCase();
    if (comando.startsWith('!broker')) {
      return '🔒 [MODO INTERNO] Contacto Broker Zona Norte: Martín Ledesma · +54 9 381 400-1122 · martin.ledesma@brokerplan.com.ar';
    }
    if (comando.startsWith('!fabrica') || comando.startsWith('!fábrica')) {
      return '🔒 [MODO INTERNO] Stock de fábrica: Kardian (12 unid., 15 días) · Duster (5 unid., 30 días) · Kwid (20 unid., 7 días).';
    }
    return '🔒 [MODO INTERNO] Comando no reconocido. Disponibles: !broker, !fabrica';
  };

  const enviarMensajeRombito = (textoForzado?: string) => {
    const texto = (textoForzado ?? mensajeChat).trim();
    if (!texto) return;
    setHistorialChat(prev => [...prev, { emisor: 'user', texto }]);
    setMensajeChat('');

    setTimeout(() => {
      // 1. Comandos secretos (uso interno) — bypassean la barrera de datos
      if (texto.startsWith('!')) {
        setHistorialChat(prev => [...prev, { emisor: 'interno', texto: responderComandoInterno(texto) }]);
        return;
      }

      // 2. Barrera de Datos: sin identidad validada no se avanza
      if (!identidadValidada) {
        if (pareceIdentidad(texto)) {
          setIdentidadValidada(true);
          setDatoIdentidad(texto.trim());
          setHistorialChat(prev => [...prev, {
            emisor: 'rombito',
            texto: `¡Gracias! Identidad verificada ✅ (${texto.trim()}). Contame en qué te puedo ayudar: cuotas, licitaciones, cambio de modelo o hablar con un asesor.`
          }]);
        } else {
          setHistorialChat(prev => [...prev, {
            emisor: 'rombito',
            texto: 'Para continuar necesito validar tu identidad 🔐. Pasame tu DNI (ej: 30123456) o tu Grupo y Orden (ej: P2GH169-T).'
          }]);
        }
        return;
      }

      // 3. Identidad validada: clasificar, responder y/o derivar
      setHistorialChat(prev => [...prev, { emisor: 'rombito', texto: responderRombito(texto) }]);
    }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-[#0B0F19] p-4 sm:p-8 relative pb-24"
    >

      {/* BANNER PUBLICITARIO CON ADELANTO VISUAL DE LA TROMPA DEL VEHÍCULO */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
        whileHover={{ y: -3 }}
        className="max-w-7xl mx-auto mb-8 bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group"
      >
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-yellow-500/20 blur-3xl" />

        <div className="space-y-2 max-w-lg text-center md:text-left z-20">
          <span className="bg-yellow-500/15 text-yellow-400 text-xs font-black px-3.5 py-1.5 rounded-full border border-yellow-500/30 uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-yellow-400 fill-yellow-400" /> Lanzamientos Exclusivos 2026
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{condiciones.tituloPromo}</h2>
          <p className="text-gray-300 text-sm font-medium">
            {condiciones.descripcionPromo}
          </p>
        </div>

        {/* VISTA PREVIA (BOREAL Y KOLEOS LADO A LADO) — fotograma 2 (portada estática) */}
        <div className="relative md:absolute md:right-6 lg:right-12 md:bottom-0 flex items-end justify-center gap-1 sm:gap-3 pointer-events-none z-10 my-2 md:my-0">
          <div className="w-32 sm:w-44 md:w-52 h-48 sm:h-56 flex items-center justify-center p-3 relative overflow-hidden">
            <img
              src={get360Frame('Boreal Evolution', 2)}
              alt="Nuevo Renault Boreal"
              className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-[0_20px_25px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
          <div className="w-32 sm:w-44 md:w-52 h-48 sm:h-56 flex items-center justify-center p-3 relative overflow-hidden">
            <img
              src={get360Frame('Koleos Techno', 2)}
              alt="Nuevo Renault Koleos"
              className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-[0_20px_25px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* CABECERA Y BIENVENIDA */}
      <div id="seccion-mi-plan" className="max-w-7xl mx-auto mb-10 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Hola, {primerNombre} 👋</h1>
            <p className="text-gray-400 font-medium mt-1 text-lg">
              Suscripción N° <strong className="text-white">{grupoOrden}</strong> - Tu nuevo Renault está cada vez más cerca. 🚗
            </p>
            {clienteActivo && nubeConfigurada && (
              <span className="inline-flex items-center gap-1.5 mt-2 bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[11px] font-bold px-2.5 py-1 rounded-full">
                <Cloud className="h-3 w-3" /> Datos verificados en la nube
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="https://www.planrombo.com.ar/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-5 py-3 rounded-2xl font-black transition-all shadow-sm flex items-center justify-center gap-2 border border-yellow-400 text-xs"
            >
              Plan Rombo Oficial <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <a
              href="https://www.planrombo.com.ar/frontoffice/contratos/buscar"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 text-xs"
            >
              <Search className="h-3.5 w-3.5 text-yellow-500" /> Buscar Mi Cupón de Pago
            </a>
          </div>
        </div>

        {/* TARJETA DE PROGRESO DEL PLAN */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          whileHover={{ y: -3 }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl text-white flex flex-col md:flex-row items-center gap-8 border border-white/10"
        >
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-3">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Progreso de tu Plan</p>
                <p className="text-xl font-black text-white mt-1">Cuota 15 <span className="text-gray-500 font-medium text-lg">de 84</span></p>
              </div>
              <div className="text-right">
                <span className="text-gray-400 text-xs font-bold uppercase block mb-1">Grupo y Orden</span>
                <span className="text-yellow-400 font-bold text-sm tracking-widest">{grupoOrden}</span>
              </div>
            </div>
            <div className="flex justify-between items-center mb-2 mt-4">
              <span className="text-xs font-bold text-gray-400">0%</span>
              <span className="text-xs font-bold text-yellow-400">18% Pagado</span>
              <span className="text-xs font-bold text-gray-400">100%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '18%' }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                className="bg-gradient-to-r from-yellow-500 to-yellow-300 h-4 rounded-full relative"
              >
                <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/30"></div>
              </motion.div>
            </div>
          </div>

          <div className="text-center md:text-right w-full md:w-auto bg-gray-800/50 p-5 rounded-2xl border border-white/10">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Estado de Cuenta</p>
            <span className="bg-green-500/20 text-green-400 px-5 py-2 rounded-full text-sm font-black border border-green-500/30 inline-flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              CUOTA AL DÍA
            </span>
          </div>
        </motion.div>

        {esAdjudicado && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
            className="mt-4 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-2xl px-6 py-4 shadow-lg border border-yellow-300 flex items-center gap-3"
          >
            <Trophy className="h-7 w-7 text-gray-900 flex-shrink-0" />
            <p className="text-gray-900 font-black text-sm sm:text-base">
              🏆 Adjudicado - Ganador Acto de {mesAdjudicacion}
            </p>
          </motion.div>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start">
        
        <div className="lg:col-span-2 space-y-6">
          {/* VISOR 360° CON GIRO AUTOMÁTICO — foto de la Casa Central (Av. Perón) de fondo */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
            id="seccion-vehiculo"
            className="bg-[url('/Fondo%20Peron.png')] bg-cover bg-center rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden h-[420px]"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/75 to-gray-900/50" />
            <div className="relative z-10 h-full p-6 sm:p-8 flex flex-col items-center justify-center">
              <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
                <h2 className="text-xl font-black text-white">Mi Vehículo (Kardian 360°)</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAutoGirar(!autoGirar)}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 transition-colors"
                >
                  {autoGirar ? <Pause className="h-3.5 w-3.5 text-red-400" /> : <Play className="h-3.5 w-3.5 text-green-400" />}
                  {autoGirar ? 'Pausar Giro' : 'Auto Giro'}
                </motion.button>
              </div>
              <div className="w-full max-w-lg mt-8 relative flex flex-col items-center">
                <div className="h-64 sm:h-72 w-full overflow-hidden relative rounded-3xl bg-gradient-to-b from-gray-50 to-gray-200 border border-white/10">
                  <img
                    src={get360Frame(KARDIAN_VERSION_NOMBRE, rotacion)}
                    alt="Auto 360"
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-contain mix-blend-multiply drop-shadow-xl transition-none pointer-events-none select-none"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.dataset.fallback !== '1') {
                        target.dataset.fallback = '1';
                        target.src = get360Cover(KARDIAN_VERSION_NOMBRE);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* CARACTERÍSTICAS DESTACADAS DEL VEHÍCULO */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.17, ease: 'easeOut' }}
            className="bg-[url('/Fondo%20Peron.png')] bg-cover bg-center rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/75 to-gray-900/50" />
            <div className="relative z-10 p-6">
              <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Ficha Técnica</p>
              <p className="text-sm font-bold text-white mb-3">{KARDIAN_VERSION_NOMBRE}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CARACTERISTICAS_KARDIAN.map(({ Icono, label, valor }) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <Icono className="h-4 w-4 text-yellow-500 mb-1" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                    <p className="text-xs font-bold text-white leading-tight">{valor}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* DATOS PERSONALES Y CONCESIONARIO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
              whileHover={{ y: -3, boxShadow: '0 12px 24px rgba(0,0,0,0.08)' }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 h-full"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" /> Datos Personales
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <User className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Nombre</p>
                    <p className="font-bold text-white">{nombreCompleto}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Mail className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Email</p>
                    <p className="font-bold text-white">{clienteActivo ? 'No registrado' : 'juan.perez@email.com'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Phone className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Teléfono</p>
                    <p className="font-bold text-white">{telefonoDisplay}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <FileText className="h-5 w-5 text-gray-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">DNI / Suscripción</p>
                    <p className="font-bold text-white">{dniDisplay} / {grupoOrden}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
              whileHover={{ y: -3, boxShadow: '0 12px 24px rgba(0,0,0,0.35)' }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col h-full"
            >
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" /> Nuestras Sucursales
              </h3>
              <div className="space-y-4 flex-grow">
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">Casa Central (Yerba Buena)</p>
                    <p className="text-sm text-gray-400">Av. Perón 1100, Yerba Buena.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">Sucursal Centro</p>
                    <p className="text-sm text-gray-400">24 de Septiembre 741, San Miguel de Tucumán.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">Mi Auto Ya! (Usados Seleccionados)</p>
                    <p className="text-sm text-gray-400">Av. Mate de Luna 1934, San Miguel de Tucumán.</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-3 border-t border-white/10">
                  <Phone className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-white">Atención Telefónica</p>
                    <p className="text-sm text-gray-400">0810-888-7849 · WhatsApp +54 9 381 572-3178</p>
                  </div>
                </div>
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  href="tel:+5493815723178"
                  className="mt-1 w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md text-sm"
                >
                  <Phone className="h-4 w-4" /> Llamar Ahora
                </motion.a>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="space-y-6">
          {/* MIS PUNTOS RUIZ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
            whileHover={{ y: -3, scale: 1.01 }}
            className="relative bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-3xl p-6 shadow-2xl border border-yellow-300/50 text-white overflow-hidden"
          >
            <div className="pointer-events-none absolute -inset-6 bg-yellow-400/50 blur-3xl rounded-full animate-pulse" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Award className="h-8 w-8" />
                  <h2 className="text-xl font-bold">Mis Puntos Ruiz</h2>
                </div>
                <span className="text-2xl font-black">2.450</span>
              </div>
              <p className="text-yellow-50 text-sm font-medium mb-0 leading-relaxed">
                Sumaste 500 puntos por pago a término. Mantené tus cuotas al día para canjearlos por servicios o accesorios.
              </p>
            </div>
          </motion.div>

          {/* ESTADO DE CUENTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
            whileHover={{ y: -3, boxShadow: '0 12px 24px rgba(0,0,0,0.35)' }}
            className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col"
          >
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-500" /> Estado de Cuenta
            </h2>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-5 space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Plan Suscripto</span>
                <span className="text-sm font-black text-white">{condiciones.planDestacado}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Modalidad</span>
                <span className="text-sm font-bold text-white">Débito Automático</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase">Medio de Pago</span>
                <div className="flex items-center gap-1.5">
                  <span className="bg-blue-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">VISA</span>
                  <span className="text-sm font-bold text-white">**** 4589</span>
                </div>
              </div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-5 text-center">
              <span className="text-sm font-semibold text-red-300 block mb-1">Próximo Vencimiento</span>
              <span className="text-3xl font-black text-red-400">{condiciones.cuotaDestacada}</span>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wide">Último Sorteo (Grupo)</h4>
              </div>
              <p className="text-sm text-blue-200 font-medium leading-relaxed">
                El vehículo del mes se adjudicó mediante <strong>Licitación con 35 cuotas ofertadas</strong>.
              </p>
            </div>

            {/* BOTONES OFICIALES */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMostrarModalLicitacion(true)}
                className="col-span-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm text-xs"
              >
                <Trophy className="h-4 w-4" /> Consultar Invitación a Licitar <ExternalLink className="h-3 w-3" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMostrarModalTalon(true)}
                className="flex flex-col items-center justify-center bg-white p-3 rounded-xl shadow-sm hover:bg-gray-100 transition-colors"
              >
                <Download className="h-5 w-5 text-gray-700 mb-1" />
                <span className="text-xs font-bold text-gray-900">Bajar Talón</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setMostrarModalPagos(true)}
                className="flex flex-col items-center justify-center bg-red-600 hover:bg-red-700 p-3 rounded-xl shadow-sm transition-colors"
              >
                <CreditCard className="h-5 w-5 text-white mb-1" />
                <span className="text-xs font-bold text-white text-center leading-tight">Adherir Otra Tarjeta</span>
              </motion.button>
            </div>

            {grupoHabilitadoLicitacion ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onIrALicitaciones}
                className="w-full bg-black/40 hover:bg-black/60 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md border border-white/10"
              >
                <Trophy className="h-5 w-5 text-yellow-500" /> Oferta Rápida de Licitación
              </motion.button>
            ) : (
              <button disabled className="w-full bg-white/5 text-gray-500 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-white/10 cursor-not-allowed">
                <Lock className="h-5 w-5" /> Grupo no habilitado este mes
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* RESUMEN DE CUOTAS */}
      <div className="max-w-7xl mx-auto mb-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
          className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 overflow-hidden"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" /> Resumen de Cuotas Pagadas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Cuota</th>
                  <th className="py-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="py-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                  <th className="py-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Medio</th>
                  <th className="py-4 px-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { n: 15, f: '10/07/2026' },
                  { n: 14, f: '10/06/2026' },
                  { n: 13, f: '10/05/2026' },
                  { n: 12, f: '10/04/2026' },
                  { n: 11, f: '10/03/2026' },
                  { n: 10, f: '10/02/2026' }
                ].map((cuota, idx) => (
                  <motion.tr
                    key={cuota.n}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + idx * 0.05, ease: 'easeOut' }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-2 font-bold text-white">#{cuota.n}</td>
                    <td className="py-4 px-2 text-gray-400">{cuota.f}</td>
                    <td className="py-4 px-2 font-black text-white">$184.500</td>
                    <td className="py-4 px-2 text-gray-500">Débito Automático</td>
                    <td className="py-4 px-2 text-right">
                      <span className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full border border-green-500/30">
                        Pagada
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* MODAL MEDIOS DE PAGO */}
      <AnimatePresence>
      {mostrarModalPagos && (
        <motion.div
          key="modal-pagos"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gray-900/90 backdrop-blur-xl rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10"
          >
            <div className="sticky top-0 bg-black/40 backdrop-blur-xl border-b border-white/10 p-6 flex justify-between items-center z-10">
              <h3 className="text-2xl font-black text-white">Medios de Pago</h3>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setMostrarModalPagos(false)} className="bg-white/10 hover:bg-white/20 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold transition-colors">X</motion.button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                <div className="text-sm text-yellow-200">
                  <p className="font-bold mb-1">IMPORTANTE:</p>
                  <p>Plan Rombo nunca solicitará pagos en efectivo a cobradores.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* MODAL PREVIO: CONSULTAR INVITACIÓN A LICITAR */}
      <AnimatePresence>
      {mostrarModalLicitacion && (
        <motion.div
          key="modal-licitacion"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gray-900/90 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10"
          >
            <div className="bg-orange-600 p-6 flex justify-between items-center text-white">
              <h3 className="text-lg font-black flex items-center gap-2"><Trophy className="h-5 w-5" /> Consultar Invitación a Licitar</h3>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setMostrarModalLicitacion(false)} className="text-orange-200 hover:text-white transition-colors"><X className="h-6 w-6" /></motion.button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">Te vamos a redirigir a la web oficial de Plan Rombo. Antes, tené en cuenta:</p>

              <div className="flex gap-3">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-orange-500/20 text-orange-300 font-black text-sm flex items-center justify-center">1</span>
                <p className="text-sm text-gray-300 pt-0.5">Tené a mano tu número de <strong className="text-white">Grupo y Orden</strong> (ej. P2GH169-T).</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-orange-500/20 text-orange-300 font-black text-sm flex items-center justify-center">2</span>
                <p className="text-sm text-gray-300 pt-0.5">En la web oficial, ingresá tu número o DNI en el buscador.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-orange-500/20 text-orange-300 font-black text-sm flex items-center justify-center">3</span>
                <p className="text-sm text-gray-300 pt-0.5">Verificá si tu grupo figura habilitado para licitar este mes.</p>
              </div>

              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="https://www.planrombo.com.ar/actos-de-adjudicacion/invitacion"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMostrarModalLicitacion(false)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm mt-2"
              >
                Continuar a Plan Rombo Oficial <ExternalLink className="h-4 w-4" />
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* MODAL PREVIO: BAJAR TALÓN */}
      <AnimatePresence>
      {mostrarModalTalon && (
        <motion.div
          key="modal-talon"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gray-900/90 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10"
          >
            <div className="bg-black/40 p-6 flex justify-between items-center text-white border-b border-white/10">
              <h3 className="text-lg font-black flex items-center gap-2"><Download className="h-5 w-5 text-yellow-500" /> Bajar Talón / Cupón de Pago</h3>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setMostrarModalTalon(false)} className="text-gray-400 hover:text-white transition-colors"><X className="h-6 w-6" /></motion.button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-400">Te vamos a redirigir a la web oficial de Plan Rombo. Antes, tené en cuenta:</p>

              <div className="flex gap-3">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-white/10 text-yellow-400 font-black text-sm flex items-center justify-center">1</span>
                <p className="text-sm text-gray-300 pt-0.5">Copiá tu número de <strong className="text-white">Contrato / Suscripción</strong> (ej. 2603345).</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-white/10 text-yellow-400 font-black text-sm flex items-center justify-center">2</span>
                <p className="text-sm text-gray-300 pt-0.5">Pegalo en el campo de búsqueda de la web oficial.</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-white/10 text-yellow-400 font-black text-sm flex items-center justify-center">3</span>
                <p className="text-sm text-gray-300 pt-0.5">Descargá tu cupón de pago en formato PDF.</p>
              </div>

              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="https://www.planrombo.com.ar/frontoffice/contratos/buscar"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMostrarModalTalon(false)}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md mt-2"
              >
                Ir a Buscar Mi Cupón <ExternalLink className="h-4 w-4" />
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ROMBITO AI */}
      <div className="fixed bottom-32 sm:bottom-28 right-6 z-[99999] flex flex-col items-end pointer-events-auto">
        <AnimatePresence>
        {chatRombitoAbierto && (
          <motion.div
            key="rombito-chat"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'bottom right' }}
            className="bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 w-80 sm:w-96 mb-4 overflow-hidden flex flex-col"
          >
            <div className="bg-black/40 text-white p-4 flex justify-between items-center border-b border-white/10 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500 p-2 rounded-full border-2 border-gray-800 shadow-sm"><Bot className="h-5 w-5 text-gray-900" /></div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide">Rombito AI</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                    <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider">
                      {identidadValidada ? `Verificado · ${datoIdentidad}` : 'En línea'}
                    </p>
                  </div>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setChatRombitoAbierto(false)} className="text-gray-400 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full hover:bg-white/20">
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="h-72 p-4 overflow-y-auto bg-black/20 flex flex-col gap-3">
              <AnimatePresence initial={false}>
              {historialChat.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm whitespace-pre-line ${
                    msg.emisor === 'rombito'
                      ? 'bg-white/10 border border-white/10 text-gray-100 self-start rounded-tl-none'
                      : msg.emisor === 'interno'
                      ? 'bg-black border border-yellow-600/40 text-yellow-400 font-mono text-xs self-start rounded-tl-none'
                      : 'bg-yellow-500 text-gray-900 self-end rounded-tr-none'
                  }`}
                >
                  {msg.texto}
                </motion.div>
              ))}
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap gap-2 px-4 pt-3 pb-1 bg-black/20 border-t border-white/10">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => enviarMensajeRombito('¿Cómo va mi cuota?')}
                className="text-[11px] font-bold bg-white/10 border border-white/10 text-gray-200 px-3 py-1.5 rounded-full hover:border-yellow-500 hover:bg-yellow-500/10 hover:text-white transition-colors"
              >
                💳 Mis cuotas
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => enviarMensajeRombito('¿Cómo participo de una licitación?')}
                className="text-[11px] font-bold bg-white/10 border border-white/10 text-gray-200 px-3 py-1.5 rounded-full hover:border-yellow-500 hover:bg-yellow-500/10 hover:text-white transition-colors"
              >
                🏆 Licitaciones
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => enviarMensajeRombito('Quiero hablar con un asesor')}
                className="text-[11px] font-bold bg-white/10 border border-white/10 text-gray-200 px-3 py-1.5 rounded-full hover:border-yellow-500 hover:bg-yellow-500/10 hover:text-white transition-colors"
              >
                👤 Hablar con un asesor
              </motion.button>
            </div>

            <div className="p-3 bg-black/30 border-t border-white/10 flex gap-2">
              <input
                type="text"
                value={mensajeChat}
                onChange={(e) => setMensajeChat(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && enviarMensajeRombito()}
                placeholder={identidadValidada ? 'Escribí tu consulta...' : 'DNI o Grupo y Orden...'}
                className="flex-1 bg-white/10 border-transparent rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-yellow-500 transition-shadow"
              />
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => enviarMensajeRombito()}
                disabled={!mensajeChat.trim()}
                className="bg-yellow-500 text-gray-900 p-2.5 rounded-xl hover:bg-yellow-400 transition-colors disabled:bg-gray-300 shadow-sm"
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <AnimatePresence>
        {menuRombitoAbierto && !chatRombitoAbierto && (
          <motion.div
            key="rombito-menu"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: 'bottom right' }}
            className="bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-2 mb-4 w-64 flex flex-col gap-1.5"
          >
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => {
                setMenuRombitoAbierto(false);
                setChatRombitoAbierto(true);
              }}
              className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-blue-500/10 hover:text-blue-300 text-gray-200 transition-colors text-left font-bold text-sm border border-transparent hover:border-blue-500/30 group"
            >
              <div className="bg-blue-500/20 text-blue-300 p-2 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Bot className="h-5 w-5" />
              </div>
              Chat con Rombito AI
            </motion.button>

            <motion.a
              whileHover={{ x: 4 }}
              href="https://wa.me/5493815723178" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-green-500/10 hover:text-green-300 text-gray-200 transition-colors text-left font-bold text-sm border border-transparent hover:border-green-500/30 group"
            >
              <div className="bg-green-500/20 text-green-300 p-2 rounded-full group-hover:bg-green-500 group-hover:text-white transition-colors">
                <MessageSquare className="h-5 w-5" />
              </div>
              WhatsApp Asesor
            </motion.a>

            <motion.a
              whileHover={{ x: 4 }}
              href="tel:+5493815723178"
              className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-white/10 hover:text-white text-gray-200 transition-colors text-left font-bold text-sm border border-transparent hover:border-white/10 group"
            >
              <div className="bg-white/10 text-gray-300 p-2 rounded-full group-hover:bg-white group-hover:text-gray-900 transition-colors">
                <Phone className="h-5 w-5" />
              </div>
              Llamar a Administración
            </motion.a>
          </motion.div>
        )}
        </AnimatePresence>

        {!chatRombitoAbierto && (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setMenuRombitoAbierto(!menuRombitoAbierto)}
            className="bg-gray-900 text-white p-4 sm:p-5 rounded-full shadow-2xl hover:bg-black transition-colors flex items-center justify-center group relative border-[3px] border-white/10"
          >
            {menuRombitoAbierto ? <X className="h-7 w-7 sm:h-8 sm:w-8" /> : <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-yellow-500" />}
            {!menuRombitoAbierto && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-gray-900"></span>
              </span>
            )}
          </motion.button>
        )}
      </div>

    </motion.div>
  );
}