import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppError } from '@/lib/errorHandler';

interface UseGlobalErrorReturn {
  error: AppError | null;
  setError: (error: AppError | null) => void;
  handleError: (error: any) => void;
  clearError: () => void;
  isEmpresaRequiredError: boolean;
  isAuthError: boolean;
}

export function useGlobalError(): UseGlobalErrorReturn {
  const [error, setError] = useState<AppError | null>(null);
  const router = useRouter();

  // Detectar si es un error de empresa requerida
  const isEmpresaRequiredError = error?.statusCode === 403 && 
    (error?.message?.toLowerCase().includes('configurar una empresa') || 
     error?.message?.toLowerCase().includes('empresa requerida') ||
     error?.message?.toLowerCase().includes('needs setup') ||
     error?.code === 'EMPRESA_REQUIRED');

  // Detectar si es un error de autenticación
  const isAuthError = error?.statusCode === 401;

  const handleError = useCallback((error: any) => {
    let appError: AppError;

    // Convertir diferentes tipos de error a AppError
    if (error instanceof AppError) {
      appError = error;
    } else if (error?.response?.data) {
      // Error de axios/fetch
      appError = new AppError(
        error.response.data.message || 'Error de servidor',
        error.response.status || 500
      );
    } else if (error?.message) {
      // Error genérico
      appError = new AppError(error.message, 500);
    } else {
      // Error desconocido
      appError = new AppError('Error inesperado', 500);
    }

    setError(appError);

    // Manejar redirecciones automáticas
    if (isEmpresaRequiredError && typeof window !== 'undefined') {
      if (!window.location.pathname.includes('/setup-empresa')) {
        console.log('🔄 Redirigiendo automáticamente a setup de empresa');
        router.push('/setup-empresa');
      }
    } else if (isAuthError && typeof window !== 'undefined') {
      if (!window.location.pathname.includes('/login')) {
        console.log('🔄 Redirigiendo automáticamente a login');
        router.push('/login');
      }
    }
  }, [isEmpresaRequiredError, isAuthError, router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    handleError,
    clearError,
    isEmpresaRequiredError,
    isAuthError,
  };
} 