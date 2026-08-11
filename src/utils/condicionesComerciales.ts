export const CONDICIONES_STORAGE_KEY = 'condiciones_comerciales_ruiz';

export interface CondicionesComerciales {
  tituloPromo: string;
  descripcionPromo: string;
  planDestacado: string;
  cuotaDestacada: string;
}

export const CONDICIONES_DEFAULT: CondicionesComerciales = {
  tituloPromo: 'Conocé la Nueva Gama Renault en Plan Rombo',
  descripcionPromo: 'Renová tu plan o suscribite a los nuevos Kardian, Boreal y Kangoo Express 5A con cuotas bonificadas.',
  planDestacado: 'Kardian 75%',
  cuotaDestacada: '$184.500',
};

export const cargarCondiciones = (): CondicionesComerciales => {
  try {
    const guardado = localStorage.getItem(CONDICIONES_STORAGE_KEY);
    if (!guardado) return CONDICIONES_DEFAULT;
    return { ...CONDICIONES_DEFAULT, ...JSON.parse(guardado) };
  } catch {
    return CONDICIONES_DEFAULT;
  }
};

export const guardarCondiciones = (condiciones: CondicionesComerciales): void => {
  localStorage.setItem(CONDICIONES_STORAGE_KEY, JSON.stringify(condiciones));
};
