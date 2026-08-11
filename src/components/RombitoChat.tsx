import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, RefreshCw, Bot } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
}

export default function RombitoChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: '¡Hola! Soy Rombito, tu asistente virtual de Ruiz Automotores. ¿Querés saber sobre un modelo nuevo, consultar tu cuota o ver licitaciones?',
      sender: 'bot',
    },
  ]);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Cerebro Simulado de Rombito
  const generateBotResponse = (userInput: string) => {
    const text = userInput.toLowerCase();
    
    if (text.includes('kwid')) {
      return '¡Excelente elección! El Renault Kwid es espectacular, súper económico y ágil para andar por todo Tucumán. Lo tenemos con entrega asegurada. ¿Te gustaría saber el valor de la cuota de este mes?';
    } 
    if (text.includes('cuota') || text.includes('precio') || text.includes('valor')) {
      return 'Nuestras cuotas son 100% en pesos y sin interés. Tenemos distintos planes para que se ajusten a tu bolsillo. ¿Querés que un asesor de nuestra sucursal te mande un mensaje con los números exactos?';
    }
    if (text.includes('si') || text.includes('dale') || text.includes('bueno')) {
      return '¡Perfecto! Por favor, dejame tu nombre y número de teléfono (o WhatsApp) y en los próximos 15 minutos un asesor oficial de Ruiz Automotores se contacta con vos.';
    }
    if (text.includes('licitacion') || text.includes('licitaciones')) {
      return '¡Claro! Las licitaciones son mensuales. Podés ofertar con capital propio o usando tu auto usado como parte de pago. ¿Sobre qué modelo querías licitar?';
    }
    
    // Respuesta por defecto si no entiende
    return '¡Entiendo! Como soy un asistente virtual en entrenamiento, a veces me mareo un poco. Lo mejor es que un asesor humano te asesore bien. ¿Me dejás tu teléfono y te llamamos?';
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    // Agregar mensaje del usuario
    const newUserMsg: Message = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simular que Rombito está pensando/escribiendo
    setTimeout(() => {
      const responseText = generateBotResponse(newUserMsg.text);
      const newBotMsg: Message = { id: Date.now() + 1, text: responseText, sender: 'bot' };
      
      setMessages((prev) => [...prev, newBotMsg]);
      setIsTyping(false);
    }, 1500); // Tarda 1.5 segundos en contestar
  };

  const resetChat = () => {
    setMessages([{
      id: 1,
      text: '¡Hola! Soy Rombito, tu asistente virtual de Ruiz Automotores. ¿Querés saber sobre un modelo nuevo, consultar tu cuota o ver licitaciones?',
      sender: 'bot',
    }]);
  };

  return (
    <>
      {/* Botón flotante para abrir el chat */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-red-600 text-white rounded-full shadow-2xl hover:bg-red-700 transition-all hover:scale-110 z-50 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageCircle className="w-8 h-8" />
      </button>

      {/* Ventana del Chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-gray-50 rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-200 flex flex-col h-[500px]">
          
          {/* Header del Chat */}
          <div className="bg-[#cc0000] p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                   {/* Si tenés la imagen de rombito, ponela acá en el src. Sino queda el icono del bot */}
                   <img src="/Rombito.png" alt="Rombito" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                   <Bot className="w-6 h-6 text-red-600 absolute -z-10" /> 
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#cc0000]"></div>
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Rombito AI</h3>
                <p className="text-xs text-red-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  En línea
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={resetChat} className="p-2 text-white hover:bg-red-700 rounded-full transition-colors" title="Reiniciar chat">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 text-white hover:bg-red-700 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-red-600 text-white rounded-tr-sm' 
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {/* Animación de "Escribiendo..." */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input para escribir */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribí tu consulta..."
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim()}
              className="p-2 bg-red-200 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-red-200 disabled:hover:text-red-600 flex items-center justify-center w-10 h-10"
            >
              <Send className="w-4 h-4 ml-1" />
            </button>
          </form>
          
          {/* Footer del chat */}
          <div className="text-center py-1.5 bg-white text-[10px] text-gray-400 border-t border-gray-50">
            Rombito AI · Asistente virtual de Ruiz Automotores
          </div>
        </div>
      )}
    </>
  );
}