"use client";

import { useState } from 'react';
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
  Filter,
  TrendingDown,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';

const KPIS = [
  { 
    label: "Total de productos", 
    value: 128, 
    icon: <Box className="w-6 h-6 text-blue-500" />, 
    color: "bg-blue-50", 
    textColor: "text-blue-700",
    trend: "+12%",
    trendUp: true
  },
  { 
    label: "Stock total", 
    value: 2340, 
    icon: <Package className="w-6 h-6 text-purple-500" />, 
    color: "bg-purple-50", 
    textColor: "text-purple-700",
    trend: "+5%",
    trendUp: true
  },
  { 
    label: "Stock crítico", 
    value: 3, 
    icon: <AlertTriangle className="w-6 h-6 text-orange-500" />, 
    color: "bg-orange-50", 
    textColor: "text-orange-700",
    trend: "-2",
    trendUp: false
  },
  { 
    label: "Unidades vendidas", 
    value: 410, 
    icon: <TrendingUp className="w-6 h-6 text-green-500" />, 
    color: "bg-green-50", 
    textColor: "text-green-700",
    trend: "+18%",
    trendUp: true
  },
  { 
    label: "Margen promedio", 
    value: "38%", 
    icon: <PercentCircle className="w-6 h-6 text-indigo-500" />, 
    color: "bg-indigo-50", 
    textColor: "text-indigo-700",
    trend: "+3%",
    trendUp: true
  },
  { 
    label: "Rotación", 
    value: "45.4%", 
    icon: <RefreshCw className="w-6 h-6 text-cyan-500" />, 
    color: "bg-cyan-50", 
    textColor: "text-cyan-700",
    trend: "+7%",
    trendUp: true
  },
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

const recomendaciones = [
  {
    titulo: "Reabastecer stock crítico",
    descripcion: "3 productos requieren reabastecimiento inmediato",
    accion: "Ver productos",
    color: "bg-red-50 text-red-700 border-red-200"
  },
  {
    titulo: "Optimizar inventario",
    descripcion: "Identificamos 12 productos con baja rotación",
    accion: "Ver análisis",
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    titulo: "Promoción sugerida",
    descripcion: "Productos con mayor margen para promocionar",
    accion: "Ver productos",
    color: "bg-green-50 text-green-700 border-green-200"
  }
];

export default function DemoDashboard() {
  const [tab, setTab] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState('helados');

  const industries = [
    { id: 'helados', name: 'Helados', icon: '🍦' },
    { id: 'ropa', name: 'Ropa', icon: '👕' },
    { id: 'electronica', name: 'Electrónica', icon: '📱' },
    { id: 'alimentos', name: 'Alimentos', icon: '🥗' },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ve IAM en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E94F2] to-[#6366F1]">
              acción
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Explora cómo IAM transforma la gestión de inventario en diferentes industrias
          </p>

          {/* Industry selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedIndustry === industry.id
                    ? 'bg-[#8E94F2] text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="text-lg">{industry.icon}</span>
                <span>{industry.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Dashboard */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-6xl mx-auto">
          {/* Header del dashboard */}
          <div className="bg-gradient-to-r from-[#8E94F2] to-[#6366F1] p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🍦</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Congelato</h3>
                  <p className="text-sm opacity-90">Dashboard de Inventario</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">¡Hola Baruk!</p>
                <p className="font-semibold">Administrador</p>
              </div>
            </div>
          </div>

          {/* KPIs principales */}
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {KPIS.map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className={`p-2 rounded-lg ${kpi.color}`}>
                      {kpi.icon}
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                      kpi.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {kpi.trendUp ? <TrendingUpIcon className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {kpi.trend}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                  <div className="text-xs text-gray-500">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-[#8E94F2]" />
                  <h3 className="font-semibold text-gray-700">Evolución del stock total</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
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

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChartHorizontal className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-gray-700">Productos con menor stock</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
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
            </div>

            {/* Recomendaciones del agente */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Recomendaciones del Agente IAM
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recomendaciones.map((rec, index) => (
                  <div key={index} className={`border rounded-xl p-4 ${rec.color}`}>
                    <h4 className="font-semibold mb-2">{rec.titulo}</h4>
                    <p className="text-sm mb-3 opacity-80">{rec.descripcion}</p>
                    <button className="text-sm font-medium hover:underline">
                      {rec.accion} →
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón flotante */}
            <div className="flex justify-center">
              <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8E94F2] to-[#6366F1] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 animate-pulse">
                <ArrowRight className="w-4 h-4" />
                Explorar más funcionalidades
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 