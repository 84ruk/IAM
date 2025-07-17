"use client";

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "María González",
    role: "Gerente General",
    company: "Helados Artesanales Doña María",
    content: "IAM transformó completamente nuestro negocio. Antes perdíamos tiempo contando inventario manualmente. Ahora todo es automático y podemos enfocarnos en crecer.",
    rating: 5,
    avatar: "MG"
  },
  {
    name: "Carlos Rodríguez",
    role: "Dueño",
    company: "Electrónicos Rápido",
    content: "La inteligencia artificial de IAM nos ayuda a predecir qué productos necesitaremos. Hemos reducido nuestro stock muerto en un 40% y aumentado las ventas.",
    rating: 5,
    avatar: "CR"
  },
  {
    name: "Ana Martínez",
    role: "Directora de Operaciones",
    company: "Boutique Elegante",
    content: "El dashboard es increíblemente intuitivo. En minutos puedo ver el estado de mi inventario y tomar decisiones informadas. IAM es exactamente lo que necesitábamos.",
    rating: 5,
    avatar: "AM"
  },
  {
    name: "Luis Fernández",
    role: "Propietario",
    company: "Farmacia del Centro",
    content: "Las alertas automáticas nos han salvado de quedarnos sin productos críticos. El soporte es excelente y la plataforma es muy fácil de usar.",
    rating: 5,
    avatar: "LF"
  },
  {
    name: "Patricia Silva",
    role: "Gerente",
    company: "Restaurante La Tradición",
    content: "IAM nos ha ayudado a optimizar nuestros costos de inventario. La integración con nuestros proveedores es perfecta y el análisis predictivo es muy preciso.",
    rating: 5,
    avatar: "PS"
  },
  {
    name: "Roberto Jiménez",
    role: "CEO",
    company: "Distribuidora Industrial",
    content: "Después de probar varios ERPs, IAM es el único que realmente entiende las necesidades de las PYMEs. La implementación fue rápida y el ROI fue inmediato.",
    rating: 5,
    avatar: "RJ"
  }
];

const stats = [
  { number: "500+", label: "Empresas confían en IAM" },
  { number: "4.9/5", label: "Calificación promedio" },
  { number: "60%", label: "Reducción de errores" },
  { number: "35%", label: "Incremento en ventas" }
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Lo que dicen nuestros{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E94F2] to-[#6366F1]">
              clientes
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre cómo IAM está transformando la gestión de inventario en empresas como la tuya.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#8E94F2] mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              {/* Quote icon */}
              <div className="mb-4">
                <Quote className="w-8 h-8 text-[#8E94F2] opacity-50" />
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-[#8E94F2] to-[#6366F1] rounded-full flex items-center justify-center text-white font-semibold mr-4">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {testimonial.role}
                  </div>
                  <div className="text-sm text-[#8E94F2] font-medium">
                    {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Listo para unirte a ellos?
            </h3>
            <p className="text-gray-600 mb-6">
              Únete a más de 500 empresas que ya confían en IAM para gestionar su inventario.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#8E94F2] to-[#6366F1] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                Comenzar gratis
              </button>
              <button className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200">
                Ver más testimonios
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 