import { useState } from 'react';
import { Search, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

type Estado = 'idle' | 'loading' | 'success';

interface Resultado {
  titular: string;
  grupo: string;
  orden: string;
  modelo: string;
  cuotaActual: number;
  cuotasPagas: number;
  cuotasTotales: number;
  estadoAdjudicacion: string;
  probabilidad: number;
}

export default function ConsultarPlan() {
  const [dni, setDni] = useState('');
  const [grupo, setGrupo] = useState('');
  const [orden, setOrden] = useState('');
  const [estado, setEstado] = useState<Estado>('idle');
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni || !grupo || !orden) return;
    setEstado('loading');
    setResultado(null);
    // Mock: simula una llamada al backend
    setTimeout(() => {
      setResultado({
        titular: 'Juan Pérez',
        grupo: grupo,
        orden: orden,
        modelo: 'Renault Stepway',
        cuotaActual: 89000,
        cuotasPagas: 36,
        cuotasTotales: 84,
        estadoAdjudicacion: 'En proceso de licitación',
        probabilidad: 72,
      });
      setEstado('success');
    }, 1400);
  };

  const progreso =
    resultado ? Math.round((resultado.cuotasPagas / resultado.cuotasTotales) * 100) : 0;

  return (
    <section id="consultar" className="py-20 sm:py-28 bg-gray-900 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-rombo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-rombo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-full mb-4">
            <FileText className="w-3.5 h-3.5 text-rombo-400" />
            <span className="text-xs font-semibold text-white/90 uppercase tracking-wide">
              Estado de adjudicación
            </span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Consultá el estado de tu plan
          </h2>
          <p className="mt-3 text-gray-400 max-w-xl mx-auto">
            Ingresá tus datos y mirá dónde estás parado en el camino a tu 0KM.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 items-start">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="md:col-span-3 bg-white rounded-2xl p-6 sm:p-8 shadow-2xl"
          >
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="dni" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  DNI
                </label>
                <input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Ej: 30123456"
                  className="w-full px-4 py-3 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rombo-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label htmlFor="grupo" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Grupo
                </label>
                <input
                  id="grupo"
                  type="text"
                  inputMode="numeric"
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Ej: 142"
                  className="w-full px-4 py-3 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rombo-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label htmlFor="orden" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Orden
                </label>
                <input
                  id="orden"
                  type="text"
                  inputMode="numeric"
                  value={orden}
                  onChange={(e) => setOrden(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="Ej: 045"
                  className="w-full px-4 py-3 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rombo-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={estado === 'loading' || !dni || !grupo || !orden}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-rombo-600 hover:bg-rombo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-rombo-600/25 transition-all"
            >
              {estado === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Consultando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Consultar mi plan
                </>
              )}
            </button>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
              <AlertCircle className="w-3.5 h-3.5" />
              Demo visual: los datos mostrados son de ejemplo.
            </p>
          </form>

          {/* Result */}
          <div className="md:col-span-2">
            {estado === 'idle' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center min-h-[280px]">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                  <Search className="w-7 h-7 text-white/60" />
                </div>
                <p className="text-white/70 text-sm">
                  Completá el formulario para ver el detalle de tu plan.
                </p>
              </div>
            )}

            {estado === 'loading' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center h-full flex flex-col items-center justify-center min-h-[280px]">
                <Loader2 className="w-10 h-10 text-rombo-400 animate-spin mb-4" />
                <p className="text-white/70 text-sm">Buscando tu información...</p>
              </div>
            )}

            {estado === 'success' && resultado && (
              <div className="bg-white rounded-2xl p-6 shadow-2xl animate-slide-up">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-bold text-gray-900">Plan encontrado</p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Titular</span>
                    <span className="font-semibold text-gray-900">{resultado.titular}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Modelo</span>
                    <span className="font-semibold text-gray-900">{resultado.modelo}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">Grupo / Orden</span>
                    <span className="font-semibold text-gray-900">
                      {resultado.grupo} / {resultado.orden}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cuota actual</span>
                    <span className="font-semibold text-gray-900">
                      ${resultado.cuotaActual.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">
                      Progreso: {resultado.cuotasPagas}/{resultado.cuotasTotales} cuotas
                    </span>
                    <span className="font-bold text-rombo-600">{progreso}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rombo-500 to-rombo-600 rounded-full transition-all duration-700"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-rombo-50 rounded-lg">
                  <p className="text-xs text-rombo-700 font-semibold mb-1">
                    {resultado.estadoAdjudicacion}
                  </p>
                  <p className="text-xs text-gray-600">
                    Probabilidad estimada de adjudicación:{' '}
                    <span className="font-bold text-rombo-700">
                      {resultado.probabilidad}%
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
