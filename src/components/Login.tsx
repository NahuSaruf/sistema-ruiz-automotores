import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [esRegistro, setEsRegistro] = useState(false);
  const [mostrarClave, setMostrarClave] = useState(false);
  
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(''); 

    if (modoRecuperar) {
      if (!email) {
        setErrorValidacion('Por favor ingresá tu correo electrónico.');
        return;
      }
      setEmailEnviado(true);
      return;
    }

    if (esRegistro) {
      const clientesYaRegistrados = ['36224805', '11222333']; 

      if (clientesYaRegistrados.includes(dni)) {
        setErrorValidacion('Este DNI ya se encuentra registrado. Por favor, iniciá sesión.');
        return; 
      }
    }

    onLogin();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-red-700 transform -skew-y-6 origin-top-left -z-10 shadow-lg opacity-20"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        
        <div className="mt-4 mb-2 flex justify-center w-fit mx-auto transition-transform hover:scale-105">
          <img 
            src="/logo_png.png" 
            alt="Ruiz Automotores SA" 
            className="h-20 object-contain" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="font-black text-2xl text-white tracking-wider drop-shadow-md">RUIZ AUTOMOTORES</span>';
            }}
          />
        </div>

        <h2 className="-mt-4 text-center text-3xl font-black text-white tracking-tight drop-shadow-sm relative z-10">
          {modoRecuperar ? 'Recuperá tu acceso' : (esRegistro ? 'Creá tu usuario' : 'Bienvenido a Mi Plan Ruiz')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-300 font-medium relative z-10">
          {modoRecuperar 
            ? 'Te enviaremos las instrucciones a tu correo.' 
            : (esRegistro ? 'Gestioná tu plan 100% online y sin intermediarios.' : 'Ingresá para gestionar tu plan y ver licitaciones.')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-20">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {!modoRecuperar && (
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setEsRegistro(false);
                  setErrorValidacion('');
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                  !esRegistro ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setEsRegistro(true);
                  setErrorValidacion('');
                }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                  esRegistro ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Registrarme
              </button>
            </div>
          )}

          <form className="space-y-5" onSubmit={manejarEnvio}>
            
            {modoRecuperar ? (
              emailEnviado ? (
                <div className="text-center py-4 animate-fade-in">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">¡Correo enviado!</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Revisá la bandeja de entrada de <br/><strong>{email}</strong><br/> para blanquear tu PIN Rombo.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setModoRecuperar(false);
                      setEmailEnviado(false);
                    }}
                    className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                  >
                    Volver a iniciar sesión
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Correo Electrónico Registrado
                  </label>
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 sm:text-sm transition-colors bg-gray-50 focus:bg-white"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-red-700 hover:bg-red-800 transition-all duration-200 transform hover:-translate-y-0.5 mb-3"
                  >
                    Enviar instrucciones
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoRecuperar(false)}
                    className="w-full flex justify-center items-center py-2 px-4 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar y volver
                  </button>
                </div>
              )
            ) : (
              <>
                {esRegistro && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      DNI (Sin puntos)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required={esRegistro}
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 sm:text-sm transition-colors bg-gray-50 focus:bg-white"
                        placeholder="Ej: 35123456"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 sm:text-sm transition-colors bg-gray-50 focus:bg-white"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={mostrarClave ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 sm:text-sm transition-colors bg-gray-50 focus:bg-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarClave(!mostrarClave)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {mostrarClave ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {!esRegistro && (
                  <div className="flex items-center justify-end mt-2">
                    <div className="text-sm">
                      <button 
                        type="button"
                        onClick={() => {
                          setModoRecuperar(true);
                          setErrorValidacion('');
                        }}
                        className="font-semibold text-red-600 hover:text-red-500"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </div>
                )}

                {errorValidacion && (
                  <div className="rounded-lg bg-red-50 p-3 border border-red-200 mt-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-red-800 leading-snug">
                      {errorValidacion}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-4 mt-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  {esRegistro ? 'Crear mi cuenta' : 'Ingresar a mi panel'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <span className="text-xs font-medium">Portal Seguro • Ruiz Automotores SA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}