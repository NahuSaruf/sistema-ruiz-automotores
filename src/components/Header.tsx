import { useState } from 'react';
import { User, Menu, X } from 'lucide-react'; 

interface Props {
  onUserClick: () => void;
  onHomeClick: () => void;
  onClienteClick: () => void;
  onLicitacionesClick: () => void;
  onContactoClick: () => void; 
  onModelosClick: () => void;
  onBeneficiosClick: () => void;
}

export default function Header({ onUserClick, onHomeClick, onClienteClick, onLicitacionesClick, onContactoClick, onModelosClick, onBeneficiosClick }: Props) {
  // Estado para controlar el menú en celulares
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-black text-white px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-50">
      
      {/* LOGO */}
      <div className="flex items-center gap-3 cursor-pointer z-50" onClick={onHomeClick}>
        <img 
          src="/logo_png.png" 
          alt="Ruiz Automotores" 
          className="h-[60px] sm:h-[100px] w-auto object-contain mt-1"
        />
      </div>
      
      {/* MENÚ DESKTOP (PC) */}
      <div className="hidden lg:flex items-center gap-6 xl:gap-8 font-medium text-sm z-50">
        <button onClick={onModelosClick} className="hover:text-red-500 transition-colors">
          Modelos
        </button>
        <button onClick={onClienteClick} className="hover:text-red-500 transition-colors">
          Mi Plan
        </button>
        <button onClick={onBeneficiosClick} className="hover:text-red-500 transition-colors flex items-center gap-1">
          Beneficios <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NUEVO</span>
        </button>
        <button onClick={onLicitacionesClick} className="hover:text-red-500 transition-colors">
          Licitaciones
        </button>
        <button onClick={onContactoClick} className="hover:text-red-500 transition-colors">
          Contacto
        </button>
      </div>

      {/* BOTONES DERECHA */}
      <div className="flex items-center gap-4 z-50">
        <button onClick={onUserClick} className="bg-white text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors text-sm">
          <User className="h-4 w-4 text-red-600" />
          <span className="hidden sm:inline">MI CUENTA</span>
        </button>
        
        {/* BOTÓN HAMBURGUESA PARA MÓVIL */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="lg:hidden p-2 text-white hover:text-red-500 transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {/* MENÚ DESPLEGABLE MÓVIL (Celular) */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-black border-t border-gray-800 flex flex-col p-6 gap-6 lg:hidden shadow-2xl animate-fade-in z-40">
          <button onClick={() => { onModelosClick(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-lg hover:text-red-500">Modelos</button>
          <button onClick={() => { onClienteClick(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-lg hover:text-red-500">Mi Plan</button>
          <button onClick={() => { onBeneficiosClick(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-lg hover:text-red-500 flex items-center gap-2">
            Beneficios <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NUEVO</span>
          </button>
          <button onClick={() => { onLicitacionesClick(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-lg hover:text-red-500">Licitaciones</button>
          <button onClick={() => { onContactoClick(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-lg hover:text-red-500">Contacto</button>
        </div>
      )}
    </nav>
  );
}