export interface Vehiculo {
  id: string;
  nombre: string;
  segmento: string;
  imagen: string;
  cuotaDesde: number;
  caracteristicas: string[];
  destacado?: boolean;
}

export const vehiculos: Vehiculo[] = [
  {
    id: 'kwid',
    nombre: 'Renault Kwid',
    segmento: 'City Car',
    imagen:
      '/Kwid.png',
    cuotaDesde: 58000,
    caracteristicas: ['Motor 1.0 SCe 65cv', '5 puertas', 'Aire acondicionado', 'Pantalla táctil'],
    destacado: true,
  },
  {
    id: 'kardian',
    nombre: 'Renault Kardian',
    segmento: 'SUV Compacto',
    imagen:
      '/Kardian.png',
    cuotaDesde: 89000,
    caracteristicas: ['Motor 1.0 Turbo 100cv', 'SUV urbano', 'Pantalla 8"', 'Llantas 17"'],
  },
  {
    id: 'duster',
    nombre: 'Renault Duster',
    segmento: 'SUV 4x4',
    imagen:
      '/Duster.png',
    cuotaDesde: 102000,
    caracteristicas: ['Motor 1.6 SCe 115cv', 'Tracción 4x4', 'Alta distancia al suelo', 'Airbags x4'],
  },
  {
    id: 'boreal',
    nombre: 'Renault Boreal',
    segmento: 'SUV Premium',
    imagen:
      '/Boreal.png',
    cuotaDesde: 135000,
    caracteristicas: ['Motor 1.3 Turbo 160cv', 'SUV grande 7 plazas', 'Pantalla 12"', 'Cámara 360°'],
  },
  {
    id: 'kangoo-stepway',
    nombre: 'Renault Kangoo Stepway',
    segmento: 'Familiar',
    imagen:
      '/Kango_Stepway.png',
    cuotaDesde: 118000,
    caracteristicas: ['Motor 1.6 SCe 110cv', '5 a 7 plazas', 'Gran maletero', 'Suspensión elevada'],
  },
];
