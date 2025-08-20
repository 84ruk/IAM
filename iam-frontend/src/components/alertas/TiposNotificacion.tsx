import React from 'react';
import { Switch } from '@headlessui/react';

interface TiposNotificacionProps {
  config: {
    email: boolean;
    sms: boolean;
    webSocket: boolean;
    push?: boolean;
  };
  onChange: (config: TiposNotificacionProps['config']) => void;
  disabled?: boolean;
}

export const TiposNotificacion: React.FC<TiposNotificacionProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  const handleChange = (tipo: string) => {
    onChange({
      ...config,
      [tipo]: !config[tipo as keyof typeof config],
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4">
        Tipos de Notificación
      </h3>
      <div className="space-y-4">
        {[
          { key: 'email', label: 'Email' },
          { key: 'sms', label: 'SMS' },
          { key: 'webSocket', label: 'WebSocket' },
          { key: 'push', label: 'Push' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <Switch
              checked={config[key as keyof typeof config] || false}
              onChange={() => handleChange(key)}
              disabled={disabled}
              className={`${
                config[key as keyof typeof config] ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <span
                className={`${
                  config[key as keyof typeof config] ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </Switch>
          </div>
        ))}
      </div>
    </div>
  );
};
