"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Intentar redirigir al dashboard, si falla (no autenticado) al login
    // Como no tenemos contexto de usuario en client, primero intentamos dashboard
    const timer = setTimeout(() => {
      router.replace("/dashboard");
      // Si el SSR redirige a login, el usuario irá allí automáticamente
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Página no encontrada</h1>
      <p className="text-gray-600 mb-6">Serás redirigido automáticamente...</p>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8E94F2]" />
    </div>
  );
} 