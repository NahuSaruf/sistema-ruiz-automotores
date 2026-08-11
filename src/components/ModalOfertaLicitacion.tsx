import { useState } from 'react';
import { Info, Lock, X, CheckCircle, ExternalLink } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function ModalOfertaLicitacion({ onClose }: Props) {
  const [cuotas, setCuotas] = useState('');
  const [pasoExito, setPasoExito] = useState(false);

  // VISTA 2: ÉXITO (Misma ventana, cambia el contenido al confirmar)
  if (pasoExito) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[80] animate-fade-in">
        <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
          <button onClick={onClose} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full p-2 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <div className="p-6 pt-8">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
              <span className="text-red-600 text-2xl">📄</span> Gestión de Licitación
            </h2>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 mb-6">
              <h3 className="text-green-700 font-bold flex items-center gap-2 mb-2 text-lg">
                <CheckCircle className="h-5 w-5" /> Oferta Cargada Exitosamente
              </h3>
              <p className="text-green-800 text-sm">Seguí el resultado del sorteo directamente desde los servidores de Renault.</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-medium text-gray-600 mb-4">Cuenta oficial generada para ingresar:</p>
              <div className="space-y-3 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Usuario</span>
                  <span className="font-mono font-bold text-gray-900">Tu DNI</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-3 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Clave</span>
                  <span className="font-mono font-bold text-gray-900">Plan2026</span>
                </div>
              </div>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm">
                Ir a Plan Rombo Oficial <ExternalLink className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VISTA 1: FORMULARIO EXACTO DE LA IMAGEN
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[80] animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-[360px] overflow-hidden shadow-2xl relative p-8 flex flex-col items-center">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">
          <X className="h-6 w-6" />
        </button>

        {/* Ícono de Info Azul */}
        <div className="mt-2 mb-4 border-2 border-blue-500 text-blue-500 rounded-full p-1">
          <Info className="h-6 w-6" />
        </div>

        <h2 className="text-[22px] font-black text-gray-900 mb-2 text-center leading-tight">
          ¿Querés tu auto este mes?
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8 px-2 leading-relaxed">
          Analizá el historial de tu grupo y cargá una oferta competitiva.
        </p>

        {/* MODALIDAD */}
        <div className="w-full mb-6">
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-2">
            MODALIDAD
          </label>
          <div className="flex gap-2">
            <button className="flex-1 bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-md text-sm">
              Licitación Pura
            </button>
            <button className="flex-1 bg-white border border-gray-200 text-gray-400 font-bold py-3 rounded-xl flex items-center justify-center gap-1.5 text-sm cursor-not-allowed">
              <Lock className="h-4 w-4" />
              <span className="leading-tight text-left">Sorteo<br/>(PAA)</span>
            </button>
          </div>
        </div>

        {/* CANTIDAD DE CUOTAS */}
        <div className="w-full mb-8">
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-2">
            CANTIDAD DE CUOTAS A OFERTAR
          </label>
          <input
            type="number"
            value={cuotas}
            onChange={(e) => setCuotas(e.target.value)}
            placeholder="Ej: 35"
            className="w-full text-xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            Licitación libre: ingresá cualquier cantidad mayor a 0. Gana el mejor postor.
          </p>
        </div>

        {/* BOTÓN CONFIRMAR */}
        <button
          disabled={!cuotas || parseInt(cuotas) <= 0}
          onClick={() => setPasoExito(true)}
          className={`w-full font-bold py-4 rounded-xl transition-all duration-300 ${
            cuotas && parseInt(cuotas) > 0 
              ? 'bg-red-600 text-white shadow-lg hover:bg-red-700 transform hover:-translate-y-0.5' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Ingresá cuotas para confirmar
        </button>

      </div>
    </div>
  );
}