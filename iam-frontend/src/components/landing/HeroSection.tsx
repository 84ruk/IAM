"use client";

import Link from 'next/link';
import { ArrowRight, Play, Star } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-8">
            <Star className="w-4 h-4 mr-2 fill-current" />
            ERP Inteligente para PYMEs
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Revoluciona tu{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8E94F2] to-[#6366F1]">
              gestión de inventario
            </span>
            <br />
            con inteligencia artificial
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            IAM es el ERP inteligente que automatiza tu inventario, predice tendencias y 
            optimiza tus operaciones. Diseñado específicamente para PYMEs que quieren 
            crecer sin complicaciones.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#8E94F2] to-[#6366F1] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Comenzar gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            
            <button className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 border border-gray-200">
              <Play className="mr-2 w-5 h-5 text-[#8E94F2]" />
              Ver demo
            </button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 border-2 border-white"
                  ></div>
                ))}
              </div>
              <span>+500 empresas confían en IAM</span>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center mr-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span>4.9/5 calificación</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 