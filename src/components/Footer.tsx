import { MapPin, Phone, Mail, Instagram, Facebook, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black pt-16 pb-8 border-t border-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Columna 1: Marca y Logo de la Agencia */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo_png.png" 
                alt="Ruiz Automotores SA" 
                className="h-20 w-auto object-contain -ml-2" 
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-2xl font-black text-white leading-none tracking-tight">RUIZ AUTOMOTORES</span>';
                }}
              />
            </div>
            
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider mt-4">Portal de Suscriptores</p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Concesionaria oficial Renault. Más de 40 años llevando 0KM a cada rincón del país con transparencia y confianza.
            </p>
          </div>

          {/* Columna 2: Contacto */}
          <div>
            <h4 className="text-sm font-bold text-gray-100 uppercase tracking-wider mb-6">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <Phone className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-sm">+54 9 3815 72-3178</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <Mail className="h-5 w-5 text-red-500 flex-shrink-0" />
                <span className="text-sm">plan@ruizautomotores.com.ar</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400 hover:text-white transition-colors cursor-pointer">
                <MapPin className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">
                  <strong>Casa Central:</strong> Av. Juan Domingo Perón 1100<br/>
                  <strong>Sucursal:</strong> Av. 24 de Septiembre 741
                </span>
              </li>
            </ul>
          </div>

          {/* Columna 3: Horarios */}
          <div>
            <h4 className="text-sm font-bold text-gray-100 uppercase tracking-wider mb-6">Horarios de Atención</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-gray-400">
                <Clock className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-100 text-sm">Lun a Vie: 09 a 13 y 16 a 20</p>
                  <p className="text-sm mt-1">Sábados: 09 a 13</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 ml-8">Domingos y feriados: Cerrado</p>
            </div>
          </div>

          {/* Columna 4: Redes Sociales */}
          <div>
            <h4 className="text-sm font-bold text-gray-100 uppercase tracking-wider mb-6">Seguinos</h4>
            <div className="flex gap-3 mb-6">
              <a 
                href="https://www.instagram.com/ruizautomotorestucuman?igsh=Nm9xMHByNzVwa2Zh" 
                target="_blank" 
                rel="noreferrer"
                className="bg-gray-900 p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-red-600 transition-all transform hover:-translate-y-1"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://www.facebook.com/share/1NhG8yQ9Ej/" 
                target="_blank" 
                rel="noreferrer"
                className="bg-gray-900 p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-red-600 transition-all transform hover:-translate-y-1"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-gray-400 hover:text-white transition-colors">Términos y condiciones</a>
              <a href="#" className="block text-sm text-gray-400 hover:text-white transition-colors">Política de privacidad</a>
            </div>
          </div>
          
        </div>

        {/* Línea divisoria y Copyright */}
        <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © 2026 Ruiz Automotores SA. Todos los derechos reservados.
          </p>
          <p className="text-gray-500 text-sm font-medium">
            Plan de Ahorro Rombo — Concesionaria Oficial Renault
          </p>
        </div>
      </div>
    </footer>
  );
}