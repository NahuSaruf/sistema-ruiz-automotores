import { Check, ArrowRight } from 'lucide-react';

interface CatalogoProps {
  onInteresClick?: (modelo: string) => void;
}

export default function Catalogo({ onInteresClick }: CatalogoProps) {
  const vehiculos = [
    {
      id: 1,
      nombre: 'Renault Kwid',
      categoria: 'Plan 100%',
      planText: 'Plan 100% en 120 Cuotas',
      badge: 'MÁS ELEGIDO',
      imagen: '/Kwid.png',
      specs: [
        'Pantalla 8" CarPlay / Android Auto',
        '4 Airbags (2 frontales, 2 laterales)',
        'Asistente de arranque en pendiente (HSA)',
        'Baúl de 290 Litros'
      ],
      cuota: '$ 252.628'
    },
    {
      id: 2,
      nombre: 'Renault Kardian',
      categoria: 'Plan 75%',
      planText: 'Plan 75% en 84 Cuotas',
      badge: 'NUEVO',
      imagen: '/Kardian.png',
      specs: [
        'Motor Turbo 120 HP con 200 Nm',
        'Caja automática EDC de 6 velocidades',
        'Sistema OpenR Link 10.1" y cluster 10,2"',
        '6 Airbags y 13 sistemas ADAS'
      ],
      cuota: '$ 384.962'
    },
    {
      id: 3,
      nombre: 'Renault Kardian',
      categoria: 'Plan 75%',
      planText: 'Plan 75% en 120 Cuotas',
      badge: 'FLEXIBLE',
      imagen: '/Kardian.png',
      specs: [
        'Motor Turbo 120 HP con 200 Nm',
        'Cuotas más bajas y accesibles',
        'Sistema OpenR Link 10.1"',
        '6 Airbags y frenado de emergencia'
      ],
      cuota: '$ 322.349'
    },
    {
      id: 4,
      nombre: 'Renault Duster',
      categoria: 'Plan 75%',
      planText: 'Plan 75% en 84 Cuotas',
      badge: null,
      imagen: '/Duster.png',
      specs: [
        'Motor 1.3L TCe Turbo 163cv',
        'Tracción 4×4 con control de descenso',
        'Pantalla 8" Easy Link',
        'Baúl de 475 Litros y ESP'
      ],
      cuota: '$ 476.071'
    },
    {
      id: 5,
      nombre: 'Renault Boreal',
      categoria: 'Plan 75%',
      planText: 'Plan 75% en 84 Cuotas',
      badge: 'DESTACADO',
      imagen: '/Boreal.png',
      specs: [
        'Motor TCe turbo 1.3L 270 Nm',
        'Pantallas duales de 10" con Google',
        'Sonido premium Harman Kardon®',
        '24 sistemas de asistencia (Human First)'
      ],
      cuota: '$ 530.144'
    },
    {
      id: 6,
      nombre: 'Renault Kangoo Stepway',
      categoria: 'Plan 80%',
      planText: 'Plan 80% en 120 Cuotas',
      badge: 'FAMILIAR',
      imagen: '/Kango_Stepway.png',
      specs: [
        'Motor 1.6 SCe / 1.5 dCi',
        'Pantalla táctil 7" Media Evolution',
        'Sensores y cámara de estacionamiento',
        'Gran maletero de 800 dm³'
      ],
      cuota: '$ 391.478'
    },
    {
      id: 7,
      nombre: 'Kangoo Express 2A',
      categoria: 'Plan 75%',
      planText: 'Plan 75% en 120 Cuotas',
      badge: 'UTILITARIO',
      imagen: '/Kango_Stepway.png',
      specs: [
        'Versión 2 Asientos (Carga 3,3 m³ / 750 kg)',
        'Motor 1.6 de 114 CV',
        'Puerta lateral deslizante',
        'Control de estabilidad y tracción'
      ],
      cuota: '$ 325.215'
    },
    {
      id: 8,
      nombre: 'Kangoo Express 5A',
      categoria: 'Plan 75%',
      planText: 'Plan 75% en 120 Cuotas',
      badge: 'MIXTO',
      imagen: '/Kango_Stepway.png',
      specs: [
        'Versión 5 Asientos (Trabajo y familia)',
        'Doble puerta lateral deslizante',
        'Multimedia con pantalla táctil 7"',
        'Anclajes ISOFIX y 8 sistemas de seguridad'
      ],
      cuota: '$ 391.958'
    },
    {
      id: 9,
      nombre: 'Renault Oroch',
      categoria: 'Plan 75%',
      planText: 'Plan 75% en 84 Cuotas',
      badge: null,
      imagen: '/Duster_Oroch.png',
      specs: [
        'Motor Turbo 1.3L de 163 CV y 270 Nm',
        'Suspensión trasera Multilink',
        'Capacidad de carga de 650 kg',
        'Sistema antivuelco (RMI/ROM) y ESP'
      ],
      cuota: '$ 483.116'
    },
    {
      id: 10,
      nombre: 'Renault Master',
      categoria: 'Plan 75%',
      planText: 'Plan 75% en 84 Cuotas',
      badge: 'PROFESIONAL',
      imagen: '/Master.png',
      specs: [
        'Motor 2.3 dCi turbo con cadena',
        'Capacidad de carga de hasta 13 m³',
        'Multimedia táctil de 7" con Android Auto',
        'Sistemas avanzados de asistencia al conductor'
      ],
      cuota: '$ 708.841'
    }
  ];

  return (
    <section className="py-16 bg-gray-50" id="catalogo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Planes de Ahorro Vigentes
          </h2>
          <p className="text-gray-600 mt-2 font-medium">
            Elegí tu próximo Renault 0KM con cuotas 100% en pesos y sin interés.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehiculos.map((auto) => (
            <div 
              key={auto.id}
              className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300 group"
            >
              <div>
                {/* Header de la tarjeta con imagen y badges */}
                <div className="relative h-56 bg-gray-100 overflow-hidden flex items-center justify-center p-4">
                  {auto.badge && (
                    <span className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-md z-10">
                      {auto.badge}
                    </span>
                  )}
                  <span className="absolute top-4 right-4 text-gray-500 text-xs font-bold bg-white/90 px-2.5 py-1 rounded-md backdrop-blur-sm shadow-xs">
                    {auto.categoria}
                  </span>
                  <img 
                    src={auto.imagen} 
                    alt={auto.nombre} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-2xl"
                  />
                </div>

                {/* Información del vehículo */}
                <div className="p-6">
                  <div className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
                    {auto.planText}
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">{auto.nombre}</h3>
                  
                  <ul className="space-y-2.5 mb-6">
                    {auto.specs.map((spec, index) => (
                      <li key={index} className="flex items-center gap-2.5 text-sm text-gray-600 font-medium">
                        <Check className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Pie de tarjeta con precio y botón */}
              <div className="p-6 pt-0 border-t border-gray-50 mt-auto">
                <div className="mb-4 pt-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Cuota estimada desde</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900">{auto.cuota}</span>
                    <span className="text-xs text-gray-500 font-bold">/mes</span>
                  </div>
                </div>

                <button 
                  onClick={() => onInteresClick?.(auto.nombre)}
                  className="w-full bg-red-50 hover:bg-red-600 text-red-600 hover:text-white font-black py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-xs group-hover:shadow-md cursor-pointer"
                >
                  Me interesa
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}