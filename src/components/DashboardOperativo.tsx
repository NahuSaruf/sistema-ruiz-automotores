import { Settings, Car, CreditCard, TrendingDown, Users } from 'lucide-react';

export default function DashboardOperativo() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Control Operativo y Comercial</h2>
          <p className="text-gray-500 mt-1">Gestión de condiciones de cambio de modelo y morosidad de la agencia.</p>
        </div>
        <div className="bg-red-50 p-3 rounded-xl">
          <Settings className="h-8 w-8 text-red-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MÓDULO 1: Condiciones Comerciales */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gray-900 p-4 flex items-center gap-3">
            <Car className="h-6 w-6 text-white" />
            <h3 className="text-lg font-bold text-white">Condiciones Comerciales (Mes Actual)</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Cargá aquí las opciones de Upgrade/Downgrade que se reflejarán automáticamente en el panel de todos los clientes.</p>
            
            <div className="space-y-3 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Kardian Evolución</span>
                <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded">Activo para cambio</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Kardian Première Edition</span>
                <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Requiere Integración</span>
              </div>
            </div>

            <button className="w-full bg-red-600 text-white py-2.5 rounded-lg font-bold hover:bg-red-700 transition-colors">
              + Cargar nueva condición o modelo
            </button>
          </div>
        </div>

        {/* MÓDULO 2: Morosidad y Cobranzas */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-gray-900 p-4 flex items-center gap-3">
            <TrendingDown className="h-6 w-6 text-white" />
            <h3 className="text-lg font-bold text-white">Estrategia de Cobranzas y Puntos</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">Monitor de morosidad y asignación de recompensas por pago en término.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-bold text-red-800">Cuotas Vencidas</span>
                </div>
                <span className="text-2xl font-black text-red-600">42</span>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-bold text-yellow-800">Puntos Emitidos</span>
                </div>
                <span className="text-2xl font-black text-yellow-600">12.5K</span>
              </div>
            </div>

            <button className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold hover:bg-gray-200 border border-gray-300 transition-colors">
              Configurar sistema de Puntos Ruiz
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}