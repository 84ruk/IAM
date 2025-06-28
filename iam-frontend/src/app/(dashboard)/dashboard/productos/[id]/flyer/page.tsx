"use client"

import Image from "next/image";
import Link from "next/link";

export default function FlyerGeneradoPage() {
  return (
    <div className="max-w-md mx-auto py-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="text-2xl">🤖</span>
        Flyer Generado
      </h1>
      <p className="text-gray-600 text-center mb-6 max-w-xs">
        Detectamos que este producto tiene baja rotación según los datos del dashboard. El agente IAM solicitó a ChatGPT y DALL·E generar un flyer promocional para aumentar sus ventas.
      </p>
      <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
        <Image
          src="/flyer-demo-chocolate.png"
          alt="Flyer promocional generado por IA"
          width={320}
          height={450}
          className="rounded-lg object-contain mx-auto"
        />
      </div>
      <button
        className="w-full max-w-xs flex items-center justify-center gap-2 bg-[#8E94F2] hover:bg-[#7278e0] text-white font-semibold text-lg px-6 py-3 rounded-xl transition-colors shadow-lg mb-2"
        disabled
      >
        Analizar <span className="text-xl">🔍</span>
      </button>
      <p className="text-xs text-gray-400 text-center">* Integración con análisis de IA próximamente</p>
      <Link href="/dashboard/productos" className="mt-6 text-[#8E94F2] hover:underline text-sm">Volver a productos</Link>
    </div>
  );
} 