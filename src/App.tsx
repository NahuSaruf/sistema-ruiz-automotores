import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone as PhoneIcon, Mail, Clock, X, Instagram, Facebook, Car, Star, ChevronLeft, Settings, Gauge, Activity, MessageCircle, ShieldCheck, UserCheck, ArrowRight, Loader2, Fuel, Package, DollarSign, FileText, RefreshCw, TrendingUp, CheckCircle2, Play, Pause } from 'lucide-react';
import Header from './components/Header';
import DashboardCliente from './components/DashboardCliente';
import DashboardAdmin from './components/DashboardAdmin';
import LicitacionesCliente from './components/LicitacionesCliente';
import ModalOfertaLicitacion from './components/ModalOfertaLicitacion';
import { ClienteCartera } from './utils/excelParser';
import { buscarClientePorConsultaConNube } from './lib/supabase';
import { get360Frame, get360Frames } from './utils/assets';

// Versiones reales por modelo, con foto, secuencia 360°, ficha técnica y plan propios.
interface VersionVehiculo {
  nombre: string;
  familia: string;
  imgPortada: string;
  fotogramas: string[];
  motor: string;
  transmision: string;
  traccion: string;
  consumo: string;
  baul: string;
  equipamiento: string;
  tipoPlan: string;
  cuota: string;
}

// Ficha comercial por modelo para la vitrina "Quiero mi 0km" y su pop-up de detalle.
interface PlanVitrina {
  nombre: string;
  imgVitrina: string;
  segmento: string;
  origen: string;
  rating: number; // 0-5, admite medios puntos (ej. 4.5)
  planRatio: string; // '75/25' | '80/20' | '100/0'
  cuotasTotales: number;
  valorMovil: number;
  variacionMensual: number; // % vs. mes anterior
  cuota1Estimada: string; // ya formateada, ej. "$245.500"
  adjudicacionAsegurada: { activa: boolean; cuota: number };
  requisitos: string;
  diferimiento: string;
}

// Arma una VersionVehiculo con sus 8 fotogramas y portada (frame 1) resueltos vía
// src/utils/assets.ts, en vez de un helper local — así App.tsx y DashboardCliente.tsx
// comparten el mismo mapeo estricto nombre-de-versión -> prefijo de archivo real.
const version = (
  nombre: string,
  familia: string,
  datos: Omit<VersionVehiculo, 'nombre' | 'familia' | 'imgPortada' | 'fotogramas'>
): VersionVehiculo => ({
  nombre,
  familia,
  // Fotograma 8: todos los vehículos quedan orientados uniformemente hacia la
  // derecha en la miniatura de la lista del Catálogo de Modelos.
  imgPortada: get360Frame(nombre, 8),
  fotogramas: get360Frames(nombre),
  ...datos,
});

const versionesPorModelo: Record<string, VersionVehiculo[]> = {
  KWID: [
    version('Kwid Bitono', 'KWID', { motor: '1.0 SCe 66cv', transmision: 'Manual 5v', traccion: '4x2', consumo: '16 km/l', baul: '300 litros', equipamiento: 'Llantas bitono, aire acondicionado, dirección asistida', tipoPlan: 'Plan 100% en 120 Cuotas', cuota: '$231.000' }),
    version('Kwid Outsider', 'KWID', { motor: '1.0 SCe 66cv', transmision: 'Manual 5v', traccion: '4x2', consumo: '15.5 km/l', baul: '300 litros', equipamiento: 'Paquete aventura, barras de techo, faros antiniebla', tipoPlan: 'Plan 100% en 120 Cuotas', cuota: '$238.000' }),
  ],
  KARDIAN: [
    version('Kardian Evolution 156 MT', 'KARDIAN', { motor: '1.6 SCe 156cv', transmision: 'Manual 5v', traccion: '4x2', consumo: '14.5 km/l', baul: '410 litros', equipamiento: 'Pantalla 7" Android Auto/CarPlay, cámara trasera', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$245.500' }),
    version('Kardian Evolution 200 EDC', 'KARDIAN', { motor: '1.0 TCe 120cv Turbo', transmision: 'Automática EDC 6v', traccion: '4x2', consumo: '16 km/l', baul: '410 litros', equipamiento: 'Climatizador automático, sensores de estacionamiento', tipoPlan: 'Plan 75/25 en 100 Cuotas', cuota: '$225.000' }),
    version('Kardian Iconic 200 EDC', 'KARDIAN', { motor: '1.0 TCe 120cv Turbo', transmision: 'Automática EDC 6v', traccion: '4x2', consumo: '16 km/l', baul: '410 litros', equipamiento: 'Techo panorámico, tapizado de cuero, asistentes ADAS', tipoPlan: 'Plan 75/25 en 120 Cuotas', cuota: '$210.000' }),
  ],
  DUSTER: [
    version('Duster Intens MT', 'DUSTER', { motor: '1.6 SCe 115cv', transmision: 'Manual 6v', traccion: '4x2', consumo: '13 km/l', baul: '445 litros', equipamiento: 'Multimedia 8", cámara trasera, control de estabilidad', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$279.000' }),
    version('Duster Iconic CVT', 'DUSTER', { motor: '1.3 TCe 163cv Turbo', transmision: 'Automática CVT', traccion: '4x2', consumo: '12.5 km/l', baul: '445 litros', equipamiento: 'Techo panorámico, asientos de cuero, cámara 360°', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$298.000' }),
  ],
  BOREAL: [
    version('Boreal Evolution', 'BOREAL', { motor: '1.3 TCe 156cv Turbo', transmision: 'Automática EDC 6v', traccion: '4x2', consumo: '12.5 km/l', baul: '500 litros', equipamiento: 'Pantalla 8", control de crucero, sensores de estacionamiento', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$430.000' }),
    version('Boreal Techno', 'BOREAL', { motor: '1.3 TCe 156cv Turbo', transmision: 'Automática EDC 6v', traccion: '4x2', consumo: '12 km/l', baul: '500 litros', equipamiento: 'Pantalla 9.3" vertical, cámara 360°, techo panorámico', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$445.000' }),
    version('Boreal Iconic', 'BOREAL', { motor: '1.3 TCe 156cv Turbo', transmision: 'Automática EDC 6v', traccion: '4x2', consumo: '12 km/l', baul: '500 litros', equipamiento: 'Asientos de cuero, ADAS completo, sonido premium', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$457.000' }),
  ],
  KANGOO: [
    version('Kangoo Express 2A', 'KANGOO', { motor: '1.6 SCe 114cv', transmision: 'Manual 5v', traccion: '4x2', consumo: '13.5 km/l', baul: 'Hasta 800 kg de carga', equipamiento: 'Mampara de carga, cierre centralizado', tipoPlan: 'Plan 75/25 en 120 Cuotas', cuota: '$240.000' }),
    version('Kangoo Express 5A', 'KANGOO', { motor: '1.6 SCe 114cv', transmision: 'Manual 5v', traccion: '4x2', consumo: '13 km/l', baul: '5 plazas + espacio de carga', equipamiento: '5 plazas, aire acondicionado', tipoPlan: 'Plan 75/25 en 120 Cuotas', cuota: '$275.000' }),
    version('Kangoo Stepway', 'KANGOO', { motor: '1.6 SCe 114cv', transmision: 'Manual 5v', traccion: '4x2', consumo: '13.5 km/l', baul: '3 plazas + baúl utilitario', equipamiento: 'Barras de techo, paragolpes protegidos', tipoPlan: 'Plan 80/20 en 120 Cuotas', cuota: '$258.000' }),
  ],
  OROCH: [
    version('Oroch Emotion', 'OROCH', { motor: '1.6 SCe 114cv', transmision: 'Manual 6v', traccion: '4x2', consumo: '12.8 km/l', baul: 'Caja de carga 650 kg', equipamiento: 'Barras antivuelco, paragolpes protegidos', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$285.000' }),
    version('Oroch Iconic', 'OROCH', { motor: '1.3 TCe 163cv Turbo', transmision: 'Automática CVT', traccion: '4x2', consumo: '11 km/l', baul: 'Caja de carga 650 kg', equipamiento: 'Techo panorámico, cámara 360°', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$318.000' }),
  ],
  MASTER: [
    version('Master', 'MASTER', { motor: '2.3 dCi 130cv Diesel', transmision: 'Manual 6v', traccion: '4x2', consumo: '9.5 km/l', baul: 'Hasta 17 m³', equipamiento: 'Doble puerta lateral, ABS + ESP', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$587.000' }),
  ],
  ARKANA: [
    version('Arkana E-Tech Hybrid', 'ARKANA', { motor: '1.6 E-Tech Hybrid 145cv', transmision: 'Automática E-Tech (multi-modo)', traccion: '4x2', consumo: '18.5 km/l', baul: '480 litros', equipamiento: 'Techo panorámico, tapizado de cuero, sonido premium Harman Kardon', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$620.000' }),
  ],
  KOLEOS: [
    version('Koleos Techno', 'KOLEOS', { motor: '2.5 4 cil. 170cv', transmision: 'Automática CVT', traccion: '4x4', consumo: '10.5 km/l', baul: '458 litros', equipamiento: 'Techo panorámico, cámara 360°, asistentes ADAS completos', tipoPlan: 'Plan 75/25 en 84 Cuotas', cuota: '$690.000' }),
  ],
};

const FAMILIAS_CATALOGO = ['KWID', 'KARDIAN', 'DUSTER', 'BOREAL', 'KANGOO', 'OROCH', 'MASTER', 'ARKANA', 'KOLEOS'];

// Visor 360° por versión: sólo animación de rotación suave en bucle (fotogramas
// 1 a 8) con un botón de Pausa/Play — sin arrastre manual ni textos adicionales.
function VisorVersion360({ version, autoGirar = false }: { version: VersionVehiculo; autoGirar?: boolean }) {
  const total = version.fotogramas.length;
  const [rotacion, setRotacion] = useState(1);
  const [girando, setGirando] = useState(autoGirar);
  const imgSrc = total === 0 ? version.imgPortada : version.fotogramas[rotacion - 1];

  useEffect(() => {
    if (!girando || total === 0) return;
    const interval = setInterval(() => {
      setRotacion((prev) => (prev >= total ? 1 : prev + 1));
    }, 1500);
    return () => clearInterval(interval);
  }, [girando, total]);

  return (
    <div className="h-64 sm:h-72 w-full overflow-hidden relative bg-gradient-to-b from-gray-50 to-gray-200 rounded-3xl border border-white/10 flex items-center justify-center">
      <img
        src={imgSrc}
        alt={version.nombre}
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain mix-blend-multiply drop-shadow-xl transition-none pointer-events-none select-none"
      />
      {total > 0 && (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setGirando((g) => !g)}
          aria-label={girando ? 'Pausar rotación' : 'Reanudar rotación'}
          className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/80 text-white p-2.5 rounded-full backdrop-blur-md transition-colors"
        >
          {girando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </motion.button>
      )}
    </div>
  );
}

// Puntuación en estrellas (admite medios puntos, ej. 4.5/5) para las tarjetas y el
// pop-up de la vitrina comercial.
function EstrellasRating({ valor }: { valor: number }) {
  const llenas = Math.floor(valor);
  const tieneMedia = valor - llenas >= 0.25 && valor - llenas < 0.75;
  const vacias = Math.max(5 - llenas - (tieneMedia ? 1 : 0), 0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: llenas }).map((_, i) => (
        <Star key={`f${i}`} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
      ))}
      {tieneMedia && (
        <div className="relative h-3.5 w-3.5">
          <Star className="absolute inset-0 h-3.5 w-3.5 text-gray-600" />
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
      )}
      {Array.from({ length: vacias }).map((_, i) => (
        <Star key={`v${i}`} className="h-3.5 w-3.5 text-gray-600" />
      ))}
      <span className="text-xs font-bold text-gray-400 ml-1">{valor.toFixed(1)}/5</span>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'home' | 'user' | 'cliente' | 'admin' | 'nuevo'>('home');
  const [mostrarAccesoCliente, setMostrarAccesoCliente] = useState(false);
  const [mostrarSelectorCliente, setMostrarSelectorCliente] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [clienteActivo, setClienteActivo] = useState<ClienteCartera | null>(null);

  const [mostrarContacto, setMostrarContacto] = useState(false);
  const [mostrarLicitaciones, setMostrarLicitaciones] = useState(false);
  const [mostrarModelos, setMostrarModelos] = useState(false);
  const [mostrarBeneficios, setMostrarBeneficios] = useState(false);
  const [mostrarOfertaRapida, setMostrarOfertaRapida] = useState(false);

  const [familiaExpandida, setFamiliaExpandida] = useState<string | null>(null);
  const [versionFicha, setVersionFicha] = useState<VersionVehiculo | null>(null);

  // POP-UP DE DETALLE DE PLAN (vitrina comercial "Quiero mi 0km")
  const [planDetalle, setPlanDetalle] = useState<PlanVitrina | null>(null);
  const [tabPlanDetalle, setTabPlanDetalle] = useState<'valores' | 'detalle'>('valores');
  const [seccionExpandidaPlan, setSeccionExpandidaPlan] = useState<'retiro' | 'cambio' | null>(null);

  // LÓGICA DE LOGIN ÚNICO
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = loginInput.trim().toUpperCase();

    if (!query) {
      setLoginError('Por favor ingresa tu DNI, Suscripción o Credencial ADMIN');
      return;
    }

    setLoginError('');
    if (query === 'ADMIN') {
      setClienteActivo(null);
      setView('admin');
      return;
    }

    // Busca al cliente primero en Supabase (nube); si no hay conexión, no está
    // configurada, o no encuentra nada ahí, cae automáticamente al respaldo local
    // (localStorage). Si tampoco figura en ningún lado, entra igual con los datos
    // de demostración.
    setBuscandoCliente(true);
    const { cliente } = await buscarClientePorConsultaConNube(query);
    setBuscandoCliente(false);

    setClienteActivo(cliente);
    setView('cliente');
  };

  // VITRINA COMERCIAL "QUIERO MI 0KM": una entrada por modelo con la info comercial
  // completa (plan principal, rating, segmento, valores) que alimenta tanto la
  // tarjeta de la vitrina como el pop-up de detalle. Los "Cuota 1" reutilizan las
  // mismas cifras que ya se muestran en el resto de la app (Header > Modelos).
  // imgVitrina usa el fotograma 2 (get360Frame) de la versión principal de cada
  // modelo, en vez de una imagen genérica sin relación con el visor 360°.
  const vitrinaComercial: PlanVitrina[] = [
    {
      nombre: 'KWID', imgVitrina: get360Frame('Kwid Bitono', 2), segmento: 'SUV Urbano', origen: 'Brasil',
      rating: 4.3, planRatio: '100/0', cuotasTotales: 120, valorMovil: 23100000,
      variacionMensual: 2.4, cuota1Estimada: '$231.000',
      adjudicacionAsegurada: { activa: false, cuota: 0 },
      requisitos: 'DNI, comprobante de ingresos y recibo de sueldo o monotributo.',
      diferimiento: 'Hasta 2 cuotas diferibles por año calendario.',
    },
    {
      nombre: 'KARDIAN', imgVitrina: get360Frame('Kardian Evolution 156 MT', 2), segmento: 'SUV Compacta', origen: 'Brasil',
      rating: 4.6, planRatio: '75/25', cuotasTotales: 84, valorMovil: 25550000,
      variacionMensual: 2.8, cuota1Estimada: '$245.500',
      adjudicacionAsegurada: { activa: true, cuota: 9 },
      requisitos: 'DNI, comprobante de ingresos y recibo de sueldo o monotributo.',
      diferimiento: 'Hasta 3 cuotas diferibles por año calendario.',
    },
    {
      nombre: 'DUSTER', imgVitrina: get360Frame('Duster Intens MT', 2), segmento: 'SUV', origen: 'Argentina',
      rating: 4.7, planRatio: '75/25', cuotasTotales: 84, valorMovil: 32480000,
      variacionMensual: 3.1, cuota1Estimada: '$279.000',
      adjudicacionAsegurada: { activa: true, cuota: 10 },
      requisitos: 'DNI, comprobante de ingresos y recibo de sueldo o monotributo.',
      diferimiento: 'Hasta 3 cuotas diferibles por año calendario.',
    },
    {
      nombre: 'BOREAL', imgVitrina: get360Frame('Boreal Iconic', 2), segmento: 'Sedán Premium', origen: 'Brasil',
      rating: 4.4, planRatio: '75/25', cuotasTotales: 84, valorMovil: 48900000,
      variacionMensual: 2.3, cuota1Estimada: '$457.000',
      adjudicacionAsegurada: { activa: true, cuota: 11 },
      requisitos: 'DNI, comprobante de ingresos y recibo de sueldo o monotributo.',
      diferimiento: 'Hasta 3 cuotas diferibles por año calendario.',
    },
    {
      nombre: 'KANGOO', imgVitrina: get360Frame('Kangoo Stepway', 2), segmento: 'Utilitario', origen: 'Argentina',
      rating: 4.5, planRatio: '80/20', cuotasTotales: 120, valorMovil: 27200000,
      variacionMensual: 2.9, cuota1Estimada: '$258.000',
      adjudicacionAsegurada: { activa: true, cuota: 12 },
      requisitos: 'DNI, comprobante de ingresos, monotributo o constancia de CUIT (uso comercial).',
      diferimiento: 'Hasta 2 cuotas diferibles por año calendario.',
    },
    {
      nombre: 'OROCH', imgVitrina: get360Frame('Oroch Emotion', 2), segmento: 'Pick-up Mediana', origen: 'Argentina',
      rating: 4.6, planRatio: '75/25', cuotasTotales: 84, valorMovil: 31900000,
      variacionMensual: 3.4, cuota1Estimada: '$285.000',
      adjudicacionAsegurada: { activa: true, cuota: 10 },
      requisitos: 'DNI, comprobante de ingresos y recibo de sueldo o monotributo.',
      diferimiento: 'Hasta 3 cuotas diferibles por año calendario.',
    },
    {
      nombre: 'MASTER', imgVitrina: get360Frame('Master', 2), segmento: 'Furgón', origen: 'Argentina',
      rating: 4.2, planRatio: '75/25', cuotasTotales: 84, valorMovil: 62300000,
      variacionMensual: 2.7, cuota1Estimada: '$587.000',
      adjudicacionAsegurada: { activa: true, cuota: 13 },
      requisitos: 'DNI, comprobante de ingresos, monotributo o constancia de CUIT (uso comercial/flota).',
      diferimiento: 'Hasta 2 cuotas diferibles por año calendario.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col font-sans">
      
      <Header 
        onUserClick={() => setView('user')} 
        onHomeClick={() => { setMostrarAccesoCliente(false); setView('home'); }}
        onClienteClick={() => setMostrarSelectorCliente(true)}
        onLicitacionesClick={() => setMostrarLicitaciones(true)}
        onContactoClick={() => setMostrarContacto(true)}
        onModelosClick={() => { setMostrarModelos(true); setFamiliaExpandida(null); setVersionFicha(null); }}
        onBeneficiosClick={() => setMostrarBeneficios(true)}
      />
      
      <main className="flex-grow relative">
      <AnimatePresence mode="wait">
        {/* PANTALLA HOME - LOGIN ÚNICO */}
        {view === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex items-center justify-center min-h-[75vh] flex-col gap-8 p-4"
          >
            <div className="text-center max-w-xl">
              <span className="bg-yellow-500/10 backdrop-blur-xl text-yellow-400 text-xs font-black px-3.5 py-1.5 rounded-full border border-yellow-500/30 tracking-wider uppercase inline-block mb-3 shadow-lg">
                Ruiz Automotores - Plan Rombo
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">
                {mostrarAccesoCliente ? 'Portal de Clientes y Gestión' : '¿Qué querés hacer hoy?'}
              </h2>
              <p className="text-gray-400 text-base sm:text-lg font-medium">
                {mostrarAccesoCliente
                  ? 'Ingresá con tu DNI, N° de Suscripción o credencial administrativa.'
                  : 'Elegí una opción para empezar.'}
              </p>
            </div>

            <AnimatePresence mode="wait">
            {!mostrarAccesoCliente ? (
              /* OPCIONES PRINCIPALES: Ya soy Cliente / Quiero mi 0km */
              <motion.div
                key="opciones-home"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl"
              >
                <motion.button
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMostrarAccesoCliente(true)}
                  className="bg-white/5 backdrop-blur-xl hover:bg-white/10 text-white rounded-3xl p-8 shadow-2xl border border-white/10 flex flex-col items-center text-center gap-3 transition-colors"
                >
                  <span className="text-4xl">👤</span>
                  <span className="text-xl font-black">Ya soy Cliente</span>
                  <span className="text-sm text-gray-400 font-medium">Ingresá con tu DNI o N° de Suscripción para ver tu plan.</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setView('nuevo')}
                  className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-3xl p-8 shadow-xl border border-yellow-300 flex flex-col items-center text-center gap-3 transition-colors"
                >
                  <span className="text-4xl">🚀</span>
                  <span className="text-xl font-black">Quiero mi 0km (Soy Nuevo)</span>
                  <span className="text-sm text-gray-800 font-medium">Descubrí los planes de suscripción por modelo.</span>
                </motion.button>
              </motion.div>
            ) : (
              /* TARJETA DE LOGIN */
              <motion.div
                key="form-login"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 w-full max-w-md"
              >
                <button
                  onClick={() => setMostrarAccesoCliente(false)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white font-bold text-xs mb-4 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Volver
                </button>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Acceso Unificado</label>
                    <input
                      type="text"
                      value={loginInput}
                      onChange={(e) => { setLoginInput(e.target.value); setLoginError(''); }}
                      placeholder="DNI, N° Suscripción o ADMIN"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base font-bold outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all text-white placeholder:text-gray-500"
                    />
                    {loginError && <p className="text-red-400 text-xs font-bold mt-2 ml-1">{loginError}</p>}
                  </div>

                  <motion.button
                    whileHover={{ scale: buscandoCliente ? 1 : 1.02 }}
                    whileTap={{ scale: buscandoCliente ? 1 : 0.97 }}
                    type="submit"
                    disabled={buscandoCliente}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 py-4 rounded-2xl font-black transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                  >
                    {buscandoCliente ? (
                      <>Buscando tu plan... <Loader2 className="h-5 w-5 animate-spin" /></>
                    ) : (
                      <>Ingresar al Sistema <ArrowRight className="h-5 w-5" /></>
                    )}
                  </motion.button>
                </form>

                {/* Demos de acceso rápido */}
                <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-2">
                  <p className="text-[11px] font-bold text-gray-500 uppercase text-center mb-1">Acceso Rápido Demostración</p>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setClienteActivo(null); setView('cliente'); }}
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="h-4 w-4 text-yellow-500" /> Demo Cliente
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setView('admin')}
                      className="flex-1 bg-black/40 hover:bg-black/60 border border-white/10 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="h-4 w-4 text-yellow-500" /> Demo Admin
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* PANTALLA QUIERO MI 0KM - SECCIÓN COMERCIAL PARA NUEVOS */}
        {view === 'nuevo' && (
          <motion.div
            key="nuevo"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-6xl mx-auto px-4 py-10"
          >
            <button
              onClick={() => setView('home')}
              className="flex items-center gap-2 text-gray-400 hover:text-white font-bold text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Volver al Inicio
            </button>

            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="bg-yellow-500/10 backdrop-blur-xl text-yellow-400 text-xs font-black px-3.5 py-1.5 rounded-full border border-yellow-500/30 tracking-wider uppercase inline-block mb-3 shadow-lg">
                🚀 Quiero mi 0km
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">Elegí tu modelo y empezá a suscribirte</h2>
              <p className="text-gray-400 font-medium">Planes de Ahorro Rombo, cuotas accesibles y entrega asegurada.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vitrinaComercial.map((auto) => (
                <motion.div
                  key={auto.nombre}
                  whileHover={{ y: -4 }}
                  className="bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col relative"
                >
                  {/* Badges superior derecho: relación de plan + cantidad de cuotas */}
                  <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
                    <span className="bg-yellow-500 text-gray-900 text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg">
                      Plan: {auto.planRatio}
                    </span>
                    <span className="bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md">
                      {auto.cuotasTotales} Cuotas
                    </span>
                  </div>

                  <div className="bg-gradient-to-b from-gray-100 to-gray-300 w-full h-48 sm:h-56 flex items-center justify-center p-3 relative overflow-hidden">
                    <img
                      src={auto.imgVitrina}
                      alt={auto.nombre}
                      className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-xl"
                      draggable={false}
                    />
                  </div>

                  <div className="p-5 flex flex-col gap-3 flex-grow">
                    <h3 className="text-lg font-black text-white">{auto.nombre}</h3>
                    <EstrellasRating valor={auto.rating} />

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] bg-white/5 border border-white/10 rounded-xl p-3">
                      <span className="text-gray-500 font-bold">Segmento</span>
                      <span className="text-white font-bold text-right">{auto.segmento}</span>
                      <span className="text-gray-500 font-bold">Valor Móvil</span>
                      <span className="text-white font-bold text-right">${auto.valorMovil.toLocaleString('es-AR')}</span>
                      <span className="text-gray-500 font-bold">Variación</span>
                      <span className="text-green-400 font-bold text-right flex items-center justify-end gap-0.5">
                        <TrendingUp className="h-3 w-3" /> +{auto.variacionMensual.toFixed(2)}%
                      </span>
                      <span className="text-gray-500 font-bold">Origen</span>
                      <span className="text-white font-bold text-right">{auto.origen}</span>
                    </div>

                    <div className="flex flex-col gap-2 mt-auto pt-1">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setPlanDetalle(auto); setTabPlanDetalle('valores'); setSeccionExpandidaPlan(null); }}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-black py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Más Información
                      </motion.button>
                      <a
                        href={`https://wa.me/5493815723178?text=${encodeURIComponent(`Hola! Quiero consultar por la ${auto.nombre} - Plan ${auto.planRatio} en ${auto.cuotasTotales} cuotas (Cuota 1 desde ${auto.cuota1Estimada}). Soy cliente nuevo.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-black py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-green-400" /> WhatsApp Consultar
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'user' && (
          <motion.div
            key="user"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex items-center justify-center h-[60vh]"
          >
            <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.97 }}
               onClick={() => { setClienteActivo(null); setView('cliente'); }}
               className="bg-yellow-500 text-gray-900 px-8 py-4 rounded-xl font-black text-xl hover:bg-yellow-400 shadow-lg transition-colors"
            >
              Entrar a Mi Panel de Cliente
            </motion.button>
          </motion.div>
        )}

        {view === 'cliente' && (
          <motion.div
            key="cliente"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <DashboardCliente
              clienteActivo={clienteActivo}
              onIrALicitaciones={() => setMostrarOfertaRapida(true)}
            />
          </motion.div>
        )}

        {view === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <DashboardAdmin />
          </motion.div>
        )}
      </AnimatePresence>
      </main>

      <footer className="bg-black/40 backdrop-blur-xl text-white p-6 text-center text-xs font-medium border-t border-white/10">
         © 2026 Ruiz Automotores - Todos los derechos reservados.
      </footer>

      {mostrarLicitaciones && <LicitacionesCliente onClose={() => setMostrarLicitaciones(false)} grupoOrden={clienteActivo?.grupoOrden} />}
      {mostrarOfertaRapida && <ModalOfertaLicitacion onClose={() => setMostrarOfertaRapida(false)} />}

      {/* SELECTOR DE ACCESO: Ya soy Cliente / Quiero mi 0km */}
      <AnimatePresence>
      {mostrarSelectorCliente && (
        <motion.div
          key="modal-selector-cliente"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[80]"
          onClick={() => setMostrarSelectorCliente(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900/80 backdrop-blur-xl rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl border border-white/10 relative"
          >
            <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setMostrarSelectorCliente(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X className="h-6 w-6" /></motion.button>
            <h2 className="text-2xl font-black text-white text-center mb-1">¿Qué querés hacer?</h2>
            <p className="text-gray-400 font-medium text-center mb-6 text-sm">Elegí una opción para continuar.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMostrarSelectorCliente(false); setMostrarAccesoCliente(true); setView('home'); }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl p-6 flex flex-col items-center text-center gap-2 transition-colors"
              >
                <span className="text-3xl">👤</span>
                <span className="text-base font-black">Ya soy Cliente</span>
                <span className="text-xs text-gray-400 font-medium">Acceso por DNI o N° de Suscripción.</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMostrarSelectorCliente(false); setView('nuevo'); }}
                className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 rounded-2xl p-6 flex flex-col items-center text-center gap-2 transition-colors"
              >
                <span className="text-3xl">🚀</span>
                <span className="text-base font-black">Quiero mi 0km (Soy Nuevo)</span>
                <span className="text-xs text-gray-800 font-medium">Ver planes de suscripción por modelo.</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* CATÁLOGO DE MODELOS: Lista Unificada de Ancho Completo */}
      <AnimatePresence>
      {mostrarModelos && (
        <motion.div
          key="modal-modelos"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[70]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gray-900/80 backdrop-blur-xl rounded-2xl w-full max-w-xl mx-auto h-[80vh] max-h-[700px] shadow-2xl border border-white/10 relative flex flex-col overflow-hidden"
          >
            <div className="bg-black/40 backdrop-blur-xl p-5 flex justify-between items-center text-white border-b border-white/10 shrink-0">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Car className="h-5 w-5"/> Catálogo de Modelos
              </h2>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setMostrarModelos(false)} className="text-gray-400 hover:text-white transition-colors"><X className="h-6 w-6" /></motion.button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
              <div className="flex flex-col gap-2 max-w-xl mx-auto">
                {FAMILIAS_CATALOGO.map((familia) => {
                  const versiones = versionesPorModelo[familia] || [];
                  const expandida = familiaExpandida === familia;
                  return (
                    <div key={familia} className={`rounded-2xl border transition-colors ${expandida ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10'}`}>
                      <button
                        onClick={() => setFamiliaExpandida(expandida ? null : familia)}
                        className="relative w-full flex items-center justify-center px-5 py-4 font-black text-base text-white text-center"
                      >
                        {familia}
                        <ChevronLeft className={`absolute right-5 h-5 w-5 text-gray-400 transition-transform ${expandida ? '-rotate-90' : 'rotate-180'}`} />
                      </button>
                      <AnimatePresence initial={false}>
                        {expandida && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 flex flex-col gap-1.5">
                              {versiones.map((version) => (
                                <motion.button
                                  key={version.nombre}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  onClick={() => setVersionFicha(version)}
                                  className="w-full flex items-center gap-3 bg-white/5 hover:bg-yellow-500/10 border border-white/10 hover:border-yellow-500 rounded-xl px-3 py-2.5 transition-colors text-left"
                                >
                                  <div className="h-12 w-12 shrink-0 bg-gray-100 rounded-lg flex items-center justify-center p-1 border border-white/10">
                                    <img src={version.imgPortada} alt={version.nombre} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate">{version.nombre}</p>
                                    <p className="text-[11px] text-gray-400 font-medium truncate">{version.tipoPlan} · Cuota desde {version.cuota}</p>
                                  </div>
                                  <ChevronLeft className="h-4 w-4 text-gray-500 rotate-180 shrink-0" />
                                </motion.button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* POP-UP DE FICHA TÉCNICA POR VERSIÓN */}
      <AnimatePresence>
      {versionFicha && (
        <motion.div
          key="modal-ficha-version"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[85]"
          onClick={() => setVersionFicha(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900/90 backdrop-blur-xl rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative p-6 sm:p-8"
          >
            <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setVersionFicha(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"><X className="h-6 w-6" /></motion.button>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 w-full">
                <VisorVersion360 key={versionFicha.nombre} version={versionFicha} autoGirar />
              </div>

              <div className="flex-1 w-full space-y-5">
                <div>
                  <h3 className="text-3xl font-black text-white">{versionFicha.familia}</h3>
                  <p className="text-yellow-400 font-bold text-lg">{versionFicha.nombre}</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{versionFicha.tipoPlan} · Cuota Normal Desde</p>
                  <p className="text-4xl font-black text-white">{versionFicha.cuota}</p>
                  <p className="text-[10px] text-gray-500 font-medium mt-1.5 leading-tight">
                    * El valor de la cuota normal base es estimativo y se actualiza según la lista de precios vigente del vehículo 0km.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Ficha Técnica</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <Settings className="h-4 w-4 text-yellow-500 mb-1" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Motor</p>
                      <p className="text-sm font-bold text-white leading-tight">{versionFicha.motor}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <Gauge className="h-4 w-4 text-yellow-500 mb-1" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Transmisión</p>
                      <p className="text-sm font-bold text-white leading-tight">{versionFicha.transmision}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <Activity className="h-4 w-4 text-yellow-500 mb-1" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Tracción</p>
                      <p className="text-sm font-bold text-white leading-tight">{versionFicha.traccion}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <Fuel className="h-4 w-4 text-yellow-500 mb-1" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Consumo</p>
                      <p className="text-sm font-bold text-white leading-tight">{versionFicha.consumo}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <Package className="h-4 w-4 text-yellow-500 mb-1" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Baúl</p>
                      <p className="text-sm font-bold text-white leading-tight">{versionFicha.baul}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <Star className="h-4 w-4 text-yellow-500 mb-1" />
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Equipamiento Clave</p>
                      <p className="text-sm font-bold text-white leading-tight">{versionFicha.equipamiento}</p>
                    </div>
                  </div>
                </div>

                <a
                  href={`https://wa.me/5493815723178?text=${encodeURIComponent(`Hola! Me interesa consultar por la ${versionFicha.nombre} - ${versionFicha.tipoPlan} (Cuota desde ${versionFicha.cuota}).`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-md mt-4"
                >
                  <MessageCircle className="h-5 w-5" /> Consultar esta versión por WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* POP-UP DE DETALLE DE PLAN (vitrina comercial "Quiero mi 0km") */}
      <AnimatePresence>
      {planDetalle && (
        <motion.div
          key="modal-plan-detalle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 z-[95]"
          onClick={() => setPlanDetalle(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0B0F19] border border-yellow-500/20 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl relative"
          >
            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setPlanDetalle(null)}
              className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white transition-colors bg-black/40 rounded-full p-1.5"
            >
              <X className="h-5 w-5" />
            </motion.button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* PANEL IZQUIERDO */}
              <div className="p-6 sm:p-8 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-white/10">
                <div className="bg-gradient-to-b from-gray-100 to-gray-300 rounded-2xl w-full h-48 sm:h-56 flex items-center justify-center p-3 relative overflow-hidden">
                  <img
                    src={planDetalle.imgVitrina}
                    alt={planDetalle.nombre}
                    className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-xl"
                    draggable={false}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">{planDetalle.nombre}</h2>
                  <EstrellasRating valor={planDetalle.rating} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-yellow-500 text-gray-900 text-[11px] font-black px-3 py-1.5 rounded-full">
                    Plan: {planDetalle.planRatio}
                  </span>
                  <span className="bg-white/10 text-white text-[11px] font-bold px-3 py-1.5 rounded-full border border-white/10">
                    {planDetalle.cuotasTotales} Cuotas
                  </span>
                  <span className="bg-white/10 text-white text-[11px] font-bold px-3 py-1.5 rounded-full border border-white/10">
                    {planDetalle.segmento}
                  </span>
                </div>
                <a
                  href={`https://wa.me/5493815723178?text=${encodeURIComponent(`Hola! Quiero consultar por la ${planDetalle.nombre} - Plan ${planDetalle.planRatio} en ${planDetalle.cuotasTotales} cuotas.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mt-auto"
                >
                  <MessageCircle className="h-4 w-4" /> Contacto Rápido por WhatsApp
                </a>
              </div>

              {/* PANEL DERECHO: pestañas interactivas */}
              <div className="p-6 sm:p-8 flex flex-col gap-4">
                <div className="flex gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
                  <button
                    onClick={() => setTabPlanDetalle('valores')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-colors ${
                      tabPlanDetalle === 'valores' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <DollarSign className="h-3.5 w-3.5" /> Valores
                  </button>
                  <button
                    onClick={() => setTabPlanDetalle('detalle')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition-colors ${
                      tabPlanDetalle === 'detalle' ? 'bg-yellow-500 text-gray-900' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" /> Detalle
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {tabPlanDetalle === 'valores' ? (
                    <motion.div
                      key="tab-valores"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Valor Móvil Actual</p>
                        <p className="text-2xl font-black text-white">${planDetalle.valorMovil.toLocaleString('es-AR')}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Valor Mes Anterior</p>
                          <p className="text-lg font-black text-gray-300">
                            ${Math.round(planDetalle.valorMovil / (1 + planDetalle.variacionMensual / 100)).toLocaleString('es-AR')}
                          </p>
                        </div>
                        <span className="flex items-center gap-1 text-green-400 font-black text-sm shrink-0">
                          <TrendingUp className="h-4 w-4" /> +{planDetalle.variacionMensual.toFixed(2)}%
                        </span>
                      </div>
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-wide mb-1">Valor Estimado Cuota 1</p>
                        <p className="text-2xl font-black text-yellow-400">{planDetalle.cuota1Estimada}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tab-detalle"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      <div className={`rounded-2xl p-4 border flex items-center gap-3 ${
                        planDetalle.adjudicacionAsegurada.activa ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10'
                      }`}>
                        <CheckCircle2 className={`h-6 w-6 shrink-0 ${planDetalle.adjudicacionAsegurada.activa ? 'text-green-400' : 'text-gray-500'}`} />
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Adjudicación Asegurada</p>
                          <p className={`text-sm font-black ${planDetalle.adjudicacionAsegurada.activa ? 'text-green-400' : 'text-gray-400'}`}>
                            {planDetalle.adjudicacionAsegurada.activa
                              ? `Sí — Cuota ${planDetalle.adjudicacionAsegurada.cuota}`
                              : 'No (sujeto a sorteo/licitación)'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Requisitos</p>
                        <p className="text-sm font-medium text-gray-300">{planDetalle.requisitos}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Diferimiento</p>
                        <p className="text-sm font-medium text-gray-300">{planDetalle.diferimiento}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Origen</p>
                        <p className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-yellow-500" /> {planDetalle.origen}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botones de acción inferiores */}
                <div className="mt-2 pt-4 border-t border-white/10 space-y-2">
                  <button
                    onClick={() => setSeccionExpandidaPlan(seccionExpandidaPlan === 'retiro' ? null : 'retiro')}
                    className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black px-4 py-3 rounded-xl transition-colors"
                  >
                    <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-yellow-500" /> Gastos de Retiro</span>
                    <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${seccionExpandidaPlan === 'retiro' ? '-rotate-90' : 'rotate-180'}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {seccionExpandidaPlan === 'retiro' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-gray-400 font-medium bg-white/5 rounded-xl p-3.5">
                          Al momento de la entrega se abonan por separado los gastos de patentamiento, flete, gestoría y seguro de los primeros 30 días — varían según la provincia de radicación y no forman parte de la cuota del plan.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => setSeccionExpandidaPlan(seccionExpandidaPlan === 'cambio' ? null : 'cambio')}
                    className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black px-4 py-3 rounded-xl transition-colors"
                  >
                    <span className="flex items-center gap-2"><RefreshCw className="h-3.5 w-3.5 text-yellow-500" /> Cambio de Modelo</span>
                    <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${seccionExpandidaPlan === 'cambio' ? '-rotate-90' : 'rotate-180'}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {seccionExpandidaPlan === 'cambio' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="bg-white/5 rounded-xl p-3.5 space-y-2.5">
                          <p className="text-xs text-gray-400 font-medium">
                            Podés cambiar de gama antes de la adjudicación, ajustando la cuota al vehículo elegido. Consultá con un asesor para conocer las equivalencias disponibles.
                          </p>
                          <button
                            onClick={() => { setPlanDetalle(null); setMostrarModelos(true); setFamiliaExpandida(null); setVersionFicha(null); }}
                            className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                          >
                            Ver todos los modelos y versiones
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <a
                    href={`https://wa.me/5493815723178?text=${encodeURIComponent(`Hola! Quiero suscribirme a la ${planDetalle.nombre} - Plan ${planDetalle.planRatio} en ${planDetalle.cuotasTotales} cuotas (Cuota 1 desde ${planDetalle.cuota1Estimada}). Soy cliente nuevo.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg mt-2"
                  >
                    🚀 Suscribirme por WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {mostrarBeneficios && (
        <motion.div
          key="modal-beneficios"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[70]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gray-900/90 backdrop-blur-xl rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-white/10 relative"
          >
            <div className="bg-black/40 p-6 flex justify-between items-center text-white border-b border-white/10">
              <h2 className="text-xl font-black flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500 fill-yellow-500"/> Beneficios Exclusivos</h2>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setMostrarBeneficios(false)} className="text-gray-400 hover:text-white transition-colors"><X className="h-6 w-6" /></motion.button>
            </div>
            <div className="p-8 space-y-4">
              <div className="bg-yellow-500/10 text-yellow-300 p-4 rounded-2xl border border-yellow-500/30">
                <h3 className="font-bold mb-1">⛽ Llenado de Tanque Gratis</h3>
                <p className="text-sm">Al momento de la entrega de tu 0km.</p>
              </div>
              <div className="bg-white/5 text-white p-4 rounded-2xl border border-white/10">
                <h3 className="font-bold mb-1">🛠️ Revisión Técnica y Primer Service Gratis</h3>
                <p className="text-sm text-gray-300">Control y servicio sin cargo en el taller oficial Ruiz.</p>
              </div>
              <div className="bg-white/5 text-white p-4 rounded-2xl border border-white/10">
                <h3 className="font-bold mb-1">🧼 Lavado del Vehículo Gratis</h3>
                <p className="text-sm text-gray-300">Lavado de cortesía en cada visita de servicio.</p>
              </div>
              <div className="bg-white/5 text-white p-4 rounded-2xl border border-white/10">
                <h3 className="font-bold mb-1">🎁 Puntos Ruiz</h3>
                <p className="text-sm text-gray-300">Puntos por pagos a término canjeables por accesorios oficiales.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
      {mostrarContacto && (
        <motion.div
          key="modal-contacto"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[70]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-gray-900/90 backdrop-blur-xl rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-white/10 relative"
          >
            <div className="bg-black/40 p-6 flex justify-between items-center text-white border-b border-white/10">
              <h2 className="text-xl font-black flex items-center gap-2">✉️ Contacto Ruiz Automotores</h2>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setMostrarContacto(false)} className="text-gray-400 hover:text-white transition-colors"><X className="h-6 w-6" /></motion.button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex gap-4 items-start">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex-shrink-0"><MapPin className="h-6 w-6 text-yellow-500" /></div>
                <div>
                  <h3 className="font-bold text-white mb-1">Sucursal y Taller Oficial</h3>
                  <p className="text-sm text-gray-400">Av. Perón, San Miguel de Tucumán.<br/>Tucumán, Argentina.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex-shrink-0"><PhoneIcon className="h-6 w-6 text-yellow-500" /></div>
                <div>
                  <h3 className="font-bold text-white mb-1">Atención Telefónica</h3>
                  <p className="text-sm text-gray-400">Atención al cliente: <span className="font-semibold text-white">0810-888-7849</span></p>
                  <p className="text-sm text-gray-400">WhatsApp: <span className="font-semibold text-white">+54 9 381 572-3178</span></p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex-shrink-0"><Instagram className="h-6 w-6 text-yellow-500" /></div>
                <div>
                  <h3 className="font-bold text-white mb-1">Nuestras Redes</h3>
                  <div className="flex flex-col gap-2 mt-2">
                    <a href="#" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white font-medium"><Instagram className="h-4 w-4" /> @ruizautomotores</a>
                    <a href="#" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white font-medium"><Facebook className="h-4 w-4" /> /RuizAutomotoresSA</a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* BARRA DE NAVEGACIÓN FLOTANTE */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-gray-900/90 backdrop-blur-md border border-white/10 rounded-2xl px-2 py-2 shadow-2xl">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('home')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
            view === 'home'
              ? 'bg-yellow-500 text-gray-900 shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          🏠 Inicio
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMostrarSelectorCliente(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
            view === 'cliente' || view === 'nuevo'
              ? 'bg-white text-gray-900 shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          👤 Cliente
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('admin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
            view === 'admin'
              ? 'bg-white text-gray-900 shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          🛡️ Admin
        </motion.button>
      </div>
    </div>
  );
}