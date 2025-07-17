"use client";

import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Smartphone,
  Cloud,
  Users
} from 'lucide-react';

const features = [
  {
    icon: <Brain className="w-8 h-8" />,
    title: "Inteligencia Artificial",
    description: "Predicciones automáticas de demanda, detección de patrones y recomendaciones inteligentes para optimizar tu inventario.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Análisis Predictivo",
    description: "Anticipa tendencias de ventas, identifica productos de alta rotación y optimiza tus compras con datos en tiempo real.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Control Total",
    description: "Gestión completa de stock, alertas automáticas, trazabilidad de productos y reportes detallados de tu operación.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Automatización",
    description: "Reduce errores humanos en un 60% con procesos automatizados de entrada, salida y control de inventario.",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Reportes Avanzados",
    description: "Dashboards interactivos, KPIs personalizados y análisis profundos para tomar decisiones informadas.",
    color: "from-indigo-500 to-purple-500"
  },
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: "Acceso Móvil",
    description: "Gestiona tu inventario desde cualquier lugar con nuestra aplicación móvil optimizada para dispositivos móviles.",
    color: "from-pink-500 to-rose-500"
  },
  {
    icon: <Cloud className="w-8 h-8" />,
    title: "Cloud Seguro",
    description: "Tus datos protegidos en la nube con respaldos automáticos, encriptación y acceso seguro 24/7.",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Colaboración en Equipo",
    description: "Múltiples usuarios, roles personalizados y flujos de trabajo colaborativos para tu equipo.",
    color: "from-emerald-500 to-teal-500"
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E94F2] to-[#6366F1]">
              crecer tu negocio
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            IAM combina la potencia de la inteligencia artificial con la simplicidad 
            que necesitas para gestionar tu inventario de manera eficiente.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#8E94F2]/20"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#8E94F2]/5 to-[#6366F1]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            ¿Listo para transformar tu gestión de inventario?
          </p>
          <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#8E94F2] to-[#6366F1] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
            Probar IAM gratis
          </button>
        </div>
      </div>
    </section>
  );
} 