'use client';

import { MessageCircle, Megaphone } from "lucide-react";

export default function MarketingClient() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center py-10 px-2">
      <h1 className="text-2xl font-bold text-[#8E94F2] mb-6">Funciones Inteligentes IAM</h1>
      <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Marketing Automatizado */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-7 h-7 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-800">Marketing Automatizado</h2>
          </div>
          <p className="text-gray-600 text-sm mb-4 text-center">
            Se generan flyers y campañas de marketing automáticas, dirigidas a clientes potenciales, directamente desde el stock.<br />
            ¡Los negocios tendrán mayor alcance y más ventas!
          </p>
          <div className="w-full flex flex-col items-center">
            <span className="text-xs text-gray-400 mb-2">Ejemplo de flyer generado por IA:</span>
            <div className="w-64 h-80 rounded-lg overflow-hidden border border-gray-200 shadow bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
              <div className="text-center text-gray-600">
                <Megaphone className="w-12 h-12 mx-auto mb-2 text-orange-400" />
                <p className="text-sm font-medium">Flyer Demo</p>
                <p className="text-xs">Generado por IA</p>
              </div>
            </div>
          </div>
        </div>
        {/* Asistencia Inteligente */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-7 h-7 text-[#8E94F2]" />
            <h2 className="text-lg font-semibold text-gray-800">Asistencia Inteligente</h2>
          </div>
          <p className="text-gray-600 text-sm mb-6 text-center">
            Un chat experto con IA resolverá dudas y guiará en cada paso.<br />
            Soporte instantáneo, recomendaciones y ayuda personalizada para gestionar tu inventario de forma eficiente.
          </p>
          <div className="w-full flex flex-col items-center">
            <div className="w-full bg-[#F8F9FB] border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex gap-2 items-start">
                <div className="w-8 h-8 bg-[#8E94F2] rounded-full flex items-center justify-center text-white font-bold">IA</div>
                <div className="bg-white rounded-lg px-3 py-2 shadow text-sm text-gray-700 max-w-[220px]">
                  ¡Hola! ¿En qué puedo ayudarte hoy?<br />Puedes preguntarme sobre stock, ventas, pedidos y más.
                </div>
              </div>
              <div className="flex gap-2 items-start justify-end">
                <div className="bg-[#8E94F2] text-white rounded-lg px-3 py-2 shadow text-sm max-w-[220px] ml-auto">
                  ¿Cómo genero un reporte de productos con baja rotación?
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">B</div>
              </div>
              <div className="flex gap-2 items-start">
                <div className="w-8 h-8 bg-[#8E94F2] rounded-full flex items-center justify-center text-white font-bold">IA</div>
                <div className="bg-white rounded-lg px-3 py-2 shadow text-sm text-gray-700 max-w-[220px]">
                  Ve a la sección de análisis y haz clic en "Ver productos con baja rotación". ¿Te gustaría que te muestre un ejemplo?
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-400 mt-2">Demo de chat inteligente</span>
          </div>
        </div>
      </div>
    </div>
  );
} 