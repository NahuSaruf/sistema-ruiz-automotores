import { useState } from 'react';
import { User, Lock, Mail, X, LogIn } from 'lucide-react';

interface MiCuentaModalProps {
  open: boolean;
  onClose: () => void;
}

export default function MiCuentaModal({ open, onClose }: MiCuentaModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-8 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 bg-rombo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 rotate-45">
            <User className="w-7 h-7 text-white -rotate-45" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'login' ? 'Ingresá a tu cuenta' : 'Creá tu cuenta'}
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Portal de clientes Plan Rombo
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                mode === m
                  ? 'text-rombo-600 border-b-2 border-rombo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          className="p-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nombre completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tu nombre"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rombo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rombo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rombo-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {mode === 'login' && (
            <div className="flex justify-end">
              <a href="#" className="text-xs text-rombo-600 hover:underline font-medium">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-rombo-600 hover:bg-rombo-700 rounded-xl shadow-lg shadow-rombo-600/25 transition-all"
          >
            <LogIn className="w-4 h-4" />
            {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>

          <p className="text-center text-xs text-gray-400">
            Demo visual — los datos no se guardan.
          </p>
        </form>
      </div>
    </div>
  );
}
