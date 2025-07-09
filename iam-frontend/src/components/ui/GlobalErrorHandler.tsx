'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Building, Settings, ArrowRight } from 'lucide-react';
import Button from './Button';

interface GlobalErrorHandlerProps {
  error?: any;
  onRetry?: () => void;
  onRedirect?: () => void;
}

export default function GlobalErrorHandler({ 
  error, 
  onRetry, 
  onRedirect 
}: GlobalErrorHandlerProps) {
  const router = useRouter();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  // Detectar si es un error de empresa requerida
  const isEmpresaRequiredError = error?.statusCode === 403 && 
    (error?.message?.includes('configurar una empresa') || 
     error?.message?.includes('empresa requerida') ||
     error?.code === 'EMPRESA_REQUIRED');

  // Detectar si es un error de autenticación
  const isAuthError = error?.statusCode === 401;

  const handleSetupRedirect = () => {
    setShowError(false);
    router.push('/setup-empresa');
  };

  const handleLoginRedirect = () => {
    setShowError(false);
    router.push('/login');
  };

  const handleRetry = () => {
    setShowError(false);
    onRetry?.();
  };

  if (!showError || !error) {
    return null;
  }

  // Error de empresa requerida
  if (isEmpresaRequiredError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="bg-blue-50 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Configuración requerida
            </h3>
            
            <p className="text-gray-600 mb-6">
              Necesitas configurar tu empresa para acceder a esta funcionalidad. 
              Este es un paso obligatorio para comenzar a usar el sistema.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleSetupRedirect}
                className="w-full flex items-center justify-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Configurar Empresa</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowError(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error de autenticación
  if (isAuthError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="bg-red-50 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sesión expirada
            </h3>
            
            <p className="text-gray-600 mb-6">
              Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar.
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleLoginRedirect}
                className="w-full"
              >
                Iniciar Sesión
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowError(false)}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error genérico
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="bg-red-50 rounded-full p-3 mx-auto mb-4 w-16 h-16 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error inesperado
          </h3>
          
          <p className="text-gray-600 mb-6">
            {error?.message || 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.'}
          </p>

          <div className="space-y-3">
            {onRetry && (
              <Button
                onClick={handleRetry}
                className="w-full"
              >
                Intentar Nuevamente
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowError(false)}
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 