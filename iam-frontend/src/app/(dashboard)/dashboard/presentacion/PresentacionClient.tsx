'use client'

import { PlayCircle, CheckCircle2 } from "lucide-react"

export default function PresentacionClient() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center py-10 px-2">
      <h1 className="text-2xl font-bold text-[#8E94F2] mb-4">Presentación de IAM</h1>
      {/* Video placeholder */}
      <div className="w-full max-w-xl aspect-video bg-gray-200 rounded-xl flex flex-col items-center justify-center mb-6 shadow relative overflow-hidden">
        <PlayCircle className="w-16 h-16 text-[#8E94F2] mb-2" />
        <span className="text-gray-500 text-lg font-medium">Video de presentación próximamente</span>
        <span className="absolute bottom-2 right-4 text-xs text-gray-400">Narrador: Luis</span>
      </div>
      {/* Mensaje narrado */}
      <div className="max-w-2xl bg-white rounded-xl shadow p-6 mb-8 text-center">
        <p className="text-gray-700 text-base mb-2">
          <span className="font-semibold text-[#8E94F2]">Luis:</span> A diferencia de los costosos y complejos ERPs, o el software contable que no integra marketing, <span className="font-semibold">IAM</span> es accesible, modular y une inventario con promoción. Los errores se pueden reducir hasta en un 60% y las ventas se pueden incrementar hasta en un 35%. IAM no solo digitaliza, hace que las PyMEs sean más competitivas y se adapten a la Industria 4.0.
        </p>
      </div>
      {/* Simulación de planes */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Elige tu plan IAM</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mb-8">
        {/* Plan Básico */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border-2 border-[#8E94F2]/10">
          <span className="text-lg font-bold text-[#8E94F2] mb-2">Básico</span>
          <span className="text-3xl font-bold text-gray-800 mb-2">$499<span className="text-base font-normal text-gray-500">/mes</span></span>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Inventario digital</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Alertas de stock</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Soporte básico</li>
          </ul>
          <button className="bg-[#8E94F2] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#7278e0] transition">Elegir</button>
        </div>
        {/* Plan Pro */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border-2 border-[#8E94F2] scale-105">
          <span className="text-lg font-bold text-[#8E94F2] mb-2">Pro</span>
          <span className="text-3xl font-bold text-gray-800 mb-2">$899<span className="text-base font-normal text-gray-500">/mes</span></span>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Todo lo del Básico</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Marketing automatizado</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Asistencia inteligente IA</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Integración con ventas</li>
          </ul>
          <button className="bg-[#8E94F2] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#7278e0] transition">Elegir</button>
        </div>
        {/* Plan Empresarial */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center border-2 border-[#8E94F2]/10">
          <span className="text-lg font-bold text-[#8E94F2] mb-2">Empresarial</span>
          <span className="text-3xl font-bold text-gray-800 mb-2">$1,499<span className="text-base font-normal text-gray-500">/mes</span></span>
          <ul className="text-sm text-gray-600 mb-4 space-y-1">
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Todo lo del Pro</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Integraciones avanzadas</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Soporte prioritario</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Personalización</li>
          </ul>
          <button className="bg-[#8E94F2] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#7278e0] transition">Elegir</button>
        </div>
      </div>
    </div>
  )
} 