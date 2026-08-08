import { BarChart3, TrendingUp, AlertCircle, RefreshCcw, Car, Award, ExternalLink, Users, Key, ShieldCheck, KeyRound, DollarSign, CheckSquare, Database } from 'lucide-react';

export default function Estadisticas() {
  
  // Datos simulados: Ahora el usuario principal es el EMAIL de suscripción
  const usuariosRegistrados = [
    { id: 1, email: 'juanperez88@gmail.com', dni: '34.567.890', nombre: 'Juan Pérez', vehiculo: 'Renault Kardian', ultimoAcceso: 'Hoy, 10:45 hs', estado: 'Activo' },
    { id: 2, email: 'maria.gonzalez@hotmail.com', dni: '28.999.111', nombre: 'María González', vehiculo: 'Renault Duster', ultimoAcceso: 'Ayer, 18:20 hs', estado: 'Activo' },
    { id: 3, email: 'lucas_fer@yahoo.com.ar', dni: '41.222.333', nombre: 'Lucas Fernández', vehiculo: 'Renault Kwid', ultimoAcceso: 'Hace 3 días', estado: 'Bloqueado' },
  ];

  // Datos simulados de los Tickets de Licitación 
  const ticketsLicitacion = [
    { id: 101, email: 'juanperez88@gmail.com', cliente: 'Juan Pérez', grupoOrden: 'P3FC108-012', pin: '4582', monto: '$ 4.500.000', fecha: 'Hoy, 11:30 hs', estado: 'Pendiente' },
    { id: 102, email: 'ana.martinez@hotmail.com', cliente: 'Ana Martínez', grupoOrden: 'A4M2390-105', pin: '1990', monto: '$ 2.800.000', fecha: 'Hoy, 09:15 hs', estado: 'Pendiente' },
  ];

  return (
    <section className="py-6 bg-gray-50" id="estadisticas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-gray-900">Panel de Estadísticas y Control</h2>
          <p className="text-gray-600 mt-1 font-medium">Mercado, métricas, accesos y gestión inteligente de licitaciones.</p>
        </div>

        {/* SECCIÓN 1: MERCADO NACIONAL */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-blue-100 p-4 rounded-2xl flex-shrink-0">
              <TrendingUp className="w-8 h-8 text-blue-700" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">Mercado Nacional (CCA)</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">Visualización de la plataforma oficial del Círculo de Control del Ahorrista.</p>
            </div>
          </div>
          <a href="https://cca.com.ar/estadisticas/" target="_blank" rel="noopener noreferrer" className="bg-gray-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 whitespace-nowrap cursor-pointer">
            Abrir Estadísticas CCA <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        {/* SECCIÓN 2: MÉTRICAS INTERNAS */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-red-100 p-3 rounded-2xl"><BarChart3 className="w-6 h-6 text-red-600" /></div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Métricas Ruiz Automotores</h3>
              <p className="text-sm text-gray-500 font-medium">Proyección táctica basada en tu cartera activa.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100"><RefreshCcw className="w-6 h-6 text-amber-600 mb-4" /><h4 className="text-3xl font-black text-amber-900">--</h4><p className="text-sm font-bold text-amber-700 mt-1">Plan Volver (+12 cuotas)</p></div>
            <div className="bg-red-50 rounded-2xl p-5 border border-red-100"><AlertCircle className="w-6 h-6 text-red-600 mb-4" /><h4 className="text-3xl font-black text-red-900">-- %</h4><p className="text-sm font-bold text-red-700 mt-1">Morosidad</p></div>
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100"><Award className="w-6 h-6 text-emerald-600 mb-4" /><h4 className="text-3xl font-black text-emerald-900">--</h4><p className="text-sm font-bold text-emerald-700 mt-1">Próximos a finalizar</p></div>
            <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100"><Car className="w-6 h-6 text-indigo-600 mb-4" /><h4 className="text-3xl font-black text-indigo-900">--</h4><p className="text-sm font-bold text-indigo-700 mt-1">Vehículos en Calle</p></div>
          </div>
        </div>

        {/* SECCIÓN 3: BANDEJA DE LICITACIONES */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm mb-8 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500"></div>
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-50 p-3 rounded-2xl">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Licitaciones (Autocompletadas)</h3>
                <p className="text-sm text-gray-500 font-medium">El cliente solicitó el monto. El sistema extrajo el PIN y Grupo cruzando su Email con la BD.</p>
              </div>
            </div>
            <div className="bg-amber-100 border border-amber-200 px-4 py-2 rounded-xl text-sm font-bold text-amber-900">
              {ticketsLicitacion.length} Pendientes
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Cliente y Email</th>
                  <th className="py-4 px-6">Extraído de Base de Datos</th>
                  <th className="py-4 px-6">Oferta Solicitada</th>
                  <th className="py-4 px-6 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ticketsLicitacion.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-gray-900">{ticket.cliente}</div>
                      <div className="text-xs text-blue-600 font-medium mt-0.5">{ticket.email}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Database className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          Grupo/Orden: {ticket.grupoOrden}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-xs font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">
                          PIN: {ticket.pin}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-xl font-black text-emerald-600">{ticket.monto}</div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">Ingresado: {ticket.fecha}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl transition-all shadow-md">
                        <CheckSquare className="w-4 h-4" />
                        Marcar Cargada
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECCIÓN 4: CONTROL DE USUARIOS WEB */}
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-900 p-3 rounded-2xl"><Users className="w-6 h-6 text-white" /></div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Gestión de Accesos Web</h3>
                <p className="text-sm text-gray-500 font-medium">Control de clientes registrados (Ingreso mediante Email de Suscripción).</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /><span className="text-sm font-bold text-emerald-800">Cifrado Activo</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Usuario (Email)</th>
                  <th className="py-4 px-6">Cliente / DNI</th>
                  <th className="py-4 px-6">Contraseña</th>
                  <th className="py-4 px-6">Último Acceso</th>
                  <th className="py-4 px-6 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuariosRegistrados.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-blue-600">{user.email}</td>
                    <td className="py-4 px-6 font-semibold text-gray-700">
                      {user.nombre}
                      <span className="block text-xs text-gray-400 font-normal mt-0.5">DNI: {user.dni}</span>
                    </td>
                    <td className="py-4 px-6"><span className="text-2xl tracking-widest text-gray-400 select-none">••••••••</span></td>
                    <td className="py-4 px-6 text-sm text-gray-600 font-medium">{user.ultimoAcceso}</td>
                    <td className="py-4 px-6 text-center">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg transition-colors border border-gray-300">
                        <Key className="w-4 h-4" /> Blanquear Clave
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
}