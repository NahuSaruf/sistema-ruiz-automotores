import { useState } from 'react';
import { motion } from 'framer-motion';
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
    <nav className="bg-[#0B0F19]/90 backdrop-blur-xl text-white px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10 shadow-lg">

      {/* LOGO */}
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex items-center gap-3 cursor-pointer z-50"
        onClick={onHomeClick}
      >
        <img
          src="/logo Ruiz_png.png"
          alt="Ruiz Automotores"
          className="h-12 sm:h-16 md:h-20 max-h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(255,204,0,0.5)]"
        />
      </motion.div>
      
      {/* MENÚ DESKTOP (PC) */}
      <div className="hidden lg:flex items-center gap-6 xl:gap-8 font-medium text-sm z-50">
        <button onClick={onModelosClick} className="hover:text-yellow-400 transition-colors">
          Modelos
        </button>
        <button onClick={onClienteClick} className="hover:text-yellow-400 transition-colors">
          Mi Plan
        </button>
        <button onClick={onBeneficiosClick} className="hover:text-yellow-400 transition-colors flex items-center gap-1">
          Beneficios <span className="bg-yellow-500 text-gray-900 text-[10px] px-2 py-0.5 rounded-full font-bold">NUEVO</span>
        </button>
        <button onClick={onLicitacionesClick} className="hover:text-yellow-400 transition-colors">
          Licitaciones
        </button>
        <button onClick={onContactoClick} className="hover:text-yellow-400 transition-colors">
          Contacto
        </button>
      </div>

      {/* BOTONES DERECHA */}
      <div className="flex items-center gap-4 z-50">
        <button onClick={onUserClick} className="bg-white text-gray-900 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors text-sm shadow-sm">
          <User className="h-4 w-4 text-yellow-600" />
          <span className="hidden sm:inline">MI CUENTA</span>
        </button>
        
        {/* BOTÓN HAMBURGUESA PARA MÓVIL */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="lg:hidden p-2 text-white hover:text-yellow-400 transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      {/* MENÚ DESPLEGABLE MÓVIL (Celular) */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-gray-900 border-t border-white/10 rounded-b-2xl flex flex-col p-6 gap-6 lg:hidden shadow-2xl animate-fade-in z-40">
          <button onClick={() => { onModelosClick(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-lg hover:text-yellow-400">Modelos</button>
          <button onClick={() => { onClienteClick(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-lg hover:text-yellow-400">Mi Plan</button>
          <button onClick={() => { onBeneficiosClick(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-lg hover:text-yellow-400 flex items-center gap-2">
            Beneficios <span className="bg-yellow-500 text-gray-900 text-[10px] px-2 py-0.5 rounded-full font-bold">NUEVO</span>
          </button>
          <button onClick={() => { onLicitacionesClick(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-lg hover:text-yellow-400">Licitaciones</button>
          <button onClick={() => { onContactoClick(); setIsMobileMenuOpen(false); }} className="text-left font-bold text-lg hover:text-yellow-400">Contacto</button>
        </div>
      )}
    </nav>
  );
}