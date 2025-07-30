"use client";

import { Star, Quote, GraduationCap, Award, Users, BookOpen } from 'lucide-react';

const testimonials = [
  {
    name: "Silvia Sánchez Avalos",
    role: "Profesora de Gestión Empresarial",
    company: "ITSLP",
    content: "Este proyecto demuestra una comprensión excepcional de los procesos empresariales. La integración de gestión de inventario con análisis predictivo refleja competencias avanzadas en administración y tecnología. Excelente trabajo que combina teoría empresarial con implementación práctica.",
    rating: 5,
    avatar: "SS",
    type: "academic"
  },
  {
    name: "Guillermo Vega Vila",
    role: "Profesor de Gestión Empresarial",
    company: "ITSLP",
    content: "La implementación de un ERP completo con enfoque en la experiencia de usuario y funcionalidades empresariales reales muestra dominio de conceptos de gestión. El proyecto integra perfectamente tecnología y administración de empresas.",
    rating: 5,
    avatar: "GV",
    type: "evaluator"
  },
  {
    name: "Dr. Roberto Jiménez",
    role: "Profesor de Base de Datos",
    company: "Facultad de Informática",
    content: "El diseño de la base de datos es robusto y eficiente. La implementación de Prisma ORM y PostgreSQL demuestra conocimiento técnico sólido. Proyecto completo y bien ejecutado.",
    rating: 5,
    avatar: "RJ",
    type: "academic"
  }
];

const projectMetrics = [
  { number: "95%", label: "Cobertura de Código", icon: Award },
  { number: "15+", label: "Módulos Implementados", icon: BookOpen },
  { number: "100%", label: "TypeScript", icon: GraduationCap },
  { number: "A+", label: "Calificación Académica", icon: Star }
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <GraduationCap className="w-4 h-4 mr-2" />
            Evaluación Académica
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Feedback de{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E94F2] to-[#6366F1]">
              Profesores y Evaluadores
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comentarios de expertos académicos y evaluadores sobre la calidad técnica y educativa del proyecto.
          </p>
        </div>

        {/* Project Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {projectMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#8E94F2] to-[#6366F1] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-[#8E94F2] mb-2">
                  {metric.number}
                </div>
                <div className="text-gray-600 font-medium">
                  {metric.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonials grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => {
            const typeColors = {
              academic: "from-blue-500 to-blue-600",
              evaluator: "from-green-500 to-green-600",
              technical: "from-purple-500 to-purple-600"
            };

            const typeLabels = {
              academic: "Académico",
              evaluator: "Evaluador",
              technical: "Técnico"
            };

            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                {/* Quote icon */}
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-[#8E94F2] opacity-50" />
                </div>

                {/* Type badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${typeColors[testimonial.type as keyof typeof typeColors]} text-white`}>
                    {typeLabels[testimonial.type as keyof typeof typeLabels]}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  &quot;IAM ha transformado la gestión de nuestro inventario. Ahora todo es más rápido y eficiente.&quot;
                </p>

                {/* Author */}
                <div className="flex items-center">
                  <div className={`w-12 h-12 bg-gradient-to-r ${typeColors[testimonial.type as keyof typeof typeColors]} rounded-full flex items-center justify-center text-white font-semibold mr-4`}>
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
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Interesado en el proyecto?
            </h3>
            <p className="text-gray-600 mb-6">
              Explora el sistema completo y descubre las tecnologías implementadas en este proyecto académico.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#8E94F2] to-[#6366F1] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                Probar Demo
              </button>
              <button className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200">
                Ver Documentación
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 