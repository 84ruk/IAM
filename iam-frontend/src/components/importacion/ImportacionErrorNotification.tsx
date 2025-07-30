'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Download, 
  Info,
  FileText,
  Eye,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { CorreccionImportacion } from '@/types/importacion';

interface ImportacionErrorNotificationProps {
  hasErrors: boolean;
  errorCount: number;
  successCount: number;
  errorFile?: string;
  message: string;
  correcciones?: CorreccionImportacion[];
  onDownloadReport?: () => void;
  onViewDetails?: () => void;
}

const ImportacionErrorNotification: React.FC<ImportacionErrorNotificationProps> = ({
  hasErrors,
  errorCount,
  successCount,
  errorFile,
  message,
  correcciones = [],
  onDownloadReport,
  onViewDetails
}) => {
  const hasCorrecciones = correcciones && correcciones.length > 0;

  if (!hasErrors) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Importación Exitosa</AlertTitle>
        <AlertDescription className="text-green-700">
          {message}
          {hasCorrecciones && (
            <div className="mt-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                Se aplicaron {correcciones.length} correcciones automáticas
              </span>
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // const isPartialSuccess = successCount > 0 && errorCount > 0;
  const isCompleteFailure = successCount === 0 && errorCount > 0;

  return (
    <Card className={`border-2 ${
      isCompleteFailure 
        ? 'border-red-200 bg-red-50' 
        : 'border-orange-200 bg-orange-50'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 ${
          isCompleteFailure ? 'text-red-800' : 'text-orange-800'
        }`}>
          {isCompleteFailure ? (
            <XCircle className="h-5 w-5 text-red-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          )}
          {isCompleteFailure ? 'Importación Falló' : 'Importación Parcial'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen de estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <div className="text-sm text-gray-600">Exitosos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-gray-600">Errores</div>
          </div>
          {hasCorrecciones && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{correcciones.length}</div>
              <div className="text-sm text-gray-600">Correcciones</div>
            </div>
          )}
        </div>

        {/* Sección de correcciones automáticas */}
        {hasCorrecciones && (
          <Alert className="border-blue-200 bg-blue-50">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Correcciones Automáticas Aplicadas</AlertTitle>
            <AlertDescription className="text-blue-700">
              <div className="mt-2 space-y-2">
                <p className="text-sm">
                  Se aplicaron <strong>{correcciones.length} correcciones automáticas</strong> durante la importación:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {correcciones.slice(0, 8).map((correccion, index) => (
                    <div key={index} className="text-xs bg-blue-100 p-2 rounded border border-blue-200">
                      <div className="font-medium text-blue-800">
                        Fila {correccion.fila} - {correccion.campo}
                      </div>
                      <div className="text-blue-700">
                        <span className="line-through">{String(correccion.valorOriginal)}</span>
                        <span className="mx-1">→</span>
                        <span className="font-medium">{String(correccion.valorCorregido)}</span>
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {correccion.tipo} ({correccion.confianza}%)
                      </Badge>
                    </div>
                  ))}
                </div>
                {correcciones.length > 8 && (
                  <p className="text-xs text-blue-600">
                    ... y {correcciones.length - 8} correcciones más
                  </p>
                )}
                <div className="text-xs text-blue-600 mt-2">
                  <strong>Tipos de correcciones:</strong>
                  <ul className="list-disc list-inside mt-1">
                    <li><strong>formato:</strong> Conversión de tipos de datos</li>
                    <li><strong>normalizacion:</strong> Mejora de formato y capitalización</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Mensaje principal */}
        <Alert className={`${
          isCompleteFailure 
            ? 'border-red-200 bg-red-100' 
            : 'border-orange-200 bg-orange-100'
        }`}>
          <Info className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-gray-700">
            {message}
          </AlertDescription>
        </Alert>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-2">
          {errorFile && onDownloadReport && (
            <Button
              onClick={onDownloadReport}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Reporte de Errores
            </Button>
          )}
          
          {onViewDetails && (
            <Button
              onClick={onViewDetails}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver Detalles
            </Button>
          )}
        </div>

        {/* Información adicional */}
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Se generó un archivo de errores con detalles específicos</span>
          </div>
          {hasCorrecciones && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Las correcciones automáticas mejoraron la calidad de los datos</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>Revise el reporte para corregir los errores e intentar nuevamente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportacionErrorNotification; 