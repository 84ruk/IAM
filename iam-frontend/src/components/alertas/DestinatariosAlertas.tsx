import React, { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Destinatario, TipoDestinatarioAlerta } from '../../types/alertas';

interface DestinatariosAlertasProps {
  destinatarios: Destinatario[];
  onAgregar: (destinatario: Omit<Destinatario, 'id'>) => void;
  onEliminar: (destinatarioId: number) => void;
  disabled?: boolean;
  configuracionAlertaId: number;
}

export const DestinatariosAlertas: React.FC<DestinatariosAlertasProps> = ({
  destinatarios,
  onAgregar,
  onEliminar,
  disabled = false,
  configuracionAlertaId,
}) => {
  const [nuevoDestinatario, setNuevoDestinatario] = useState<Omit<Destinatario, 'id'>>({
    nombre: '',
    email: '',
    telefono: '',
    tipo: TipoDestinatarioAlerta.EMAIL,
    configuracionAlertaId,
  });
  const [mostrarFormulario, setMostrarFormulario] = React.useState(false);

  React.useEffect(() => {
    setNuevoDestinatario((prev) => ({
      ...prev,
      configuracionAlertaId,
    }));
  }, [configuracionAlertaId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAgregar(nuevoDestinatario);
    setNuevoDestinatario({
      nombre: '',
      email: '',
      telefono: '',
      tipo: TipoDestinatarioAlerta.EMAIL,
      configuracionAlertaId,
    });
    setMostrarFormulario(false);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium">Destinatarios de Alertas</h3>
          {!mostrarFormulario && (
            <button
              onClick={() => setMostrarFormulario(true)}
              disabled={disabled}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar Destinatario
            </button>
          )}
        </div>

        {mostrarFormulario && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={nuevoDestinatario.nombre}
                  onChange={(e) =>
                    setNuevoDestinatario({
                      ...nuevoDestinatario,
                      nombre: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={nuevoDestinatario.email}
                  onChange={(e) =>
                    setNuevoDestinatario({
                      ...nuevoDestinatario,
                      email: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={nuevoDestinatario.telefono}
                  onChange={(e) =>
                    setNuevoDestinatario({
                      ...nuevoDestinatario,
                      telefono: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Severidad
                </label>
                <select
                  value={nuevoDestinatario.tipo}
                  onChange={(e) =>
                    setNuevoDestinatario({
                      ...nuevoDestinatario,
                      tipo: e.target.value as TipoDestinatarioAlerta,
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value={TipoDestinatarioAlerta.EMAIL}>Email</option>
                  <option value={TipoDestinatarioAlerta.SMS}>SMS</option>
                  <option value={TipoDestinatarioAlerta.AMBOS}>Ambos</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Guardar
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-200">
          {destinatarios.map((destinatario) => (
            <div
              key={destinatario.id}
              className="py-4 flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {destinatario.nombre}
                </p>
                <p className="text-sm text-gray-500">
                  {destinatario.email} {destinatario.telefono && `• ${destinatario.telefono}`}
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  {
                    EMAIL: 'bg-blue-100 text-blue-800',
                    SMS: 'bg-green-100 text-green-800',
                    AMBOS: 'bg-purple-100 text-purple-800',
                  }[destinatario.tipo] || 'bg-gray-100 text-gray-800'
                }`}>
                  {destinatario.tipo}
                </span>
              </div>
              <button
                onClick={() => destinatario.id && onEliminar(destinatario.id)}
                disabled={disabled}
                className={`inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
