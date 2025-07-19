"use client";

import { GraduationCap, BookOpen, Users, Target, Award, Lightbulb } from 'lucide-react';

export default function AcademicSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-6">
            <GraduationCap className="w-4 h-4 mr-2" />
            Contexto Académico
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Proyecto de Innovación Tecnológica
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Este ERP fue desarrollado como parte del programa Innovatec, demostrando 
            la aplicación práctica de tecnologías modernas en la gestión empresarial.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Objetivo Académico */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Objetivo del Proyecto</h3>
            <p className="text-gray-600 leading-relaxed">
              Desarrollar un sistema de gestión empresarial completo que integre 
              tecnologías modernas y demuestre competencias técnicas avanzadas en 
              desarrollo de software empresarial.
            </p>
          </div>

          {/* Metodología */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Metodología Aplicada</h3>
            <p className="text-gray-600 leading-relaxed">
              Desarrollo ágil con sprints, metodología SCRUM, y enfoque en 
              arquitectura limpia. Integración continua y despliegue continuo (CI/CD).
            </p>
          </div>

          {/* Competencias */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Competencias Desarrolladas</h3>
            <p className="text-gray-600 leading-relaxed">
              Desarrollo full-stack, gestión de bases de datos, implementación de 
              IA, análisis de datos, y gestión de proyectos tecnológicos complejos.
            </p>
          </div>

          {/* Innovación */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
              <Lightbulb className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Elementos Innovadores</h3>
            <p className="text-gray-600 leading-relaxed">
              Integración de análisis predictivo, automatización inteligente, 
              y arquitectura escalable para demostrar soluciones tecnológicas avanzadas.
            </p>
          </div>

          {/* Aplicación Real */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
              <Users className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Aplicación Práctica</h3>
            <p className="text-gray-600 leading-relaxed">
              Sistema funcional que puede ser utilizado por PYMEs reales, 
              demostrando la viabilidad comercial de las tecnologías implementadas.
            </p>
          </div>

          {/* Resultados */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Resultados Académicos</h3>
            <p className="text-gray-600 leading-relaxed">
              Proyecto completo que demuestra dominio de tecnologías empresariales, 
              capacidad de innovación y habilidades de desarrollo profesional.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 