import { useState, useEffect, useRef } from 'react';
import {
  Award, CreditCard, Download, AlertTriangle, Info, Trophy, Lock, Bot, Phone, Send, X,
  User, MapPin, Mail, Clock, FileText, MessageSquare, ExternalLink, Pause, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClienteData } from '../utils/excelParser';

// Animaciones reutilizables (estetica premium)
const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const modalBackdrop = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};
const modalContent = {
  hidden:  { opacity: 0, scale: 0.92, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
  exit:    { opacity: 0, scale: 0.92, y: 20, transition: { duration: 0.15 } },
};

interface Props {
  clienteActual?: ClienteData | null;
  onAbrirCatalogo: () => void;
  onIrALicitaciones?: () => void;
}

const TOTAL_FOTOS_360 = 6;

// Datos del plan (para el tacometro)
const CUOTA_ACTUAL = 15;
const CUOTA_TOTAL  = 84;
const PORCENTAJE   = Math.round((CUOTA_ACTUAL / CUOTA_TOTAL) * 100); // 18

export default function DashboardCliente({ clienteActual, onAbrirCatalogo, onIrALicitaciones }: Props) {
  // Datos del cliente (reales o demo)
  const nombre        = clienteActual?.nombre?.split(' ')[0]  || 'Juan';
  const suscripcion   = clienteActual?.suscripcion            || '2603345';
  const modelo        = clienteActual?.modeloP                || 'Kardian 75%';

  // 360
  const [rotacion,    setRotacion]    = useState(1);
  const [isDragging,  setIsDragging]  = useState(false);
  const [startX,      setStartX]      = useState(0);
  const [autogiro,    setAutogiro]    = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (autogiro && !isDragging) {
      intervalRef.current = setInterval(() => {
        setRotacion(prev => (prev >= TOTAL_FOTOS_360 ? 1 : prev + 1));
      }, 1500);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autogiro, isDragging]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    setStartX('touches' in e ? e.touches[0].clientX : e.clientX);
  };
  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - startX;
    if (Math.abs(diff) > 20) {
      setRotacion(prev => { let n = prev + (diff > 0 ? 1 : -1); if (n > TOTAL_FOTOS_360) n = 1; if (n < 1) n = TOTAL_FOTOS_360; return n; });
      setStartX(clientX);
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  // ROMBITO
  const [mostrarModalPagos, setMostrarModalPagos] = useState(false);
  const grupoHabilitadoLicitacion = true;
  const [menuRombitoAbierto,  setMenuRombitoAbierto]  = useState(false);
  const [chatRombitoAbierto,  setChatRombitoAbierto]  = useState(false);
  const [mensajeChat,         setMensajeChat]         = useState('');
  const [historialChat, setHistorialChat] = useState([
    { emisor: 'rombito', texto: `Hola ${nombre}! Soy Rombito, tu asistente virtual de Plan Rombo. En que te puedo ayudar hoy?` }
  ]);

  const enviarMensaje = () => {
    if (!mensajeChat.trim()) return;
    setHistorialChat(prev => [...prev, { emisor: 'user', texto: mensajeChat }]);
    setMensajeChat('');
    setTimeout(() => {
      setHistorialChat(prev => [...prev, {
        emisor: 'rombito',
        texto: 'En este momento estoy aprendiendo a responder esa consulta. Por ahora usa los botones de WhatsApp o Llamada para hablar con un asesor. Pronto sere mas inteligente!'
      }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] p-4 sm:p-8 pb-28 relative overflow-hidden font-['Inter']">

      {/* Keyframes del tacometro (aguja + arco) */}
      <style>{`
        @keyframes gaugeFill   { from { stroke-dashoffset: 440; } to { stroke-dashoffset: ${440 - (440 * PORCENTAJE) / 100}; } }
        @keyframes gaugeNeedle { from { transform: rotate(-180deg); } to { transform: rotate(${-180 + (PORCENTAJE * 180) / 100}deg); } }
        .gauge-arc-fill { stroke-dashoffset: 440; animation: gaugeFill 1.8s cubic-bezier(.22,1,.36,1) .4s forwards; }
        .gauge-needle   { transform-origin: 160px 160px; transform: rotate(-180deg); animation: gaugeNeedle 1.8s cubic-bezier(.22,1,.36,1) .4s forwards; }
        @media (prefers-reduced-motion: reduce) {
          .gauge-arc-fill { animation: none; stroke-dashoffset: ${440 - (440 * PORCENTAJE) / 100}; }
          .gauge-needle   { animation: none; transform: rotate(${-180 + (PORCENTAJE * 180) / 100}deg); }
        }
      `}</style>

      {/* Orbes de luz ambientales del fondo */}
      <div className="pointer-events-none fixed top-[-10%] left-[10%] w-[500px] h-[500px] bg-[#FFD54A]/[0.06] blur-[130px] rounded-full" />
      <div className="pointer-events-none fixed bottom-[5%] right-[8%] w-[460px] h-[460px] bg-[#3B82F6]/[0.05] blur-[130px] rounded-full" />

      {/* ══ BANNER PUBLICITARIO ══════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="max-w-7xl mx-auto mb-10 relative z-10">
        <div className="rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-72 h-72 bg-[#FFD54A]/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-[#F5A623]/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex-1">
            <span className="inline-flex items-center gap-2 bg-[#FFD54A]/10 text-[#FFD54A] text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-[#FFD54A]/20 mb-4 font-['JetBrains_Mono']">
              Lanzamientos Exclusivos 2026
            </span>
            <h2 className="text-3xl sm:text-4xl font-['Archivo'] font-extrabold text-[#F6F5F2] leading-[1.05] tracking-tight">
              Renova tu plan o suscribite a los nuevos{' '}
              <span className="bg-gradient-to-r from-[#FFD54A] to-[#F5A623] bg-clip-text text-transparent">Boreal y Koleos</span>
            </h2>
            <p className="text-[#9BA1AA] text-sm mt-4 max-w-md leading-relaxed">
              Proximamente llegada exclusiva de <strong className="text-[#F6F5F2] font-bold">Niagara</strong>.
              Consultá disponibilidad con tu asesor de confianza.
            </p>
            <a
              href="https://wa.me/5493815723178?text=Hola!%20Me%20interesa%20conocer%20el%20Boreal%20y%20Koleos%202026"
              target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 mt-6 bg-[#FFD54A] hover:bg-[#ffdd66] text-[#0A0B0D] px-6 py-3 rounded-xl font-bold transition-all text-sm shadow-[0_0_30px_-6px_rgba(255,213,74,0.6)]"
            >
              <MessageSquare className="h-4 w-4" /> Consulta ahora
            </a>
          </div>

          <div className="relative z-10 flex-shrink-0">
            <img src="/Boreal.png" alt="Boreal 2026" className="h-40 sm:h-56 object-contain mix-blend-lighten drop-shadow-2xl" onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
        </div>
      </motion.div>

      {/* ══ BIENVENIDA ═══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto mb-6 relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <p className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-[0.25em] text-[#FFD54A] mb-2">Mi Plan Ruiz</p>
          <h1 className="text-4xl sm:text-5xl font-['Archivo'] font-extrabold text-[#F6F5F2] tracking-tight">Hola, {nombre}</h1>
          <p className="text-[#9BA1AA] mt-2 text-base sm:text-lg max-w-2xl">
            Tu nuevo Renault esta cada vez mas cerca. Este es el estado de tu plan.
          </p>
        </motion.div>
      </div>

      {/* ══ TACOMETRO DEL PLAN ═══════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto mb-8 relative z-10">
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          className="rounded-3xl p-6 sm:p-10 border border-white/10 bg-white/[0.03] backdrop-blur-xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden"
        >
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FFD54A]/[0.07] blur-[100px] rounded-full pointer-events-none" />

          {/* Info izquierda */}
          <div className="flex-1 w-full relative z-10">
            <p className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-[0.25em] text-[#9BA1AA] mb-3">Progreso de tu Plan</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-['Archivo'] font-extrabold text-[#F6F5F2] leading-none">{CUOTA_ACTUAL}</span>
              <span className="text-xl text-[#5C626B] font-['JetBrains_Mono']">/ {CUOTA_TOTAL} cuotas</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 max-w-md">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#5C626B] mb-1.5">Grupo y Orden</p>
                <p className="text-[#FFD54A] font-bold text-lg font-['JetBrains_Mono'] tracking-wider">{suscripcion}</p>
              </div>
              <div className="rounded-2xl border border-[#4ADE80]/20 bg-[#4ADE80]/[0.06] p-4">
                <p className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#5C626B] mb-1.5">Estado de Cuenta</p>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#4ADE80] animate-pulse" />
                  <p className="text-[#4ADE80] font-bold text-sm">Cuota al dia</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tacometro derecha */}
          <div className="relative z-10 flex-shrink-0">
            <svg viewBox="0 0 320 200" className="w-[280px] sm:w-[340px] h-auto">
              <defs>
                <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#F5A623" />
                  <stop offset="100%" stopColor="#FFD54A" />
                </linearGradient>
                <filter id="arcGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              {/* Ticks */}
              {Array.from({ length: 11 }).map((_, i) => {
                const ang = Math.PI - (i / 10) * Math.PI;
                const x1 = 160 + Math.cos(ang) * 118, y1 = 160 - Math.sin(ang) * 118;
                const x2 = 160 + Math.cos(ang) * 132, y2 = 160 - Math.sin(ang) * 132;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2A2E36" strokeWidth="2" />;
              })}
              {/* Track */}
              <path d="M 20 160 A 140 140 0 0 1 300 160" fill="none" stroke="#181B21" strokeWidth="20" strokeLinecap="round" />
              {/* Progreso */}
              <path
                className="gauge-arc-fill"
                d="M 20 160 A 140 140 0 0 1 300 160"
                fill="none" stroke="url(#arcGrad)" strokeWidth="20" strokeLinecap="round"
                strokeDasharray="440" filter="url(#arcGlow)"
              />
              {/* Aguja */}
              <g className="gauge-needle">
                <polygon points="160,152 160,168 285,160" fill="#FFD54A" />
                <circle cx="160" cy="160" r="14" fill="#0A0B0D" stroke="#FFD54A" strokeWidth="3" />
              </g>
              {/* Centro texto */}
              <text x="160" y="120" textAnchor="middle" className="font-['Archivo']" fill="#F6F5F2" fontSize="46" fontWeight="800">{PORCENTAJE}%</text>
              <text x="160" y="145" textAnchor="middle" className="font-['JetBrains_Mono']" fill="#9BA1AA" fontSize="13" letterSpacing="2">PAGADO</text>
            </svg>
          </div>
        </motion.div>
      </div>

      {/* ══ GRID PRINCIPAL ═══════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-start relative z-10">

        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-2 space-y-6">

          {/* VISOR 360 - STAGE DARK */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="visible"
            className="rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/[0.03] backdrop-blur-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[440px]"
          >
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
              <h2 className="text-xl font-['Archivo'] font-bold text-[#F6F5F2]">Mi Vehiculo</h2>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => setAutogiro(a => !a)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-1.5 bg-white/[0.06] hover:bg-white/10 text-[#F6F5F2] px-3 py-1.5 rounded-full font-bold text-xs transition-colors border border-white/10"
                >
                  {autogiro ? <><Pause className="h-3 w-3" /> Pausar</> : <><Play className="h-3 w-3" /> Girar</>}
                </motion.button>
                <span className="bg-[#4ADE80]/10 text-[#4ADE80] text-xs font-bold px-3 py-1.5 rounded-full border border-[#4ADE80]/20">Suscripcion Activa</span>
              </div>
            </div>

            {/* Light box showroom: fondo claro donde la foto (con su fondo blanco) se funde perfecto */}
            <div
              className="w-full max-w-xl mt-10 relative group cursor-ew-resize select-none touch-pan-y rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]"
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
              onTouchStart={handleMouseDown} onTouchMove={handleMouseMove} onTouchEnd={handleMouseUp}
            >
              <div
                className="relative flex items-center justify-center min-h-[300px] px-6 py-8"
                style={{ background: 'radial-gradient(ellipse 95% 90% at 50% 42%, #ffffff 0%, #ffffff 52%, #eceef1 100%)' }}
              >
                {/* Rombo Renault marca de agua */}
                <svg viewBox="0 0 100 100" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 opacity-[0.06] pointer-events-none" fill="none" stroke="#0A0B0D" strokeWidth="3">
                  <polygon points="50,8 78,50 50,92 22,50" />
                </svg>
                {/* Sombra de piso bajo el auto */}
                <div className="absolute left-1/2 bottom-7 -translate-x-1/2 w-2/3 h-6 rounded-[50%] blur-md pointer-events-none" style={{ background: 'rgba(0,0,0,0.16)' }} />

                <img
                  src={`/Kardian${rotacion}.png`}
                  alt="Vista 360"
                  className="w-full h-auto object-contain pointer-events-none relative z-10"
                  onError={e => { const t = e.currentTarget; if (!t.src.endsWith('/Kardian.png')) t.src = '/Kardian.png'; }}
                />
              </div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-white/90 text-[10px] font-bold px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10 opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {autogiro ? 'Giro automatico activo — arrastra para controlar' : 'Arrastra con el mouse o dedo para girar'}
              </div>
            </div>
          </motion.div>

          {/* DATOS PERSONALES + CONCESIONARIO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-3xl p-6 border border-white/10 bg-white/[0.03] backdrop-blur-xl">
              <h3 className="text-lg font-['Archivo'] font-bold text-[#F6F5F2] mb-5 flex items-center gap-2"><User className="h-5 w-5 text-[#FFD54A]" /> Datos Personales</h3>
              <div className="space-y-4">
                {[
                  { icon: <User className="h-5 w-5 text-[#5C626B]" />, label: 'Nombre', val: clienteActual?.nombre || 'Juan Perez' },
                  { icon: <Mail className="h-5 w-5 text-[#5C626B]" />, label: 'Email',  val: 'juan.perez@email.com' },
                  { icon: <Phone className="h-5 w-5 text-[#5C626B]" />, label: 'Telefono', val: clienteActual?.telefono ? `+54 9 ${clienteActual.telefono}` : '+54 9 381 555-1234' },
                  { icon: <FileText className="h-5 w-5 text-[#5C626B]" />, label: 'Suscripcion', val: suscripcion },
                ].map(item => (
                  <div key={item.label} className="flex gap-4">
                    <div className="mt-1 flex-shrink-0">{item.icon}</div>
                    <div>
                      <p className="text-[10px] font-['JetBrains_Mono'] font-bold text-[#5C626B] uppercase tracking-widest mb-0.5">{item.label}</p>
                      <p className="font-bold text-[#F6F5F2]">{item.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-3xl p-6 border border-white/10 bg-white/[0.03] backdrop-blur-xl flex flex-col">
              <h3 className="text-lg font-['Archivo'] font-bold text-[#F6F5F2] mb-5 flex items-center gap-2"><MapPin className="h-5 w-5 text-[#FFD54A]" /> Concesionario RENAULT RUIZ S.A.</h3>
              <div className="space-y-4 mb-4 flex-grow">
                <div className="flex gap-3"><MapPin className="h-5 w-5 text-[#FFD54A] flex-shrink-0 mt-0.5" /><p className="text-sm text-[#9BA1AA]">Av. Peron, San Miguel de Tucuman, Argentina</p></div>
                <div className="flex gap-3"><Phone className="h-5 w-5 text-[#FFD54A] flex-shrink-0 mt-0.5" /><p className="text-sm text-[#9BA1AA]">0810-888-7849</p></div>
                <div className="flex gap-3"><Clock className="h-5 w-5 text-[#FFD54A] flex-shrink-0 mt-0.5" /><p className="text-sm text-[#9BA1AA]">Lun-Vie 08:30-18:00 / Sab 09:00-13:00</p></div>
              </div>
              <div className="bg-white/[0.02] rounded-2xl flex-1 min-h-[120px] flex items-center justify-center border border-white/10">
                <MapPin className="h-10 w-10 text-[#2A2E36]" />
              </div>
            </motion.div>
          </div>

          {/* ══ ACCESOS OFICIALES PLAN ROMBO ════════════════════════════════ */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <h3 className="text-lg font-['Archivo'] font-bold text-[#F6F5F2] mb-5 flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-[#FFD54A]" /> Accesos Oficiales Plan Rombo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: 'Plan Rombo Oficial', desc: 'Sitio oficial de Plan Rombo Renault', url: 'https://www.planrombo.com.ar/', icon: <ExternalLink className="h-6 w-6" />, accent: 'text-[#FFD54A]' },
                { label: 'Buscar mi Cupon de Pago', desc: 'Descarga tu cupon mensual', url: 'https://www.planrombo.com.ar/frontoffice/contratos/buscar', icon: <FileText className="h-6 w-6" />, accent: 'text-[#9BA1AA]' },
                { label: 'Invitacion a Licitar', desc: 'Consulta si podes ofertar este mes', url: 'https://www.planrombo.com.ar/actos-de-adjudicacion/invitacion', icon: <Trophy className="h-6 w-6" />, accent: 'text-[#FFD54A]' },
              ].map(btn => (
                <motion.a
                  key={btn.label} href={btn.url} target="_blank" rel="noopener noreferrer"
                  whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
                  className="group border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-[#FFD54A]/30 text-[#F6F5F2] p-5 rounded-2xl font-bold flex flex-col gap-2 transition-all"
                >
                  <span className={btn.accent}>{btn.icon}</span>
                  <span className="text-sm font-['Archivo'] font-bold leading-tight">{btn.label}</span>
                  <span className="text-xs font-medium text-[#5C626B]">{btn.desc}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
          {/* PUNTOS RUIZ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }} whileHover={{ y: -4, scale: 1.02 }}
            className="relative rounded-3xl p-6 overflow-hidden border border-[#FFD54A]/30 bg-gradient-to-br from-[#FFD54A] to-[#F5A623] text-[#0A0B0D] shadow-[0_0_50px_-12px_rgba(255,213,74,0.5)]"
          >
            <motion.div
              className="absolute -top-10 -right-10 w-40 h-40 bg-white/40 blur-3xl rounded-full pointer-events-none"
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.25, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3"><Award className="h-7 w-7" /><h2 className="text-lg font-['Archivo'] font-bold">Mis Puntos Ruiz</h2></div>
                <span className="text-3xl font-['Archivo'] font-extrabold">2.450</span>
              </div>
              <p className="text-[#0A0B0D]/70 text-sm font-medium leading-relaxed">Sumaste 500 puntos por pago a termino. Mantene tus cuotas al dia para canjearlos.</p>
            </div>
          </motion.div>

          {/* ESTADO DE CUENTA */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-3xl p-6 border border-white/10 bg-white/[0.03] backdrop-blur-xl flex flex-col">
            <h2 className="text-lg font-['Archivo'] font-bold text-[#F6F5F2] mb-5 flex items-center gap-2"><CreditCard className="h-5 w-5 text-[#FFD54A]" /> Estado de Cuenta</h2>
            <div className="rounded-2xl p-4 border border-white/10 bg-white/[0.02] mb-5 space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-['JetBrains_Mono'] font-bold text-[#5C626B] uppercase tracking-widest">Plan Suscripto</span>
                <span className="text-sm font-bold text-[#F6F5F2]">{modelo}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-[10px] font-['JetBrains_Mono'] font-bold text-[#5C626B] uppercase tracking-widest">Modalidad</span>
                <span className="text-sm font-bold text-[#F6F5F2]">Debito Automatico</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-['JetBrains_Mono'] font-bold text-[#5C626B] uppercase tracking-widest">Medio de Pago</span>
                <div className="flex items-center gap-1.5">
                  <span className="bg-[#1A1F71] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">VISA</span>
                  <span className="text-sm font-bold text-[#F6F5F2] font-['JetBrains_Mono']">**** 4589</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-4 mb-5 text-center border border-[#FFD54A]/20 bg-[#FFD54A]/[0.06]">
              <span className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-widest text-[#9BA1AA] block mb-1">Proximo Vencimiento</span>
              <span className="text-3xl font-['Archivo'] font-extrabold text-[#FFD54A]">$184.500</span>
            </div>
            <div className="rounded-2xl p-4 mb-5 border border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-1.5 mb-1.5"><Info className="h-4 w-4 text-[#FFD54A]" /><h4 className="text-[10px] font-['JetBrains_Mono'] font-bold text-[#9BA1AA] uppercase tracking-widest">Ultimo Sorteo (Grupo)</h4></div>
              <p className="text-sm text-[#9BA1AA] font-medium leading-relaxed">El vehiculo del mes se adjudico mediante <strong className="text-[#F6F5F2]">Licitacion con 35 cuotas ofertadas</strong>.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button className="flex flex-col items-center justify-center bg-white/[0.03] p-3 rounded-xl border border-white/10 hover:bg-white/[0.06] transition-colors">
                <Download className="h-5 w-5 text-[#9BA1AA] mb-1" />
                <span className="text-xs font-bold text-[#F6F5F2]">Bajar Talon</span>
              </button>
              <button onClick={() => setMostrarModalPagos(true)} className="flex flex-col items-center justify-center bg-[#FFD54A] p-3 rounded-xl hover:bg-[#ffdd66] transition-colors shadow-[0_0_25px_-8px_rgba(255,213,74,0.7)]">
                <CreditCard className="h-5 w-5 text-[#0A0B0D] mb-1" />
                <span className="text-xs font-bold text-[#0A0B0D] text-center leading-tight">Adherir Otra Tarjeta</span>
              </button>
            </div>
            {grupoHabilitadoLicitacion ? (
              <button onClick={onIrALicitaciones} className="w-full bg-white/[0.04] hover:bg-white/[0.08] text-[#F6F5F2] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-colors">
                <Trophy className="h-5 w-5 text-[#FFD54A]" /> Gestionar Licitacion
              </button>
            ) : (
              <button disabled className="w-full bg-white/[0.02] text-[#5C626B] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-white/10 cursor-not-allowed">
                <Lock className="h-5 w-5" /> Grupo no habilitado este mes
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* ══ RESUMEN DE CUOTAS ════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto mb-8 relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-3xl p-6 sm:p-8 border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          <h3 className="text-lg font-['Archivo'] font-bold text-[#F6F5F2] mb-6 flex items-center gap-2"><FileText className="h-5 w-5 text-[#FFD54A]" /> Resumen de Cuotas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  {['Cuota', 'Fecha', 'Monto', 'Medio', 'Estado'].map(h => (
                    <th key={h} className={`py-4 px-2 text-[10px] font-['JetBrains_Mono'] font-bold text-[#5C626B] uppercase tracking-widest ${h === 'Estado' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { n: 15, f: '10/07/2026' }, { n: 14, f: '10/06/2026' }, { n: 13, f: '10/05/2026' },
                  { n: 12, f: '10/04/2026' }, { n: 11, f: '10/03/2026' }, { n: 10, f: '10/02/2026' },
                ].map(cuota => (
                  <tr key={cuota.n} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-2 font-bold text-[#F6F5F2] font-['JetBrains_Mono']">#{cuota.n}</td>
                    <td className="py-4 px-2 text-[#9BA1AA] font-['JetBrains_Mono']">{cuota.f}</td>
                    <td className="py-4 px-2 font-bold text-[#F6F5F2]">$184.500</td>
                    <td className="py-4 px-2 text-[#9BA1AA]">Debito Automatico</td>
                    <td className="py-4 px-2 text-right">
                      <span className="bg-[#4ADE80]/10 text-[#4ADE80] text-xs font-bold px-3 py-1 rounded-full border border-[#4ADE80]/20">Pagada</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* MODAL PAGOS */}
      <AnimatePresence>
        {mostrarModalPagos && (
          <motion.div
            variants={modalBackdrop} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              variants={modalContent} initial="hidden" animate="visible" exit="exit"
              className="rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 bg-[#15181D] backdrop-blur-2xl shadow-2xl"
            >
              <div className="sticky top-0 bg-[#15181D] border-b border-white/10 p-6 flex justify-between items-center">
                <h3 className="text-2xl font-['Archivo'] font-extrabold text-[#F6F5F2]">Medios de Pago</h3>
                <button onClick={() => setMostrarModalPagos(false)} className="bg-white/[0.06] hover:bg-white/10 rounded-full h-10 w-10 flex items-center justify-center text-[#F6F5F2] border border-white/10"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-6">
                <div className="rounded-2xl p-4 flex gap-3 border border-[#FFD54A]/20 bg-[#FFD54A]/[0.06]">
                  <AlertTriangle className="h-6 w-6 text-[#FFD54A] flex-shrink-0" />
                  <p className="text-sm text-[#F6F5F2]"><span className="font-bold">IMPORTANTE: </span>Plan Rombo nunca solicitara pagos en efectivo a cobradores.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ ROMBITO AI ══════════════════════════════════════════════════════ */}
      <div className="fixed bottom-20 right-6 z-[99999] flex flex-col items-end pointer-events-auto">
        {chatRombitoAbierto && (
          <div className="rounded-2xl shadow-2xl border border-white/10 bg-[#15181D] w-80 sm:w-96 mb-4 overflow-hidden flex flex-col">
            <div className="bg-white/[0.03] border-b border-white/10 text-[#F6F5F2] p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-[#FFD54A] p-2 rounded-full"><Bot className="h-5 w-5 text-[#0A0B0D]" /></div>
                <div>
                  <h3 className="font-['Archivo'] font-bold text-sm">Rombito AI</h3>
                  <div className="flex items-center gap-1"><span className="h-2 w-2 bg-[#4ADE80] rounded-full animate-pulse" /><p className="text-[10px] text-[#4ADE80] font-bold uppercase">En linea</p></div>
                </div>
              </div>
              <button onClick={() => setChatRombitoAbierto(false)} className="text-[#9BA1AA] hover:text-[#F6F5F2] bg-white/[0.06] p-1.5 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <div className="h-72 p-4 overflow-y-auto bg-[#0A0B0D] flex flex-col gap-3">
              {historialChat.map((msg, i) => (
                <div key={i} className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.emisor === 'rombito' ? 'bg-white/[0.05] border border-white/10 text-[#F6F5F2] self-start rounded-tl-none' : 'bg-[#FFD54A] text-[#0A0B0D] self-end rounded-tr-none font-medium'}`}>
                  {msg.texto}
                </div>
              ))}
            </div>
            <div className="p-3 bg-[#15181D] border-t border-white/10 flex gap-2">
              <input type="text" value={mensajeChat} onChange={e => setMensajeChat(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviarMensaje()}
                placeholder="Escribi tu consulta..." className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[#F6F5F2] placeholder:text-[#5C626B] outline-none focus:border-[#FFD54A]/40" />
              <button onClick={enviarMensaje} disabled={!mensajeChat.trim()} className="bg-[#FFD54A] text-[#0A0B0D] p-2.5 rounded-xl hover:bg-[#ffdd66] disabled:bg-white/[0.06] disabled:text-[#5C626B]"><Send className="h-5 w-5" /></button>
            </div>
          </div>
        )}

        {menuRombitoAbierto && !chatRombitoAbierto && (
          <div className="rounded-3xl shadow-2xl border border-white/10 bg-[#15181D] p-2 mb-4 w-64 flex flex-col gap-1.5">
            <button onClick={() => { setMenuRombitoAbierto(false); setChatRombitoAbierto(true); }}
              className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-white/[0.05] text-[#F6F5F2] transition-all font-bold text-sm group">
              <div className="bg-[#FFD54A]/15 text-[#FFD54A] p-2 rounded-full group-hover:bg-[#FFD54A] group-hover:text-[#0A0B0D] transition-colors"><Bot className="h-5 w-5" /></div>
              Chat con Rombito AI
            </button>
            <a href="https://wa.me/5493815723178" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-white/[0.05] text-[#F6F5F2] transition-all font-bold text-sm group">
              <div className="bg-[#4ADE80]/15 text-[#4ADE80] p-2 rounded-full group-hover:bg-[#4ADE80] group-hover:text-[#0A0B0D] transition-colors"><MessageSquare className="h-5 w-5" /></div>
              WhatsApp Asesor
            </a>
            <a href="tel:08108887849"
              className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-white/[0.05] text-[#F6F5F2] transition-all font-bold text-sm group">
              <div className="bg-white/[0.06] text-[#9BA1AA] p-2 rounded-full group-hover:bg-white group-hover:text-[#0A0B0D] transition-colors"><Phone className="h-5 w-5" /></div>
              Llamar Administracion
            </a>
          </div>
        )}

        {!chatRombitoAbierto && (
          <button onClick={() => setMenuRombitoAbierto(v => !v)}
            className="bg-[#15181D] text-[#F6F5F2] p-4 sm:p-5 rounded-full shadow-2xl hover:bg-[#1c2027] hover:scale-105 transition-all flex items-center justify-center relative border-[3px] border-white/10">
            {menuRombitoAbierto ? <X className="h-7 w-7 sm:h-8 sm:w-8" /> : <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-[#FFD54A]" />}
            {!menuRombitoAbierto && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFD54A] opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FFD54A] border-2 border-[#0A0B0D]" />
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}