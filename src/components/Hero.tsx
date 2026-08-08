export default function Hero() {
  return (
    <section className="relative bg-white pt-12 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Etiqueta institucional */}
        <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
          <span className="text-red-700 font-bold text-xs uppercase tracking-wider">Plan de Ahorro Rombo</span>
        </div>

        {/* Título principal */}
        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Tu <span className="text-red-600">0KM</span> está más cerca de lo que pensás
        </h1>

        {/* Subtítulo */}
        <p className="text-gray-600 mt-4 text-base sm:text-lg font-medium max-w-2xl mx-auto">
          Suscribite al Plan Rombo y llegá a tu Renault en cuotas fijas, sin sorpresas y con la mejor red de concesionarios del país.
        </p>

      </div>
    </section>
  );
}