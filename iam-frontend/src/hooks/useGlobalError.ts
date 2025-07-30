import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppError } from '@/lib/errorHandler';

interface UseGlobalErrorReturn {
  error: AppError | null;
  setError: (error: AppError | null) => void;
  handleError: (error: unknown) => void;
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
     error?.details?.code === 'EMPRESA_REQUIRED');

  // Detectar si es un error de autenticación
  const isAuthError = error?.statusCode === 401;

  const handleError = useCallback((error: unknown) => {
    let appError: AppError;

    // Convertir diferentes tipos de error a AppError
    if (error instanceof AppError) {
      appError = error;
    } else if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
      // Error de axios/fetch con respuesta
      const responseData = error.response.data as { message?: string; status?: number };
      appError = new AppError(
        responseData.message || 'Error de servidor',
        responseData.status || 500
      );
    } else if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'status' in error.response) {
      // Error de axios/fetch sin datos pero con status
      const response = error.response as { status: number };
      appError = new AppError(
        'Error de servidor',
        response.status
      );
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
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
        router.push('/setup-empresa');
      }
    } else if (isAuthError && typeof window !== 'undefined') {
      if (!window.location.pathname.includes('/login')) {
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