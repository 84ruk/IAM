"use client";

import { useState, useEffect } from 'react';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import DemoDashboard from './DemoDashboard';
import PricingSection from './PricingSection';
import TestimonialsSection from './TestimonialsSection';

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkAuth = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.user || userData.sub) {
            setIsAuthenticated(true);
            // Redirigir al dashboard si está autenticado
            window.location.href = '/dashboard';
            return;
          }
        }
      } catch (error) {
        console.log('Usuario no autenticado');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8E94F2] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <DemoDashboard />
      <PricingSection />
      <TestimonialsSection />
    </div>
  );
} 