"use client";

import { Check, Star } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: "Gratis",
    price: "0",
    currency: "MXN",
    period: "por siempre",
    description: "Perfecto para comenzar y probar IAM",
    features: [
      "Hasta 50 productos",
      "1 usuario",
      "Reportes básicos",
      "Soporte por email",
      "Acceso móvil básico"
    ],
    popular: false,
    cta: "Comenzar gratis",
    href: "/register"
  },
  {
    name: "Profesional",
    price: "1,499",
    currency: "MXN",
    period: "por mes",
    description: "Ideal para PYMEs en crecimiento",
    features: [
      "Productos ilimitados",
      "Hasta 5 usuarios",
      "Análisis predictivo",
      "Alertas automáticas",
      "Reportes avanzados",
      "Soporte prioritario",
      "Integración con proveedores",
      "Backup automático"
    ],
    popular: true,
    cta: "Comenzar prueba gratis",
    href: "/register"
  },
  {
    name: "Empresarial",
    price: "4,999",
    currency: "MXN",
    period: "por mes",
    description: "Para empresas con necesidades complejas",
    features: [
      "Todo del plan Profesional",
      "Usuarios ilimitados",
      "IA avanzada personalizada",
      "API completa",
      "Soporte 24/7",
      "Implementación dedicada",
      "Capacitación incluida",
      "SLA garantizado"
    ],
    popular: false,
    cta: "Contactar ventas",
    href: "/contact"
  }
];

export default function PricingSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Planes{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E94F2] to-[#6366F1]">
              transparentes
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Elige el plan que mejor se adapte a tu negocio. Sin sorpresas, sin costos ocultos.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-[#8E94F2] scale-105' 
                  : 'border-gray-200 hover:border-[#8E94F2]/30'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-[#8E94F2] to-[#6366F1] text-white text-sm font-semibold rounded-full shadow-lg">
                    <Star className="w-4 h-4 fill-current" />
                    Más popular
                  </div>
                </div>
              )}

              <div className="p-8">
                {/* Plan name and description */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xl text-gray-500 ml-1">{plan.currency}</span>
                  </div>
                  <p className="text-gray-500 text-sm">{plan.period}</p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA button */}
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#8E94F2] to-[#6366F1] text-white hover:shadow-lg transform hover:-translate-y-0.5'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="text-center mt-16">
          <div className="bg-gray-50 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Necesitas algo personalizado?
            </h3>
            <p className="text-gray-600 mb-6">
              Nuestro equipo puede crear un plan a medida para tu empresa con funcionalidades específicas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#8E94F2] to-[#6366F1] text-white font-semibold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Hablar con ventas
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200"
              >
                Solicitar demo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 