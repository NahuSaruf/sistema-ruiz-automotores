import { useState, useRef } from 'react';
import { Search, Car, FileSpreadsheet, AlertCircle, CheckCircle2, Award, Clock, Sparkles, Edit2, Save, CreditCard, Banknote, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Cliente {
  id: number;
  nombre: string;
  grupoOrden: string;
  vehiculo: string;
  plan: string;
  estado: string;
  cuotasAbonadas: string;
  deudaEstado: string;
  montoDeuda: string;
  ultimaLicitacion: string;
  medioPago: string;
}

interface BaseClientesProps {
  modoPublico?: boolean;
}

const mapaMateriales: { [key: string]: string } = {
  'A4M1365': 'Renault Sandero Life 1.6 - Caja Manual',
  'A4M2390': 'Renault Stepway Intens 1.6 - Caja Manual',
  'ADC2110': 'Renault Master Furgón L1H1 - Caja Manual',
  'ADC2220': 'Renault Master Furgón L2H2 - Caja Manual',
  'ADC2320': 'Renault Master Furgón L3H2 - Caja Manual',
  'AU1T100': 'Renault Koleos Techno - Caja Automática',
  'BB1K400': 'Renault Kwid Iconic Bitono 1.0',
  'BB1K450': 'Renault Kwid Iconic Outsider 1.0',
  'F67N237': 'Renault Kangoo II Express 2A - Caja Manual',
  'F67N257': 'Renault Kangoo II Express 5A - Caja Manual',
  'HJD1121': 'Renault Duster Intens 1.6 - Caja Manual',
  'HJD1151': 'Renault Duster Iconic 1.3T - Caja Automática',
  'HJD1171': 'Renault Duster Iconic 1.3T 4x4 - Caja Manual',
  'HJF1110': 'Renault Kardian Evolution - Caja Manual',
  'HJF1121': 'Renault Kardian EDC ADAS - Caja Automática',
  'HJF1140': 'Renault Kardian Iconic - Caja Automática',
  'K67N247': 'Renault Kangoo Stepway - Caja Manual',
  'LJL1200': 'Renault Arkana E-Tech Hybrid - Caja Automática',
  'RM10020': 'Renault Boreal Evolution',
  'RM10030': 'Renault Boreal Techno',
  'RM10040': 'Renault Boreal Iconic',
  'U60A310': 'Renault Alaskan Confort 4WD - Caja Manual',
  'U60A355': 'Renault Alaskan Intens Noir 4WD - Caja Automática',
  'U792502': 'Renault Oroch Outsider 4WD - Caja Manual',
  'U792550': 'Renault Oroch Outsider - Caja Manual',
  'U792570': 'Renault Oroch Emotion 1.6 - Caja Manual',
  'U792571': 'Renault Oroch Iconic 1.3T - Caja Automática',
  'P3FC108': 'Renault Kardian - Caja Automática'
};

const traducirVehiculo = (codigoRaw: string = '') => {
  const filaTexto = String(codigoRaw).replace(/\s+/g, '').toUpperCase();
  for (const [codigo, nombreModelo] of Object.entries(mapaMateriales)) {
    if (filaTexto.includes(codigo)) {
      return nombreModelo;
    }
  }
  let vehiculoTraducido = codigoRaw;
  vehiculoTraducido = vehiculoTraducido
    .replace(/\bMT\b/gi, '- Caja Manual')
    .replace(/\bCVT\b/gi, '- Caja Automática')
    .replace(/\bEDC\b/gi, '- Caja Automática');
  return vehiculoTraducido;
};

// --- ARRAY LEYENDO TUS NOMBRES EXACTOS DE LA CARPETA PUBLIC ---
const obtenerFotogramas360 = (vehiculo: string) => {
  const v = vehiculo.toLowerCase();
  
  if (v.includes('koleos')) return ['/Koleos.png', '/Koleos1.png', '/Koleos2.png', '/Koleos3.png', '/Koleos4.png', '/Koleos5.png', '/Koleos6.png'];
  if (v.includes('kardian')) return ['/Kardian.png', '/Kardian1.png', '/Kardian2.png', '/Kardian3.png', '/Kardian4.png', '/Kardian5.png', '/Kardian6.png'];
  if (v.includes('duster') && !v.includes('oroch')) return ['/Duster.png', '/Duster1.png', '/Duster2.png', '/Duster3.png', '/Duster4.png', '/Duster5.png', '/Duster6.png'];
  if (v.includes('oroch')) return ['/Duster_Oroch.png', '/Duster_Oroch1.png', '/Duster_Oroch2.png', '/Duster_Oroch3.png', '/Duster_Oroch4.png', '/Duster_Oroch5.png', '/Duster_Oroch6.png'];
  if (v.includes('kwid')) return ['/Kwid.png', '/Kwid1.png', '/Kwid2.png', '/Kwid3.png', '/Kwid4.png', '/Kwid5.png', '/Kwid6.png'];
  if (v.includes('boreal')) return ['/Boreal.png', '/Boreal1.png', '/Boreal2.png', '/Boreal3.png', '/Boreal4.png', '/Boreal5.png', '/Boreal6.png'];
  if (v.includes('master')) return ['/Master.png', '/Master1.png', '/Master2.png', '/Master3.png', '/Master4.png', '/Master5.png', '/Master6.png', '/Master7.png'];
  if (v.includes('kangoo') && v.includes('2a')) return ['/Kangoo2a.png', '/Kangoo2a1.png', '/Kangoo2a2.png', '/Kangoo2a3.png', '/Kangoo2a4.png', '/Kangoo2a5.png', '/Kangoo2a6.png'];
  if (v.includes('kangoo') && v.includes('5a')) return ['/Kangoo5a.png', '/Kangoo5a1.png', '/Kangoo5a2.png', '/Kangoo5a3.png', '/Kangoo5a4.png', '/Kangoo5a5.png', '/Kangoo5a6.png'];

  // ESTÁTICAS
  if (v.includes('stepway')) return ['/Kango_Stepway.png']; 
  if (v.includes('kangoo')) return ['/Kangoo5a.png']; // Fallback genérico de Kangoo

  return ['/logo_png.png'];
};

export default function BaseClientes({ modoPublico = false }: BaseClientesProps) {
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const guardados = localStorage.getItem('ruiz_clientes_plancrm');
    if (guardados) {
      try { 
        const parsed = JSON.parse(guardados);
        return parsed.map((c: any) => ({
          ...c, 
          vehiculo: traducirVehiculo(c.vehiculo || ''),
          medioPago: c.medioPago || 'A definir',
          deudaEstado: c.deudaEstado || 'Al día',
          montoDeuda: c.montoDeuda || '$0'
        }));
      } catch (e) { /* ignore */ }
    }
    return [{
      id: 1, nombre: 'Juan Pérez', grupoOrden: 'P3FC108-U', vehiculo: 'Renault Kardian - Caja Automática', plan: 'Plan 75% en 84 Cuotas', estado: 'Ahorrista', cuotasAbonadas: 'Cuota 36 de 84', deudaEstado: 'Al día', montoDeuda: '$0 (Sin deudas pendientes)', ultimaLicitacion: 'Junio 2026 - Ganada con 44 cuotas adelantadas', medioPago: 'Tarjeta de Crédito Visa'
    }];
  });

  const [busqueda, setBusqueda] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editEstado, setEditEstado] = useState('');
  const [editDeuda, setEditDeuda] = useState('');
  const [indiceFotograma, setIndiceFotograma] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, totalFrames: number) => {
    if (totalFrames <= 1) return; 
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = e.clientX - rect.left;
    const ancho = rect.width;
    const porcentaje = Math.max(0, Math.min(1, xPos / ancho));
    const frameCalculado = Math.floor(porcentaje * totalFrames);
    setIndiceFotograma(Math.min(frameCalculado, totalFrames - 1));
  };

  const limpiarEstado = (textoEstado: string = '') => String(textoEstado || 'Ahorrista').replace(/^[A-Z0-9]+\s*-\s*/i, '').trim();
  
  const obtenerEstiloEstado = (estadoText: string = '') => {
    const lower = String(estadoText).toLowerCase();
    if (lower.includes('ahorrista')) return { clases: 'bg-yellow-100 text-yellow-800 border border-yellow-200', emoji: '➖' };
    if (lower.includes('renunciado') || lower.includes('rescindido')) return { clases: 'bg-red-100 text-red-800 border border-red-200', emoji: '❌' };
    if (lower.includes('cancelado')) return { clases: 'bg-sky-100 text-sky-800 border border-sky-200', emoji: '🤝' };
    if (lower.includes('adjudicado')) return { clases: 'bg-green-100 text-green-800 border border-green-200', emoji: '✅' };
    return { clases: 'bg-gray-100 text-gray-800 border border-gray-200', emoji: '📌' };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]) as any[];
        const clientesMapeados: Cliente[] = jsonData.map((item, index) => ({
          id: index + 1,
          nombre: item.Nombre || item.Cliente || item.SUSCRIPTOR || 'Sin nombre',
          grupoOrden: String(item.GrupoOrden || item.Contrato || item.GRUPO_ORDEN || '').toUpperCase(),
          vehiculo: traducirVehiculo(item.Vehiculo || item.Material || 'Renault 0KM'),
          plan: item.Plan || 'Plan de Ahorro',
          estado: limpiarEstado(String(item.Estado || item.ESTADO || item.SITUACION || 'Ahorrista')),
          cuotasAbonadas: item.CuotasAbonadas || 'Cuota 18 de 84',
          deudaEstado: item.DeudaEstado || 'Al día',
          montoDeuda: item.MontoDeuda || '$0 (Al día)',
          ultimaLicitacion: item.UltimaLicitacion || 'Junio 2026 - Ganada con 42 cuotas',
          medioPago: item['Medio de Pago'] || item.MedioPago || item.FormaPago || 'A definir'
        }));
        if (clientesMapeados.length > 0) {
          setClientes(clientesMapeados);
          localStorage.setItem('ruiz_clientes_plancrm', JSON.stringify(clientesMapeados));
        }
      } catch (error) { console.error("Error Excel:", error); }
    };
    reader.readAsBinaryString(file);
  };

  const clientesFiltrados = clientes.filter(c => 
    String(c.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    String(c.grupoOrden || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    String(c.vehiculo || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const iniciarEdicion = (c: Cliente) => { setEditandoId(c.id); setEditEstado(c.estado); setEditDeuda(c.montoDeuda); };
  const cancelarEdicion = () => setEditandoId(null);
  const guardarEdicion = (id: number) => {
    const nuevos = clientes.map(c => c.id === id ? { ...c, estado: editEstado, montoDeuda: editDeuda, deudaEstado: String(editDeuda || '').toLowerCase().includes('0') || String(editDeuda || '').toLowerCase().includes('al día') ? 'Al día' : 'Debe' } : c);
    setClientes(nuevos);
    localStorage.setItem('ruiz_clientes_plancrm', JSON.stringify(nuevos));
    setEditandoId(null);
  };

  const getMedioPagoIcon = (medio: string = '') => {
    const m = String(medio).toLowerCase();
    if (m.includes('tarjeta') || m.includes('débito') || m.includes('debito') || m.includes('cbu')) return <CreditCard className="w-5 h-5 text-indigo-600" />;
    return <Banknote className="w-5 h-5 text-indigo-600" />;
  };

  if (modoPublico) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white" id="mi-plan">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="bg-red-100 text-red-600 font-bold text-xs uppercase px-3 py-1 rounded-full">Tu Sueño en Marcha</span>
            <h2 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">Seguimiento de tu Plan</h2>
            <p className="text-gray-600 text-sm mt-1">Ingresá tu número de Grupo y Orden para ver el estado de tu cuenta.</p>
          </div>

          <div className="relative mb-10 max-w-xl mx-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Escribe aquí tu Grupo y Orden..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-12 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 font-bold focus:outline-none focus:border-red-600 transition-all shadow-sm text-lg uppercase font-mono tracking-wider text-center placeholder:normal-case placeholder:font-sans placeholder:text-gray-400"
            />
          </div>

          {busqueda.trim() !== '' && (
            <div className="mb-10 space-y-6 animate-in fade-in duration-300">
              {clientesFiltrados.length > 0 ? (
                clientesFiltrados.map((cliente) => {
                  const estilo = obtenerEstiloEstado(cliente.estado);
                  const tieneDeuda = String(cliente.deudaEstado || '').toLowerCase().includes('debe') || String(cliente.montoDeuda || '').toLowerCase().includes('debe');
                  
                  const fotos360 = obtenerFotogramas360(cliente.vehiculo);
                  const es360 = fotos360.length > 1; 
                  const frameActual = Math.min(indiceFotograma, fotos360.length - 1);

                  return (
                    <div key={cliente.id} className="bg-white border-2 border-gray-200 rounded-3xl p-8 shadow-2xl overflow-hidden">
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl shadow-md">{String(cliente.nombre || '?').charAt(0)}</div>
                          <div>
                            <h3 className="text-xl font-black text-gray-900">{cliente.nombre}</h3>
                            <span className="inline-block mt-1 bg-gray-900 text-white font-mono font-bold text-xs px-3 py-1 rounded-lg">Grupo y Orden: {cliente.grupoOrden}</span>
                          </div>
                        </div>
                        <div><span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${estilo.clases}`}><span>{estilo.emoji}</span>{cliente.estado}</span></div>
                      </div>

                      {/* CONTENEDOR DE IMAGEN / 360 */}
                      <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl p-6 mb-6 shadow-xl">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                          <div className="flex items-center gap-2">
                            {es360 ? <Sparkles className="w-5 h-5 text-red-500 animate-spin" /> : <ImageIcon className="w-5 h-5 text-red-500" />}
                            <h4 className="font-black text-sm uppercase tracking-wider">{es360 ? 'Visualizador 360° Interactivo' : 'Vista del Vehículo'}</h4>
                          </div>
                          {es360 && (
                            <span className="bg-red-600/30 text-red-400 border border-red-500/30 text-[10px] font-bold px-3 py-1 rounded-full uppercase font-mono">
                              ÁNGULO {frameActual + 1} DE {fotos360.length}
                            </span>
                          )}
                        </div>

                        <div 
                          onMouseMove={(e) => handleMouseMove(e, fotos360.length)}
                          className={`relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-white flex items-center justify-center border border-gray-800 select-none shadow-inner group ${es360 ? 'cursor-ew-resize' : ''}`}
                        >
                          <img src={fotos360[es360 ? frameActual : 0]} alt="Vehículo" className="w-full h-full object-contain transition-opacity duration-150 p-4 relative z-10" />
                          
                          {/* GUIAS 360 - Flechitas y texto inferior sutiles */}
                          {es360 && (
                            <>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-black/40 rounded-full p-1 backdrop-blur-sm">
                                <ChevronLeft className="w-6 h-6" />
                              </div>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 bg-black/40 rounded-full p-1 backdrop-blur-sm">
                                <ChevronRight className="w-6 h-6" />
                              </div>
                              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-4 py-1.5 rounded-full text-[10px] font-mono text-white/90 tracking-wide pointer-events-none z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                ↔ Mueve el mouse a los lados para rotar
                              </div>
                            </>
                          )}
                        </div>

                        {es360 && (
                          <div className="flex justify-center gap-2 mt-4">
                            {fotos360.map((_, idx) => (
                              <div key={idx} className={`h-1.5 rounded-full transition-all ${idx === frameActual ? 'w-8 bg-red-600' : 'w-2 bg-gray-700'}`} />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 md:col-span-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Vehículo y Plan</span>
                          <div className="flex items-center gap-2 text-gray-900 font-bold text-base mb-1"><Car className="w-5 h-5 text-red-600" />{cliente.vehiculo}</div>
                          <p className="text-sm text-gray-600 font-medium">{cliente.plan}</p>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">Medio de Pago</span>
                          <div className="flex items-center gap-2 text-indigo-900 font-bold text-base mb-1">
                            {getMedioPagoIcon(cliente.medioPago)}
                            <span className="truncate" title={cliente.medioPago}>{cliente.medioPago && cliente.medioPago !== 'A definir' ? cliente.medioPago : 'Manual / Físico'}</span>
                          </div>
                          <p className="text-xs text-indigo-600 font-medium mt-1">Método registrado</p>
                        </div>
                      </div>

                      <div className={`p-5 rounded-2xl border mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${tieneDeuda ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                        <div className="flex items-start gap-3">
                          {tieneDeuda ? <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />}
                          <div>
                            <h4 className="font-bold text-sm uppercase tracking-wider">{tieneDeuda ? 'Estado: Posee Saldo Pendiente' : 'Estado: Cuenta al Día'}</h4>
                            <p className="text-sm mt-0.5 font-medium">{cliente.montoDeuda}</p>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto flex flex-col gap-2">
                          <button disabled className="w-full sm:w-auto bg-gray-200 text-gray-500 font-bold px-5 py-2.5 rounded-xl text-xs uppercase cursor-not-allowed border border-gray-300 transition-all text-center" title="Pendiente de autorización gerencial">
                            💳 Pagar Cuota (Próximamente)
                          </button>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                        <Award className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-sm text-amber-900 uppercase tracking-wider">Última Licitación del Grupo</h4>
                          <p className="text-sm text-amber-800 mt-0.5 font-medium">{cliente.ultimaLicitacion}</p>
                        </div>
                      </div>

                    </div>
                  );
                })
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center text-yellow-800 font-medium">No se encontró ningún contrato. Verificá los datos ingresados.</div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 bg-white" id="clientes">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Buscar cliente, contrato o vehículo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all" />
          </div>
          <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-3 rounded-xl transition-all flex items-center gap-2 shadow-md cursor-pointer text-sm whitespace-nowrap">
            <FileSpreadsheet className="w-5 h-5" /> Subir Excel Masivo
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="bg-gray-50 rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Cliente</th><th className="py-4 px-6">Contrato</th><th className="py-4 px-6">Vehículo (Traducido)</th><th className="py-4 px-6">Deuda / Saldo</th><th className="py-4 px-6">Estado</th><th className="py-4 px-6 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map((cliente) => {
                    const estilo = obtenerEstiloEstado(cliente.estado);
                    const estaEditando = editandoId === cliente.id;
                    return (
                      <tr key={cliente.id} className="hover:bg-white/80 transition-colors">
                        <td className="py-4 px-6 font-bold text-gray-900">{cliente.nombre}</td>
                        <td className="py-4 px-6"><span className="bg-gray-900 text-white font-mono text-xs px-2.5 py-1 rounded-md">{cliente.grupoOrden}</span></td>
                        <td className="py-4 px-6 font-semibold text-gray-700 max-w-[200px] truncate" title={cliente.vehiculo}>{cliente.vehiculo}</td>
                        <td className="py-4 px-6">
                          {estaEditando ? <input type="text" value={editDeuda} onChange={(e) => setEditDeuda(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm w-32 focus:ring-red-500 focus:border-red-500" /> : <span className="text-sm font-semibold text-gray-700">{cliente.montoDeuda}</span>}
                        </td>
                        <td className="py-4 px-6">
                          {estaEditando ? (
                            <select value={editEstado} onChange={(e) => setEditEstado(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-red-500 focus:border-red-500">
                              <option value="Ahorrista">Ahorrista</option><option value="Adjudicado">Adjudicado</option><option value="Renunciado">Renunciado</option><option value="Cancelado">Cancelado</option>
                            </select>
                          ) : <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${estilo.clases}`}>{estilo.emoji} {cliente.estado}</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {estaEditando ? (
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => guardarEdicion(cliente.id)} className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"><Save className="w-4 h-4" /></button>
                              <button onClick={cancelarEdicion} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <button onClick={() => iniciarEdicion(cliente)} className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : <tr><td colSpan={6} className="py-12 text-center text-gray-400">No se encontraron contratos.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}