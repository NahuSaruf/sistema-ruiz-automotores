import { useState } from 'react';
import { Calendar, Trophy, History, AlertCircle, X } from 'lucide-react';
import { cargarMejoresOfertas, MejorOferta } from '../utils/excelParser';

interface Props {
  onClose: () => void;
  grupoOrden?: string;
}

export default function LicitacionesCliente({ onClose, grupoOrden }: Props) {
  const grupoActivo = grupoOrden || 'P2GH169-T';
  const prefijoGrupo = grupoActivo.slice(0, 4).toUpperCase();

  // Histórico real cargado por el Admin (reporte "5 Mejores Ofertas de Licitación"),
  // filtrado a los actos correspondientes al grupo del cliente.
  const historialGrupo: MejorOferta[] = cargarMejoresOfertas()
    .filter((o) => o.grupo.toUpperCase() === prefijoGrupo)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  const [actoSeleccionado, setActoSeleccionado] = useState(0);
  const datosActo = historialGrupo[actoSeleccionado];
  const primerPuesto = datosActo?.posiciones?.[0];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in">
      <div className="bg-gray-50 rounded-3xl w-full max-w-5xl max-h-[95vh] overflow-y-auto shadow-2xl relative flex flex-col">

        {/* CABECERA FIJA */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-20 shadow-sm">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Licitaciones y Sorteos <Trophy className="h-6 w-6 text-yellow-500" />
            </h2>
            <p className="text-gray-500 font-medium mt-1 text-sm">
              Grupo y Orden: <span className="font-bold text-gray-900">{grupoActivo}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 rounded-full p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* CONTENIDO REORGANIZADO */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* COLUMNA IZQUIERDA: HISTORIAL (Más ancha: ocupa 3 de 5 columnas) */}
            <div className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <History className="h-5 w-5 text-red-600" /> Historial del Grupo
                </h2>
              </div>

              {historialGrupo.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                  <History className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold">Todavía no hay licitaciones registradas para tu grupo.</p>
                  <p className="text-gray-400 text-sm mt-1">En cuanto la agencia cargue los resultados del acto, vas a verlos acá.</p>
                </div>
              ) : (
                <>
                  {/* SELECTOR DE ACTO */}
                  <div className="mb-8">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Fecha del Acto</label>
                    <select
                      value={actoSeleccionado}
                      onChange={(e) => setActoSeleccionado(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
                    >
                      {historialGrupo.map((oferta, idx) => (
                        <option key={`${oferta.fecha}-${idx}`} value={idx}>{oferta.fecha || `Acto #${idx + 1}`}</option>
                      ))}
                    </select>
                  </div>

                  {/* TARJETA NEGRA DE RESULTADOS */}
                  <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden mt-auto shadow-inner">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Trophy className="h-32 w-32 -mr-4 -mt-4" />
                    </div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-6">
                      Resultados del {datosActo?.fecha || 'acto'}
                    </p>
                    <div className="grid grid-cols-2 gap-6 relative z-10 mb-6">
                      <div>
                        <span className="block text-xs text-gray-400 mb-1">Modelo</span>
                        <span className="text-xl sm:text-2xl font-black text-white">{datosActo?.modelo || '-'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-400 mb-1">% Financiación</span>
                        <span className="text-xl sm:text-2xl font-black text-white">{datosActo?.porcentajeFinanciacion || '-'}</span>
                      </div>
                      <div className="col-span-2 pt-5 border-t border-gray-800">
                        <span className="block text-xs text-gray-400 mb-1">Mejor Oferta (1er Puesto)</span>
                        <span className="text-3xl sm:text-4xl font-black text-yellow-400">{primerPuesto?.cuotaOfertada || '-'}</span>
                        {primerPuesto?.modalidad && <span className="block text-xs text-gray-400 mt-1">{primerPuesto.modalidad}</span>}
                      </div>
                    </div>

                    {/* 5 MEJORES POSICIONES */}
                    <div className="relative z-10 grid grid-cols-5 gap-2 pt-4 border-t border-gray-800">
                      {datosActo?.posiciones.map((pos) => (
                        <div key={pos.puesto} className="text-center bg-gray-800/60 rounded-xl py-3 px-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{pos.puesto}° Puesto</p>
                          <p className="text-sm font-black text-white">{pos.cuotaOfertada || '-'}</p>
                          {pos.modalidad && <p className="text-[9px] text-gray-500 mt-0.5">{pos.modalidad}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* COLUMNA DERECHA: INFO Y AVISOS (Más angosta: ocupa 2 de 5 columnas) */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              
              {/* TARJETA PRÓXIMO ACTO */}
              <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-6 sm:p-8 shadow-md text-white text-center flex-1 flex flex-col justify-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-red-200" />
                <h3 className="text-xl font-bold mb-1">Próximo Acto</h3>
                <p className="text-4xl font-black mb-6">10 de Agosto</p>
                <div className="bg-black/20 rounded-2xl p-4 text-sm font-medium">
                  Tenés tiempo de cargar tu oferta en tu panel hasta el 8 de Agosto a las 18:00hs.
                </div>
              </div>

              {/* TARJETA AVISO POLÍTICA COMERCIAL */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="h-7 w-7 text-yellow-600 flex-shrink-0" />
                  <h3 className="font-bold text-yellow-900 text-lg leading-tight">Atención:<br/>Integración Mínima</h3>
                </div>
                <p className="text-sm text-yellow-800 leading-relaxed">
                  En caso de salir favorecido por <b>SORTEO (PAA)</b>, la política comercial exige una integración mínima de <b>34 cuotas</b> para poder retirar tu Kardian (Plan 75% a 84 meses).
                </p>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}