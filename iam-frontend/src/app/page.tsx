"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Box,
  AlertTriangle,
  TrendingUp,
  PercentCircle,
  RefreshCw,
  BarChart3,
  BarChartHorizontal,
  ArrowRight,
  Users,
  ShoppingCart,
  ClipboardList,
  Plus,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";

const KPIS = [
  { label: "Total de productos", value: 128, icon: <Box className="w-7 h-7 text-blue-500" />, color: "bg-blue-100 text-blue-700" },
  { label: "Stock total", value: 2340, icon: <Package className="w-7 h-7 text-purple-500" />, color: "bg-purple-100 text-purple-700" },
  { label: "Stock crítico", value: 3, icon: <AlertTriangle className="w-7 h-7 text-orange-500" />, color: "bg-orange-100 text-orange-700" },
  { label: "Unidades vendidas (mes)", value: 410, icon: <TrendingUp className="w-7 h-7 text-green-500" />, color: "bg-green-100 text-green-700" },
  { label: "Margen promedio", value: "38%", icon: <PercentCircle className="w-7 h-7 text-indigo-500" />, color: "bg-indigo-100 text-indigo-700" },
  { label: "Rotación", value: "45.4%", icon: <RefreshCw className="w-7 h-7 text-cyan-500" />, color: "bg-cyan-100 text-cyan-700" },
];

const stockEvolucion = [
  { fecha: "01/06", stock: 2400 },
  { fecha: "05/06", stock: 2200 },
  { fecha: "10/06", stock: 2100 },
  { fecha: "15/06", stock: 2000 },
  { fecha: "20/06", stock: 1800 },
  { fecha: "25/06", stock: 1700 },
  { fecha: "30/06", stock: 1600 },
];

const stockCritico = [
  { nombre: "Fresa con leche", stock: 5 },
  { nombre: "Chocolate", stock: 8 },
  { nombre: "Vainilla", stock: 12 },
  { nombre: "Mango", stock: 15 },
  { nombre: "Limón", stock: 18 },
];

const coloresStock = ["#F59E42", "#FBBF24", "#F87171", "#FDE68A", "#FCA5A5"];

export default function Home() {
  const [tab, setTab] = useState(0);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  return (
    <div className="bg-[#F8F9FB] min-h-screen w-full pb-8">
      {/* Header fijo con logo y empresa */}
      <header className="w-full flex items-center justify-between px-4 py-3 bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Image src="/logo-congelato.png" alt="Logo" width={40} height={40} className="rounded-lg bg-[#8E94F2] p-1" />
          <span className="font-bold text-lg text-[#8E94F2] tracking-tight">Congelato</span>
        </div>
        <div className="flex flex-col items-end text-xs text-gray-500">
          <span>¡Hola Baruk!</span>
          <span className="font-semibold text-gray-700">Administrador</span>
        </div>
      </header>

      {/* KPIs principales */}
      <section className="max-w-5xl mx-auto px-2 mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className={`flex flex-col items-center justify-center rounded-xl shadow bg-white p-3 ${kpi.color} transition hover:shadow-lg`}>
            <div>{kpi.icon}</div>
            <span className="text-xs text-gray-500 mt-1 text-center">{kpi.label}</span>
            <span className="text-xl font-bold text-gray-800 mt-1">{kpi.value}</span>
          </div>
        ))}
      </section>

      {/* Tabs de gráficas en móvil, ambas en desktop */}
      <section className="max-w-5xl mx-auto px-2 mt-8">
        <div className="sm:hidden flex gap-2 mb-4">
          <button onClick={() => setTab(0)} className={`flex-1 py-2 rounded-lg font-medium text-sm ${tab === 0 ? 'bg-[#8E94F2] text-white' : 'bg-white text-[#8E94F2] border border-[#8E94F2]'}`}>Evolución de stock</button>
          <button onClick={() => setTab(1)} className={`flex-1 py-2 rounded-lg font-medium text-sm ${tab === 1 ? 'bg-[#8E94F2] text-white' : 'bg-white text-[#8E94F2] border border-[#8E94F2]'}`}>Stock crítico</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {(tab === 0 || !isMobile) && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-[#8E94F2]" />
                <h2 className="font-semibold text-gray-700 text-base">Evolución del stock total</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stockEvolucion} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8E94F2" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8E94F2" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="fecha" fontSize={10} />
                  <YAxis allowDecimals={false} fontSize={10} />
                  <Tooltip formatter={(value: any) => `${value} unidades`} />
                  <Area type="monotone" dataKey="stock" stroke="#8E94F2" strokeWidth={2} fill="url(#stockGradient)" name="Stock" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="text-xs text-gray-400 mt-2">Últimos 30 días</div>
            </div>
          )}
          {(tab === 1 || !isMobile) && (
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChartHorizontal className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-gray-700 text-base">Productos con menor stock</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stockCritico} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis type="number" allowDecimals={false} fontSize={10} />
                  <YAxis dataKey="nombre" type="category" fontSize={10} width={90} />
                  <Tooltip formatter={(value: any) => `${value} unidades`} />
                  <Bar dataKey="stock" fill="#F59E42">
                    {stockCritico.map((entry, idx) => (
                      <Cell key={entry.nombre} fill={coloresStock[idx % coloresStock.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-xs text-gray-400 mt-2">Top 5 productos con menor stock</div>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Link href="/dashboard/analisis" className="flex items-center gap-1 text-[#8E94F2] hover:underline text-sm font-medium">
            Ver más análisis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Acciones rápidas */}
      <section className="max-w-5xl mx-auto px-2 mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/dashboard/productos/nuevo" className="flex flex-col items-center justify-center bg-[#8E94F2] text-white rounded-xl shadow p-4 hover:bg-[#7278e0] transition">
          <Plus className="w-7 h-7 mb-1" />
          <span className="text-sm font-medium">Agregar producto</span>
        </Link>
        <Link href="/dashboard/productos" className="flex flex-col items-center justify-center bg-white text-[#8E94F2] border border-[#8E94F2] rounded-xl shadow p-4 hover:bg-[#f1f2fd] transition">
          <ClipboardList className="w-7 h-7 mb-1" />
          <span className="text-sm font-medium">Ver productos</span>
        </Link>
        <Link href="/dashboard/movimientos/nuevo" className="flex flex-col items-center justify-center bg-white text-[#8E94F2] border border-[#8E94F2] rounded-xl shadow p-4 hover:bg-[#f1f2fd] transition">
          <ShoppingCart className="w-7 h-7 mb-1" />
          <span className="text-sm font-medium">Nuevo movimiento</span>
        </Link>
        <Link href="/dashboard/analisis" className="flex flex-col items-center justify-center bg-white text-[#8E94F2] border border-[#8E94F2] rounded-xl shadow p-4 hover:bg-[#f1f2fd] transition">
          <BarChart3 className="w-7 h-7 mb-1" />
          <span className="text-sm font-medium">Ver análisis</span>
        </Link>
      </section>
    </div>
  );
}
