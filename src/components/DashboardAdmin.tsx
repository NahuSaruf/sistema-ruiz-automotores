import { useState, useEffect } from 'react';
import {
  Users, Zap, Plus, UploadCloud, FileSpreadsheet, Search,
  Trophy, RefreshCw, Target, X, ExternalLink, CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parsearExcel, guardarCartera, cargarCartera, limpiarCartera, ClienteData } from '../utils/excelParser';

// Animaciones premium
const modalBackdrop = {
  hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 },
};
const modalContent = {
  hidden:  { opacity: 0, scale: 0.92, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
  exit:    { opacity: 0, scale: 0.92, y: 20, transition: { duration: 0.15 } },
};

function EstadoBadge({ estado }: { estado: string }) {
  const e = estado.toUpperCase();
  const base = 'text-[11px] font-bold px-3 py-1 rounded-full border';
  if (e.includes('AHORRISTA'))
    return <span className={`${base} bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/20`}>Ahorrista (Al dia)</span>;
  if (e.includes('ADJUDICADO'))
    return <span className={`${base} bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/20`}>Adjudicado (Pidio auto)</span>;
  if (e.includes('RESCINDIDO'))
    return <span className={`${base} bg-[#EF4444]/10 text-[#F87171] border-[#EF4444]/20`}>Rescindido</span>;
  if (e.includes('FINALIZO') || e.includes('LIQUIDADO'))
    return <span className={`${base} bg-white/[0.06] text-[#9BA1AA] border-white/10`}>Finalizado</span>;
  return <span className={`${base} bg-white/[0.06] text-[#9BA1AA] border-white/10`}>{estado}</span>;
}

export default function DashboardAdmin() {
  const [activeTab,       setActiveTab]       = useState<'cartera' | 'operativo' | 'estadisticas'>('cartera');
  const [subTab,          setSubTab]          = useState<'general' | 'adjudicados'>('general');
  const [clientesData,    setClientesData]    = useState<ClienteData[]>([]);
  const [adjudicadosData, setAdjudicadosData] = useState<ClienteData[]>([]);
  const [baseCargada,     setBaseCargada]     = useState(false);
  const [baseAdjCargada,  setBaseAdjCargada]  = useState(false);
  const [cargando,        setCargando]        = useState(false);
  const [busqueda,        setBusqueda]        = useState('');
  const [contactadosMap,  setContactadosMap]  = useState<Record<number, boolean>>({});
  const [modalOpOpen,     setModalOpOpen]     = useState(false);

  useEffect(() => {
    const guardada = cargarCartera();
    if (guardada.length > 0) {
      setClientesData(guardada);
      setBaseCargada(true);
    }
  }, []);

  const cargarGeneral = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargando(true);
    try {
      const datos = await parsearExcel(file);
      setClientesData(datos);
      guardarCartera(datos);
      setBaseCargada(true);
    } finally { setCargando(false); e.target.value = ''; }
  };

  const cargarAdjudicados = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCargando(true);
    try {
      const datos = await parsearExcel(file);
      setAdjudicadosData(datos);
      setBaseAdjCargada(true);
    } finally { setCargando(false); e.target.value = ''; }
  };

  const resetGeneral = () => { limpiarCartera(); setClientesData([]); setBaseCargada(false); setBusqueda(''); };
  const toggleContactado = (id: number) => setContactadosMap(prev => ({ ...prev, [id]: !prev[id] }));

  const filtrados = clientesData.filter(c => {
    if (!busqueda.trim()) return true;
    const b = busqueda.toLowerCase();
    return c.suscripcion.toLowerCase().includes(b) || c.nombre.toLowerCase().includes(b);
  });

  const oportunidades = clientesData.filter(c => c.esOportunidad);

  const waLink = (op: ClienteData) => {
    const msg = encodeURIComponent(
      `Hola ${op.nombre}! Le contactamos desde Ruiz Automotores en relacion a su suscripcion ${op.suscripcion}. Su vehiculo esta proximo a entregarse!`
    );
    return `https://wa.me/549${op.telefono}?text=${msg}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] p-4 sm:p-8 pb-28 relative overflow-hidden font-['Inter']">

      {/* Orbes de luz ambientales */}
      <div className="pointer-events-none fixed top-[-10%] right-[10%] w-[500px] h-[500px] bg-[#FFD54A]/[0.05] blur-[130px] rounded-full" />
      <div className="pointer-events-none fixed bottom-[5%] left-[8%] w-[440px] h-[440px] bg-[#3B82F6]/[0.05] blur-[130px] rounded-full" />

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto mb-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-['JetBrains_Mono'] uppercase tracking-[0.25em] text-[#FFD54A] mb-2">Panel Administrador</p>
            <h1 className="text-3xl sm:text-4xl font-['Archivo'] font-extrabold text-[#F6F5F2] flex items-center gap-2 tracking-tight">
              Hola, Nahuel <Zap className="h-7 w-7 text-[#FFD54A] fill-[#FFD54A]" />
            </h1>
            <p className="text-[#9BA1AA] mt-1">Gestion de cartera — Ruiz Automotores</p>
          </div>
          <button className="bg-[#FFD54A] hover:bg-[#ffdd66] text-[#0A0B0D] px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-[0_0_30px_-6px_rgba(255,213,74,0.6)]">
            <Plus className="h-5 w-5" /> Nuevo Suscriptor
          </button>
        </div>

        <div className="flex gap-1 border-b border-white/10 overflow-x-auto">
          {(['cartera', 'operativo', 'estadisticas'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 font-bold text-sm whitespace-nowrap transition-all relative ${
                activeTab === tab ? 'text-[#FFD54A]' : 'text-[#5C626B] hover:text-[#F6F5F2]'
              }`}>
              {tab === 'cartera' ? 'Cartera de Clientes' : tab === 'operativo' ? 'Control Operativo' : 'Estadisticas'}
              {activeTab === tab && (
                <motion.div layoutId="adminTab" className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#FFD54A] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">

        {activeTab === 'cartera' && (
          <div className="space-y-6">
            <div className="flex gap-2 bg-white/[0.03] border border-white/10 p-1 rounded-xl w-fit">
              {(['general', 'adjudicados'] as const).map(st => (
                <button key={st} onClick={() => setSubTab(st)}
                  className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                    subTab === st ? 'bg-white/[0.07] text-[#F6F5F2]' : 'text-[#5C626B] hover:text-[#F6F5F2]'
                  }`}>
                  {st === 'adjudicados' && <Trophy className="h-4 w-4 text-[#FFD54A]" />}
                  {st === 'general' ? 'Base General' : 'Actos y Adjudicados'}
                </button>
              ))}
            </div>

            {subTab === 'general' && (
              !baseCargada ? (
                <div className="rounded-3xl p-8 sm:p-12 border-2 border-dashed border-white/15 bg-white/[0.02] text-center flex flex-col items-center min-h-[400px] justify-center hover:border-[#FFD54A]/40 hover:bg-[#FFD54A]/[0.02] transition-all group">
                  <div className="bg-white/[0.04] p-4 rounded-full mb-6 group-hover:bg-[#FFD54A]/10 transition-colors">
                    <UploadCloud className="h-12 w-12 text-[#5C626B] group-hover:text-[#FFD54A] transition-colors" />
                  </div>
                  <h3 className="text-xl font-['Archivo'] font-bold text-[#F6F5F2] mb-2">Cargar Base General</h3>
                  <p className="text-[#9BA1AA] text-sm mb-8 max-w-sm">Subi tu archivo SAP (.xlsx o .csv). El sistema mapeara las columnas automaticamente.</p>
                  <label className={`cursor-pointer bg-[#FFD54A] hover:bg-[#ffdd66] text-[#0A0B0D] px-8 py-3.5 rounded-xl font-bold flex items-center gap-3 transition-all hover:scale-105 shadow-[0_0_30px_-8px_rgba(255,213,74,0.7)] ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <FileSpreadsheet className="h-5 w-5" />
                    {cargando ? 'Procesando...' : 'Seleccionar Archivo'}
                    <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={cargarGeneral} />
                  </label>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
                  <div className="p-5 border-b border-white/10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="relative w-full lg:w-80">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5C626B]" />
                      <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar suscripcion o nombre..."
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F6F5F2] placeholder:text-[#5C626B] outline-none focus:border-[#FFD54A]/40" />
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button onClick={() => setModalOpOpen(true)}
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                        className="text-xs font-bold text-[#F5A623] bg-[#F5A623]/10 hover:bg-[#F5A623]/20 px-4 py-2 rounded-xl flex items-center gap-1.5 border border-[#F5A623]/20 transition-all">
                        <Target className="h-4 w-4" /> {oportunidades.length} Oportunidades
                      </motion.button>
                      <button onClick={resetGeneral} className="text-xs font-bold text-[#9BA1AA] hover:text-[#F6F5F2] bg-white/[0.04] px-3 py-2 rounded-lg border border-white/10 flex items-center gap-1 transition-colors">
                        <RefreshCw className="h-3 w-3" /> Otra base
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                    <table className="w-full text-left min-w-[900px]">
                      <thead className="sticky top-0 z-10 bg-[#101216] border-b border-white/10">
                        <tr>
                          {['Suscripcion', 'Nombre del Cliente', 'Estado', 'Vehiculo / Situacion', 'Accion'].map(h => (
                            <th key={h} className="py-4 px-5 text-[10px] font-['JetBrains_Mono'] font-bold text-[#5C626B] uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {filtrados.slice(0, 200).map(row => (
                          <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-5">
                              <span className={`text-[9px] font-black block mb-0.5 font-['JetBrains_Mono'] ${row.esDigital ? 'text-[#60A5FA]' : 'text-[#5C626B]'}`}>
                                {row.esDigital ? 'DIGITAL' : 'FISICA'}
                              </span>
                              <span className="font-bold text-[#F6F5F2] font-['JetBrains_Mono']">{row.suscripcion}</span>
                            </td>
                            <td className="py-3 px-5 font-bold text-[#F6F5F2]">{row.nombre}</td>
                            <td className="py-3 px-5"><EstadoBadge estado={row.estadoNormalizado} /></td>
                            <td className="py-3 px-5">
                              {row.esOportunidad ? (
                                <div>
                                  <span className="bg-[#F5A623]/10 text-[#F5A623] text-[10px] font-black px-2.5 py-1 rounded-md border border-[#F5A623]/20 flex items-center gap-1.5 w-fit">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623] animate-pulse" />ULTIMAS CUOTAS VIGENTES
                                  </span>
                                  <span className="text-[9px] text-[#F5A623]/70 font-bold mt-0.5 block">Oportunidad de entrega</span>
                                </div>
                              ) : (
                                <span className="text-[#9BA1AA]">{row.modeloP}</span>
                              )}
                            </td>
                            <td className="py-3 px-5 text-right">
                              <button onClick={() => toggleContactado(row.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                  contactadosMap[row.id] ? 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/20' : 'bg-white/[0.04] text-[#9BA1AA] border-white/10 hover:bg-white/[0.08]'
                                }`}>
                                {contactadosMap[row.id] ? 'Contactado' : 'Pendiente'}
                              </button>
                            </td>
                          </tr>
                        ))}
                        {filtrados.length === 0 && (
                          <tr><td colSpan={5} className="py-16 text-center text-[#5C626B] font-bold">Sin resultados para "{busqueda}"</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {filtrados.length > 200 && (
                    <p className="text-center text-xs text-[#5C626B] py-3 font-['JetBrains_Mono']">Mostrando 200 de {filtrados.length} registros.</p>
                  )}
                </div>
              )
            )}

            {subTab === 'adjudicados' && (
              !baseAdjCargada ? (
                <div className="rounded-3xl p-8 sm:p-12 border-2 border-dashed border-[#FFD54A]/20 bg-[#FFD54A]/[0.02] text-center flex flex-col items-center min-h-[400px] justify-center hover:border-[#FFD54A]/40 hover:bg-[#FFD54A]/[0.04] transition-all group">
                  <div className="bg-[#FFD54A]/10 p-4 rounded-full mb-6"><Trophy className="h-12 w-12 text-[#FFD54A]" /></div>
                  <h3 className="text-xl font-['Archivo'] font-bold text-[#F6F5F2] mb-2">Cargar Base de Actos</h3>
                  <label className={`cursor-pointer bg-[#FFD54A] hover:bg-[#ffdd66] text-[#0A0B0D] px-8 py-3.5 rounded-xl font-bold flex items-center gap-3 transition-all mt-6 hover:scale-105 shadow-[0_0_30px_-8px_rgba(255,213,74,0.7)] ${cargando ? 'opacity-60 pointer-events-none' : ''}`}>
                    <Trophy className="h-5 w-5" />
                    {cargando ? 'Procesando...' : 'Seleccionar Archivo'}
                    <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={cargarAdjudicados} />
                  </label>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
                  <div className="p-5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-['Archivo'] font-bold text-[#F6F5F2] flex items-center gap-2"><Trophy className="h-5 w-5 text-[#FFD54A]" /> Ultimos Ganadores</h3>
                    <button onClick={() => { setAdjudicadosData([]); setBaseAdjCargada(false); }} className="text-xs font-bold text-[#9BA1AA] hover:text-[#F6F5F2] bg-white/[0.04] px-3 py-1.5 rounded-lg border border-white/10 transition-colors">Subir otra base</button>
                  </div>
                  <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <thead className="sticky top-0 bg-[#101216] border-b border-white/10 z-10">
                        <tr>
                          {['Contrato', 'Titular', 'Estado', 'Modelo'].map(h => (
                            <th key={h} className="py-4 px-5 text-[10px] font-['JetBrains_Mono'] font-bold text-[#5C626B] uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {adjudicadosData.slice(0, 200).map(row => (
                          <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-5 font-bold text-[#F6F5F2] font-['JetBrains_Mono']">{row.suscripcion}</td>
                            <td className="py-3 px-5 font-bold text-[#F6F5F2]">{row.nombre}</td>
                            <td className="py-3 px-5"><EstadoBadge estado={row.estadoNormalizado} /></td>
                            <td className="py-3 px-5 text-[#9BA1AA]">{row.modeloP}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'operativo' && (
          <div className="rounded-3xl p-8 border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <h2 className="text-2xl font-['Archivo'] font-extrabold text-[#F6F5F2] mb-2">Control Operativo y Comercial</h2>
            <p className="text-[#9BA1AA] text-sm">Gestion de cambios de modelo, morosidad y condiciones de agencia.</p>
            <div className="mt-8 bg-white/[0.02] rounded-2xl p-8 text-center border border-dashed border-white/10">
              <AlertTriangle className="h-10 w-10 text-[#5C626B] mx-auto mb-3" />
              <p className="text-[#5C626B] font-bold">Modulo en desarrollo</p>
            </div>
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Cartera Total', valor: clientesData.length || 0, icon: <Users className="h-6 w-6 text-[#60A5FA]" /> },
                { label: 'Oportunidades', valor: oportunidades.length, icon: <Target className="h-6 w-6 text-[#F5A623]" /> },
                { label: 'Adjudicados', valor: adjudicadosData.length, icon: <Trophy className="h-6 w-6 text-[#FFD54A]" /> },
                { label: 'Contactados', valor: Object.values(contactadosMap).filter(Boolean).length, icon: <CheckCircle2 className="h-6 w-6 text-[#4ADE80]" /> },
              ].map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="p-6 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl"
                >
                  <div className="bg-white/[0.04] p-2 rounded-xl w-fit mb-4 border border-white/10">{card.icon}</div>
                  <p className="text-[10px] font-['JetBrains_Mono'] font-bold text-[#5C626B] uppercase tracking-widest mb-1">{card.label}</p>
                  <p className="text-4xl font-['Archivo'] font-extrabold text-[#F6F5F2]">{card.valor}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL OPORTUNIDADES */}
      <AnimatePresence>
        {modalOpOpen && (
          <motion.div
            variants={modalBackdrop} initial="hidden" animate="visible" exit="exit"
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
          >
            <motion.div
              variants={modalContent} initial="hidden" animate="visible" exit="exit"
              className="rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-white/10 bg-[#15181D] shadow-2xl"
            >
              <div className="bg-gradient-to-r from-[#F5A623] to-[#FFD54A] p-6 flex justify-between items-center text-[#0A0B0D]">
                <h2 className="text-xl font-['Archivo'] font-extrabold flex items-center gap-2"><Target className="h-6 w-6" /> Oportunidades ({oportunidades.length})</h2>
                <button onClick={() => setModalOpOpen(false)} className="text-[#0A0B0D]/60 hover:text-[#0A0B0D]"><X className="h-6 w-6" /></button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-[#0A0B0D] space-y-3">
                {oportunidades.length === 0 ? (
                  <p className="text-center text-[#5C626B] py-12 font-bold">No hay oportunidades detectadas</p>
                ) : oportunidades.map(op => (
                  <div key={op.id} className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#F5A623]/10 text-[#F5A623] px-3 py-2 rounded-xl font-black text-xs border border-[#F5A623]/20 font-['JetBrains_Mono']">{op.suscripcion}</div>
                      <div>
                        <p className="font-bold text-[#F6F5F2] text-sm">{op.nombre}</p>
                        <p className="text-xs text-[#5C626B] mt-0.5 font-['JetBrains_Mono']">Tel: +549 {op.telefono}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleContactado(op.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          contactadosMap[op.id] ? 'bg-[#4ADE80]/10 text-[#4ADE80] border-[#4ADE80]/20' : 'bg-white/[0.04] text-[#9BA1AA] border-white/10 hover:bg-white/[0.08]'
                        }`}>
                        {contactadosMap[op.id] ? 'Contactado' : 'Pendiente'}
                      </button>
                      <a href={waLink(op)} target="_blank" rel="noopener noreferrer"
                        className="bg-[#4ADE80] hover:bg-[#5ee88f] text-[#0A0B0D] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors">
                        WhatsApp <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}