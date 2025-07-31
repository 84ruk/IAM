'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import Button from '../ui/Button';
import { 
  X, 
  AlertTriangle, 
  FileText, 
  Info,
  XCircle,
  Download
} from 'lucide-react';

interface ErrorDetail {
  fila: number;
  columna: string;
  valor: string;
  mensaje: string;
  tipo: 'validacion' | 'duplicado' | 'error_db' | 'formato';
  sugerencia?: string;
  codigoError?: string;
  datosOriginales?: Record<string, unknown>;
  campoEspecifico?: string;
  valorEsperado?: string;
  valorRecibido?: string;
}

interface ErrorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  errores: ErrorDetail[];
  tipoImportacion: string;
  onDownloadReport?: () => void;
}

const ErrorDetailsModal: React.FC<ErrorDetailsModalProps> = ({
  isOpen,
  onClose,
  errores,
  tipoImportacion,
  onDownloadReport
}) => {
  if (!isOpen) return null;

  const getErrorIcon = (tipo: string) => {
    switch (tipo) {
      case 'duplicado':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'validacion':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error_db':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'formato':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getErrorColor = (tipo: string) => {
    switch (tipo) {
      case 'duplicado':
        return 'border-orange-200 bg-orange-50';
      case 'validacion':
        return 'border-red-200 bg-red-50';
      case 'error_db':
        return 'border-red-200 bg-red-50';
      case 'formato':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'duplicado':
        return 'bg-orange-100 text-orange-800';
      case 'validacion':
        return 'bg-red-100 text-red-800';
      case 'error_db':
        return 'bg-red-100 text-red-800';
      case 'formato':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalles de Errores - {tipoImportacion.charAt(0).toUpperCase() + tipoImportacion.slice(1)}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{errores.length}</div>
              <div className="text-sm text-gray-500">Total Errores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {errores.filter(e => e.tipo === 'validacion').length}
              </div>
              <div className="text-sm text-gray-500">Validación</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {errores.filter(e => e.tipo === 'duplicado').length}
              </div>
              <div className="text-sm text-gray-500">Duplicados</div>
            </div>
          </div>

          {/* Lista de errores */}
          <div className="space-y-3">
            {errores.map((error, index) => (
              <Card key={index} className={getErrorColor(error.tipo)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {getErrorIcon(error.tipo)}
                    <div className="flex-1 space-y-2">
                      {/* Header del error */}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={getBadgeColor(error.tipo)}>
                          Fila {error.fila}
                        </Badge>
                        <Badge variant="outline">
                          {error.columna}
                        </Badge>
                        <span className="text-sm font-medium text-gray-700">
                          {error.tipo.charAt(0).toUpperCase() + error.tipo.slice(1)}
                        </span>
                      </div>

                      <div>
                        {error.mensaje}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {error.valorRecibido && (
                          <div>
                            <span className="font-medium text-gray-600">Valor recibido:</span>
                            <span className="ml-2 text-red-600 font-mono bg-red-50 px-2 py-1 rounded">
                              {error.valorRecibido}
                            </span>
                          </div>
                        )}
                        
                        {error.valorEsperado && (
                          <div>
                            <span className="font-medium text-gray-600">Valor esperado:</span>
                            <span className="ml-2 text-green-600 font-mono bg-green-50 px-2 py-1 rounded">
                              {error.valorEsperado}
                            </span>
                          </div>
                        )}

                        {error.campoEspecifico && (
                          <div>
                            <span className="font-medium text-gray-600">Campo:</span>
                            <span className="ml-2 text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                              {error.campoEspecifico}
                            </span>
                          </div>
                        )}

                        {error.codigoError && (
                          <div>
                            <span className="font-medium text-gray-600">Código:</span>
                            <span className="ml-2 text-purple-600 font-mono bg-purple-50 px-2 py-1 rounded">
                              {error.codigoError}
                            </span>
                          </div>
                        )}
                      </div>

                      {error.sugerencia && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                              <span className="font-medium">Sugerencia:</span> {String(error.sugerencia)}
                            </div>
                          </div>
                        </div>
                      )}

                      {error.datosOriginales && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
                            Ver datos originales de la fila
                          </summary>
                          <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                            <pre className="text-xs text-gray-700 overflow-x-auto">
                              {JSON.stringify(error.datosOriginales, null, 2)}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Acciones */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {errores.length} error{errores.length !== 1 ? 'es' : ''} encontrado{errores.length !== 1 ? 's' : ''}
            </div>
            <div className="flex gap-2">
              {onDownloadReport && (
                <Button
                  onClick={onDownloadReport}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar Reporte
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorDetailsModal; 