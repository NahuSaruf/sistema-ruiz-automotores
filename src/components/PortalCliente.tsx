import { Car, DollarSign, Trophy, Target, Clock } from 'lucide-react';

export default function PortalCliente() {
  return (
    <section className="py-12 bg-gray-50 min-h-screen border-t-4 border-rombo-500" id="portal-cliente">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Bienvenida y Resumen del Auto */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rombo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-gray-900 mb-1">¡Hola, Martín! 👋</h2>
            <p className="text-gray-500 font-medium mb-6">Acá tenés el resumen en tiempo real de tu Plan.</p>
            <div className="flex items-center gap-4">
              <div className="bg-gray-900 p-4 rounded-2xl text-white shadow-md">
                <Car className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Renault Kangoo Express</h3>
                <p className="text-sm font-bold text-rombo-600 bg-rombo-50 inline-block px-2 py-1 rounded mt-1">
                  Grupo 4589 - Orden 112
                </p>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 bg-gray-50 p-5 rounded-2xl border border-gray-100 relative z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-gray-500">Progreso del plan</span>
              <span className="text-3xl font-black text-gray-900">25%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div className="bg-rombo-500 h-3 rounded-full transition-all duration-1000" style={{ width: '25%' }}></div>
            </div>
            <p className="text-xs font-bold text-gray-500 text-right">
              <strong className="text-gray-900">21</strong> de 84 cuotas pagas
            </p>
          </div>
        </div>

        {/* KPIs Financieros del Cliente */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        
          
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 p-2 rounded-lg"><Clock className="w-5 h-5 text-orange-600" /></div>
              <h4 className="text-xs font-extrabold text-gray-400">PRÓXIMO VENCIMIENTO</h4>
            </div>
            <p className="text-3xl font-black text-gray-900">10 Ago</p>
            <p className="text-xs font-bold text-gray-400 mt-2 flex items-center justify-between">
              <span>Cuota N° 22</span>
              <strong className="text-orange-600 text-sm">$315.200</strong>
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rombo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition"></div>
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="bg-white/10 p-2 rounded-lg"><Target className="w-5 h-5 text-white" /></div>
              <h4 className="text-xs font-extrabold text-gray-400">ESTADO LICITACIÓN</h4>
            </div>
            <p className="text-xl font-black text-white relative z-10">Habilitado</p>
            <button className="mt-3 w-full bg-rombo-500 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-rombo-600 transition relative z-10">
              Simular Oferta
            </button>
          </div>
        </div>

        {/* Panel de Inteligencia de Grupo (Licitaciones) */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black text-gray-900">Termómetro de tu Grupo</h3>
              <p className="text-sm font-medium text-gray-500">Resultados del acto de adjudicación anterior (Julio 2026)</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
              <span className="text-xs font-extrabold text-gray-400 block mb-2">GANADOR POR SORTEO</span>
              <p className="text-2xl font-black text-gray-900">Orden N° 045</p>
            </div>
            
            <div className="bg-rombo-50 rounded-2xl p-6 border border-rombo-100">
              <span className="text-xs font-extrabold text-rombo-600 block mb-2">GANADOR POR LICITACIÓN</span>
              <div className="flex items-baseline gap-3 mb-1">
                <p className="text-2xl font-black text-gray-900">Orden N° 088</p>
                <span className="text-lg font-black text-rombo-600">con 35 cuotas</span>
              </div>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-rombo-200/50">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-bold text-gray-600">Aprox. <strong className="text-gray-900">$9.750.000</strong> ofertados</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
