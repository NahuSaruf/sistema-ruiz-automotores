import { useState } from 'react';
import { MapPin, Phone as PhoneIcon, Mail, Clock, X, Instagram, Facebook, Car, Star, ChevronLeft, Settings, Gauge, Activity, MessageCircle, ShieldCheck, UserCheck, ArrowRight } from 'lucide-react'; 
import Header from './components/Header';
import DashboardCliente from './components/DashboardCliente';
import DashboardAdmin from './components/DashboardAdmin';
import LicitacionesCliente from './components/LicitacionesCliente';
import ModalOfertaLicitacion from './components/ModalOfertaLicitacion';

export default function App() {
  const [view, setView] = useState<'home' | 'user' | 'cliente' | 'admin'>('home');
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [mostrarContacto, setMostrarContacto] = useState(false); 
  const [mostrarLicitaciones, setMostrarLicitaciones] = useState(false);
  const [mostrarModelos, setMostrarModelos] = useState(false);
  const [mostrarBeneficios, setMostrarBeneficios] = useState(false);
  const [mostrarOfertaRapida, setMostrarOfertaRapida] = useState(false);
  
  const [autoSeleccionado, setAutoSeleccionado] = useState<any>(null);
  const [planSeleccionado, setPlanSeleccionado] = useState<any>(null);

  // LÓGICA DE LOGIN ÚNICO
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = loginInput.trim().toUpperCase();

    if (!query) {
      setLoginError('Por favor ingresa tu DNI, Suscripción o Credencial ADMIN');
      return;
    }

    setLoginError('');
    if (query === 'ADMIN') {
      setView('admin');
    } else {
      setView('cliente');
    }
  };

  const catalogoModelos = [
    { 
      nombre: 'KWID', img: '/Kwid.png', 
      planes: [ { tipo: 'Plan 100% en 120 Cuotas', cuota: '$231.000', motor: '1.0 66cv', traccion: '4x2', caja: 'Manual 5v', imgPlan: '/Kwid.png' } ]
    },
    { 
      nombre: 'KARDIAN', img: '/Kardian.png', 
      planes: [
        { tipo: 'Plan 75% en 84 Cuotas', cuota: '$245.500', motor: '1.6 115cv o 1.0T 120cv', traccion: '4x2', caja: 'Manual 5v / Automática EDC', imgPlan: '/Kardian.png' },
        { tipo: 'Plan 75% en 120 Cuotas', cuota: '$210.000', motor: '1.6 115cv o 1.0T 120cv', traccion: '4x2', caja: 'Manual 5v / Automática EDC', imgPlan: '/Kardian.png' }
      ]
    },
    { 
      nombre: 'DUSTER', img: '/Duster.png', 
      planes: [ { tipo: 'Plan 75% en 84 Cuotas', cuota: '$279.000', motor: '1.6 115cv o 1.3T 163cv', traccion: '4x2 y 4x4', caja: 'Manual 6v / Automática CVT', imgPlan: '/Duster.png' } ]
    },
    { 
      nombre: 'BOREAL', img: '/Boreal.png', 
      planes: [ { tipo: 'Plan 75% en 84 Cuotas', cuota: '$457.000', motor: '1.3 TCe 156cv', traccion: '4x2', caja: 'Automática EDC 6v', imgPlan: '/Boreal.png' } ]
    },
    { 
      nombre: 'KANGOO', img: '/Kangoo2a.png',
      planes: [ 
        { tipo: 'STEPWAY (Plan 80% en 120 Cuotas)', cuota: '$258.000', motor: '1.6 SCe 114cv', traccion: '4x2', caja: 'Manual 5v', imgPlan: '/Kango_Stepway.png' },
        { tipo: 'EXPRESS 2A (Plan 75% en 120 Cuotas)', cuota: '$240.000', motor: '1.6 SCe 114cv', traccion: '4x2', caja: 'Manual 5v', imgPlan: '/Kangoo2a.png' },
        { tipo: 'EXPRESS 5A (Plan 75% en 120 Cuotas)', cuota: '$275.000', motor: '1.6 SCe 114cv', traccion: '4x2', caja: 'Manual 5v', imgPlan: '/Kangoo5a.png' }
      ]
    },
    { 
      nombre: 'OROCH', img: '/Duster_Oroch.png', 
      planes: [ { tipo: 'Plan 75% en 84 Cuotas', cuota: '$285.000', motor: '1.6 114cv o 1.3T 163cv', traccion: '4x2 y 4x4', caja: 'Manual 6v / Automática CVT', imgPlan: '/Duster_Oroch.png' } ]
    },
    { 
      nombre: 'MASTER', img: '/Master.png', 
      planes: [ { tipo: 'Plan 75% en 84 Cuotas', cuota: '$587.000', motor: '2.3 dCi 130cv', traccion: '4x2', caja: 'Manual 6v', imgPlan: '/Master.png' } ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      <Header 
        onUserClick={() => setView('user')} 
        onHomeClick={() => setView('home')} 
        onClienteClick={() => setView('cliente')}
        onLicitacionesClick={() => setMostrarLicitaciones(true)} 
        onContactoClick={() => setMostrarContacto(true)} 
        onModelosClick={() => { setMostrarModelos(true); setAutoSeleccionado(null); setPlanSeleccionado(null); }}
        onBeneficiosClick={() => setMostrarBeneficios(true)}
      />
      
      <main className="flex-grow relative">
        {/* PANTALLA HOME - LOGIN ÚNICO */}
        {view === 'home' && (
          <div className="flex items-center justify-center min-h-[75vh] flex-col gap-8 p-4">
            <div className="text-center max-w-xl">
              <span className="bg-red-100 text-red-700 text-xs font-black px-3.5 py-1.5 rounded-full border border-red-200 tracking-wider uppercase inline-block mb-3">
                Ruiz Automotores - Plan Rombo
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 tracking-tight">Portal de Clientes y Gestión</h2>
              <p className="text-gray-500 text-base sm:text-lg font-medium">Ingresá con tu DNI, N° de Suscripción o credencial administrativa.</p>
            </div>
            
            {/* TARJETA DE LOGIN */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 w-full max-w-md">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Acceso Unificado</label>
                  <input 
                    type="text" 
                    value={loginInput}
                    onChange={(e) => { setLoginInput(e.target.value); setLoginError(''); }}
                    placeholder="DNI, N° Suscripción o ADMIN" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-base font-bold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all text-gray-900"
                  />
                  {loginError && <p className="text-red-600 text-xs font-bold mt-2 ml-1">{loginError}</p>}
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02]"
                >
                  Ingresar al Sistema <ArrowRight className="h-5 w-5" />
                </button>
              </form>

              {/* Demos de acceso rápido */}
              <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase text-center mb-1">Acceso Rápido Demostración</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setView('cliente')}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="h-4 w-4 text-red-600" /> Demo Cliente
                  </button>
                  <button 
                    onClick={() => setView('admin')}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="h-4 w-4 text-yellow-500" /> Demo Admin
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {view === 'user' && (
          <div className="flex items-center justify-center h-[60vh]">
            <button 
               onClick={() => setView('cliente')}
               className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-xl hover:bg-red-700 shadow-lg transition-transform hover:scale-105"
            >
              Entrar a Mi Panel de Cliente
            </button>
          </div>
        )}
        
        {view === 'cliente' && (
          <DashboardCliente 
            onAbrirCatalogo={() => { setMostrarModelos(true); setAutoSeleccionado(null); setPlanSeleccionado(null); }} 
            onIrALicitaciones={() => setMostrarOfertaRapida(true)} 
          />
        )}

        {view === 'admin' && (
          <DashboardAdmin />
        )}
      </main>

      <footer className="bg-black text-white p-6 text-center text-xs font-medium border-t border-gray-900">
         © 2026 Ruiz Automotores - Todos los derechos reservados.
      </footer>

      {mostrarLicitaciones && <LicitacionesCliente onClose={() => setMostrarLicitaciones(false)} />}
      {mostrarOfertaRapida && <ModalOfertaLicitacion onClose={() => setMostrarOfertaRapida(false)} />}

      {mostrarModelos && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-gray-900 p-6 flex justify-between items-center text-white z-10 shadow-sm">
              <h2 className="text-xl font-black flex items-center gap-2">
                <Car className="h-5 w-5"/> 
                {autoSeleccionado && planSeleccionado 
                  ? `Detalle: ${autoSeleccionado.nombre} - ${planSeleccionado.tipo}` 
                  : autoSeleccionado ? `Financiación: ${autoSeleccionado.nombre}`
                  : 'Catálogo de Modelos'}
              </h2>
              <button onClick={() => setMostrarModelos(false)} className="text-gray-400 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
            </div>
            
            {!autoSeleccionado ? (
              <div className="p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {catalogoModelos.map((auto) => (
                  <div 
                    key={auto.nombre} 
                    onClick={() => {
                      setAutoSeleccionado(auto);
                      if (auto.planes.length === 1) setPlanSeleccionado(auto.planes[0]);
                    }}
                    className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center hover:border-red-500 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="h-24 sm:h-32 bg-white rounded-xl mb-4 flex items-center justify-center p-2 border border-gray-100 group-hover:scale-105 transition-transform">
                      <img 
                        src={auto.img} 
                        alt={auto.nombre} 
                        className="max-h-full max-w-full object-contain drop-shadow-md"
                      />
                    </div>
                    <h3 className="font-black text-gray-900 text-sm sm:text-base">{auto.nombre}</h3>
                  </div>
                ))}
              </div>
            ) : !planSeleccionado ? (
              <div className="p-8 sm:p-12 animate-fade-in text-center flex flex-col items-center justify-center min-h-[400px]">
                <button onClick={() => setAutoSeleccionado(null)} className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-bold mb-8 transition-colors">
                  <ChevronLeft className="h-5 w-5" /> Volver a modelos
                </button>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-8">¿Qué tipo de financiación buscás?</h3>
                <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
                  {autoSeleccionado.planes.map((plan: any) => (
                    <button 
                      key={plan.tipo}
                      onClick={() => setPlanSeleccionado(plan)} 
                      className="flex-1 min-w-[250px] bg-white hover:bg-red-50 border-2 border-gray-200 hover:border-red-500 px-6 py-6 rounded-2xl transition-all shadow-sm group flex flex-col items-center justify-center"
                    >
                      <span className="block text-xl font-black text-gray-900 group-hover:text-red-700">{plan.tipo}</span>
                      <span className="block text-sm text-gray-500 font-medium mt-2">Ver información técnica</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-8 animate-fade-in">
                <button 
                  onClick={() => {
                    if (autoSeleccionado.planes.length > 1) {
                      setPlanSeleccionado(null); 
                    } else {
                      setAutoSeleccionado(null); 
                    }
                  }} 
                  className="flex items-center gap-2 text-gray-500 hover:text-red-600 font-bold mb-6 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" /> Volver atrás
                </button>
                
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1 w-full bg-gray-50 rounded-3xl p-6 border border-gray-100 flex justify-center items-center min-h-[250px]">
                    <img 
                      src={planSeleccionado.imgPlan} 
                      alt={planSeleccionado.tipo} 
                      className="max-w-full max-h-64 object-contain drop-shadow-xl" 
                    />
                  </div>
                  
                  <div className="flex-1 w-full space-y-5">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900">{autoSeleccionado.nombre}</h3>
                      <p className="text-red-600 font-bold text-lg">{planSeleccionado.tipo}</p>
                    </div>
                    
                    <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cuota Normal Desde</p>
                      <p className="text-4xl font-black text-gray-900">{planSeleccionado.cuota}</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-1.5 leading-tight">
                        * El valor de la cuota normal base es estimativo y se actualiza según la lista de precios vigente del vehículo 0km.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <Settings className="h-4 w-4 text-gray-400 mb-1" />
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Motor</p>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{planSeleccionado.motor}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <Gauge className="h-4 w-4 text-gray-400 mb-1" />
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Caja</p>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{planSeleccionado.caja}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm col-span-2 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Activity className="h-3 w-3"/> Tracción</p>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{planSeleccionado.traccion}</p>
                        </div>
                      </div>
                    </div>

                    <a 
                      href={`https://wa.me/5493815723178?text=Hola!%20Me%20interesa%20consultar%20por%20un%20cambio%20de%20modelo%20a%20${autoSeleccionado.nombre}%20en%20el%20${planSeleccionado.tipo.replace(' ', '%20')}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-md mt-4"
                    >
                      <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mostrarBeneficios && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-black flex items-center gap-2"><Star className="h-5 w-5"/> Beneficios Exclusivos</h2>
              <button onClick={() => setMostrarBeneficios(false)} className="text-red-200 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-8 space-y-4">
              <div className="bg-red-50 text-red-900 p-4 rounded-2xl border border-red-100">
                <h3 className="font-bold mb-1">🚗 Adjudicación Asegurada (PAA)</h3>
                <p className="text-sm">Llevate tu vehículo en la cuota 9 con integración mínima garantizada.</p>
              </div>
              <div className="bg-gray-50 text-gray-900 p-4 rounded-2xl border border-gray-200">
                <h3 className="font-bold mb-1">🎁 Puntos Ruiz</h3>
                <p className="text-sm">Sumá puntos por mantener tu cuota al día y canjealos por accesorios.</p>
              </div>
              <div className="bg-gray-50 text-gray-900 p-4 rounded-2xl border border-gray-200">
                <h3 className="font-bold mb-1">💳 Débito Automático</h3>
                <p className="text-sm">Bonificaciones exclusivas adhiriendo tu tarjeta de crédito o CBU.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarContacto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70] animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="bg-gray-900 p-6 flex justify-between items-center text-white">
              <h2 className="text-xl font-black flex items-center gap-2">✉️ Contacto Ruiz Automotores</h2>
              <button onClick={() => setMostrarContacto(false)} className="text-gray-400 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex gap-4 items-start">
                <div className="bg-red-50 p-3 rounded-xl flex-shrink-0"><MapPin className="h-6 w-6 text-red-600" /></div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Sucursal y Taller Oficial</h3>
                  <p className="text-sm text-gray-600">Av. Perón, San Miguel de Tucumán.<br/>Tucumán, Argentina.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-red-50 p-3 rounded-xl flex-shrink-0"><PhoneIcon className="h-6 w-6 text-red-600" /></div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Atención Telefónica</h3>
                  <p className="text-sm text-gray-600">Atención al cliente: <span className="font-semibold text-gray-900">0810-888-7849</span></p>
                  <p className="text-sm text-gray-600">WhatsApp: <span className="font-semibold text-gray-900">+54 9 381 572-3178</span></p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="bg-red-50 p-3 rounded-xl flex-shrink-0"><Instagram className="h-6 w-6 text-red-600" /></div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Nuestras Redes</h3>
                  <div className="flex flex-col gap-2 mt-2">
                    <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 font-medium"><Instagram className="h-4 w-4" /> @ruizautomotores</a>
                    <a href="#" className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 font-medium"><Facebook className="h-4 w-4" /> /RuizAutomotoresSA</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* BARRA DE NAVEGACIÓN FLOTANTE */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-full px-2 py-2 shadow-2xl">
        <button
          onClick={() => setView('home')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
            view === 'home'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          🏠 Inicio
        </button>
        <button
          onClick={() => setView('cliente')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
            view === 'cliente'
              ? 'bg-white text-gray-900 shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          👤 Cliente
        </button>
        <button
          onClick={() => setView('admin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap ${
            view === 'admin'
              ? 'bg-white text-gray-900 shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          🛡️ Admin
        </button>
      </div>
    </div>
  );
}