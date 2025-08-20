import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Cog } from 'lucide-react';

interface ConfiguracionTabProps {
  configuracion: Record<string, unknown> | undefined;
}

export const ConfiguracionTab: React.FC<ConfiguracionTabProps> = ({ configuracion }) => {
  if (!configuracion) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cog className="w-5 h-5 text-gray-400" /> Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No hay configuración disponible para este sensor.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cog className="w-5 h-5 text-blue-600" /> Configuración General
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(configuracion).map(([key, value]) => (
            <div
              key={key}
              className="rounded-xl bg-white shadow-sm border border-gray-100 p-4 flex flex-col items-start justify-between min-h-[90px]"
            >
              <span className="font-medium text-gray-500 text-sm mb-2 break-words">
                {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </span>
              {typeof value === 'boolean' ? (
                <Badge className={value ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}>
                  {value ? 'Sí' : 'No'}
                </Badge>
              ) : (
                <span className="text-gray-900 font-bold text-lg break-all">{String(value)}</span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
