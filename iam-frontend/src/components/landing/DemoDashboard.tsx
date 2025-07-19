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
  TrendingUp as TrendingUpIcon,
  Eye,
  Settings,
  Bell,
  Search,
  Calendar,
  DollarSign,
  Users,
  Activity,
  Zap,
  Target,
  CheckCircle,
  Clock,
  Star,
  Wifi,
  WifiOff
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, LineChart, Line, PieChart, Pie, ComposedChart } from 'recharts';

const KPIS = [
  { 
    label: "Total Productos", 
    value: 156, 
    icon: <Package className="w-6 h-6 text-blue-600" />, 
    color: "text-blue-600",
    detail: "Productos registrados"
  },
  { 
    label: "Stock Crítico", 
    value: 5, 
    icon: <AlertTriangle className="w-6 h-6 text-red-600" />, 
    color: "text-red-600",
    detail: "Requieren atención"
  },
  { 
    label: "Valor Inventario", 
    value: "$45,230", 
    icon: <DollarSign className="w-6 h-6 text-green-600" />, 
    color: "text-green-600",
    detail: "Valor total"
  },
  { 
    label: "Ventas del Mes", 
    value: "$12,450", 
    icon: <TrendingUp className="w-6 h-6 text-blue-600" />, 
    color: "text-blue-600",
    detail: "Ingresos generados"
  },
];

const ventasPorDia = [
  { fecha: "01/06", ventas: 180 },
  { fecha: "05/06", ventas: 165 },
  { fecha: "10/06", ventas: 190 },
  { fecha: "15/06", ventas: 175 },
  { fecha: "20/06", ventas: 210 },
  { fecha: "25/06", ventas: 185 },
  { fecha: "30/06", ventas: 200 },
];

const stockPorCategoria = [
  { name: "Helados", stock: 45, color: "#0088FE" },
  { name: "Chocolates", stock: 25, color: "#00C49F" },
  { name: "Frutas", stock: 20, color: "#FFBB28" },
  { name: "Sorbetes", stock: 10, color: "#FF8042" },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const financialKpis = [
  {
    title: "Margen Bruto",
    value: "42.5%",
    icon: PercentCircle,
    iconColor: "text-blue-600",
    valueColor: "text-green-600"
  },
  {
    title: "Margen Neto",
    value: "28.3%",
    icon: Target,
    iconColor: "text-purple-600",
    valueColor: "text-green-600"
  },
  {
    title: "ROI Inventario",
    value: "15.7%",
    icon: TrendingUp,
    iconColor: "text-green-600",
    valueColor: "text-green-600"
  },
  {
    title: "Eficiencia Operativa",
    value: "87.2%",
    icon: TrendingDown,
    iconColor: "text-red-600",
    valueColor: "text-green-600"
  }
];

const quickLinks = [
  {
    title: "KPIs Detallados",
    description: "Análisis completo",
    icon: BarChart3,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100",
    href: "#"
  },
  {
    title: "Productos",
    description: "Gestionar inventario",
    icon: Package,
    iconColor: "text-green-600",
    bgColor: "bg-green-100",
    href: "#"
  },
  {
    title: "Movimientos",
    description: "Entradas y salidas",
    icon: Activity,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-100",
    href: "#"
  },
  {
    title: "Proveedores",
    description: "Gestión de compras",
    icon: TrendingUp,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-100",
    href: "#"
  }
];

export default function DemoDashboard() {
  const [selectedIndustry, setSelectedIndustry] = useState('helados');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const industries = [
    { id: 'helados', name: 'Helados', icon: '🍦' },
    { id: 'ropa', name: 'Ropa', icon: '👕' },
    { id: 'electronica', name: 'Electrónica', icon: '📱' },
    { id: 'alimentos', name: 'Alimentos', icon: '🥗' },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-[#8E94F2] to-[#6366F1] text-white text-sm font-medium mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Demo Interactivo
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ve IAM en{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E94F2] to-[#6366F1]">
              acción
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Explora cómo IAM transforma la gestión de inventario con análisis avanzado
          </p>

          {/* Industry selector */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setSelectedIndustry(industry.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  selectedIndustry === industry.id
                    ? 'bg-[#8E94F2] text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <span className="text-xl">{industry.icon}</span>
                <span>{industry.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Dashboard */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-6xl mx-auto">
          {/* Header del dashboard */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  Análisis completo de tu inventario y ventas
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Indicador de conexión */}
                <div className="flex items-center gap-2 text-sm">
                  {isOnline ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                    {isOnline ? 'En línea' : 'Sin conexión'}
                  </span>
                </div>

                {/* Botón de refresh */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Actualizar</span>
                </button>

                {/* Toggle auto-refresh */}
                <button
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    autoRefreshEnabled 
                      ? 'bg-[#8E94F2] text-white hover:bg-[#7278e0]' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Auto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6">
            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {KPIS.map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      {kpi.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                  <div className="text-sm text-gray-500 mb-1">{kpi.label}</div>
                  <div className="text-xs text-gray-400">{kpi.detail}</div>
                </div>
              ))}
            </div>

            {/* KPIs Financieros */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Indicadores Financieros</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {financialKpis.map((kpi) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={kpi.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <Icon className={`w-6 h-6 ${kpi.iconColor}`} />
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${kpi.valueColor} mb-1`}>{kpi.value}</div>
                      <div className="text-sm text-gray-500">{kpi.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Gráfico de ventas por día */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Día</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ventasPorDia}>
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="ventas" stroke="#8E94F2" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Gráfico de stock por categoría */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock por Categoría</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stockPorCategoria}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="stock"
                    >
                      {stockPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Enlaces Rápidos */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Acceso Rápido</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <a 
                      key={link.title}
                      href={link.href}
                      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-2 ${link.bgColor} rounded-lg`}>
                        <Icon className={`w-5 h-5 ${link.iconColor}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{link.title}</p>
                        <p className="text-sm text-gray-600">{link.description}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Botón de acción */}
            <div className="flex justify-center">
              <button className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#8E94F2] to-[#6366F1] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300">
                <Eye className="w-5 h-5" />
                Explorar Dashboard Completo
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 