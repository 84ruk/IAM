"use client";

import { Code, Database, Shield, Zap, GitBranch, Server, Cpu, Globe } from 'lucide-react';

export default function TechnicalSection() {
  const technologies = [
    {
      category: "Frontend",
      items: [
        { name: "Next.js 15", description: "Framework React con SSR y optimizaciones" },
        { name: "TypeScript", description: "Tipado estático para mayor robustez" },
        { name: "Tailwind CSS", description: "Framework CSS utility-first" },
        { name: "Recharts", description: "Biblioteca de gráficos interactivos" }
      ]
    },
    {
      category: "Backend",
      items: [
        { name: "NestJS", description: "Framework Node.js para APIs escalables" },
        { name: "Prisma ORM", description: "ORM moderno para PostgreSQL" },
        { name: "PostgreSQL", description: "Base de datos relacional robusta" },
        { name: "JWT", description: "Autenticación y autorización segura" }
      ]
    },
    {
      category: "DevOps & Herramientas",
      items: [
        { name: "Git & GitHub", description: "Control de versiones y colaboración" },
        { name: "Docker", description: "Containerización para despliegue" },
        { name: "ESLint & Prettier", description: "Linting y formateo de código" },
      ]
    }
  ];

  const architecture = [
    {
      title: "Arquitectura Modular",
      description: "Separación clara de responsabilidades con módulos independientes",
      icon: GitBranch,
      color: "blue"
    },
    {
      title: "API RESTful",
      description: "Endpoints bien estructurados siguiendo estándares REST",
      icon: Server,
      color: "green"
    },
    {
      title: "Base de Datos Relacional",
      description: "Esquema optimizado con relaciones y índices apropiados",
      icon: Database,
      color: "purple"
    },
    {
      title: "Seguridad Implementada",
      description: "Autenticación JWT, validación de datos y protección CSRF",
      icon: Shield,
      color: "red"
    },
    {
      title: "Análisis Predictivo",
      description: "Algoritmos de IA para predicción de inventario y tendencias",
      icon: Cpu,
      color: "orange"
    },
    {
      title: "Responsive Design",
      description: "Interfaz adaptativa para dispositivos móviles y desktop",
      icon: Globe,
      color: "indigo"
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
            <Code className="w-4 h-4 mr-2" />
            Stack Tecnológico
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Tecnologías y Arquitectura
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            El proyecto utiliza tecnologías modernas y mejores prácticas de desarrollo 
            para crear un sistema robusto y escalable.
          </p>
        </div>

        {/* Tecnologías por categoría */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {technologies.map((category, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-blue-600" />
                {category.category}
              </h3>
              <div className="space-y-4">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Arquitectura del sistema */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Arquitectura del Sistema</h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Diseño modular que permite escalabilidad, mantenibilidad y extensibilidad del sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {architecture.map((item, index) => {
            const Icon = item.icon;
            const colorClasses = {
              blue: "bg-blue-100 text-blue-600",
              green: "bg-green-100 text-green-600",
              purple: "bg-purple-100 text-purple-600",
              red: "bg-red-100 text-red-600",
              orange: "bg-orange-100 text-orange-600",
              indigo: "bg-indigo-100 text-indigo-600"
            };

            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${colorClasses[item.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h4>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* Métricas del proyecto */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Métricas del Proyecto</h3>
            <p className="text-gray-600">Estadísticas que demuestran la complejidad y alcance del desarrollo</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
              <div className="text-sm text-gray-600">Módulos del Sistema</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-sm text-gray-600">Endpoints API</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">20+</div>
              <div className="text-sm text-gray-600">Componentes React</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">TypeScript</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 