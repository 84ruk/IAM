import React, { useEffect, useState, useCallback } from 'react';
import { AlertasService } from '../../services/alertas.service';
import { TiposNotificacion } from './TiposNotificacion';
import { DestinatariosAlertas } from './DestinatariosAlertas';
import { ConfiguracionAlerta, Destinatario, NotificacionConfig } from '../../types/alertas';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfiguracionSensorAlertasProps {
  sensorId: number;
}

export const ConfiguracionSensorAlertas: React.FC<ConfiguracionSensorAlertasProps> = ({
  sensorId,
}) => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionAlerta | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificacion, setNotificacion] = useState<{
    tipo: 'error' | 'success';
    mensaje: string;
  } | null>(null);

  const cargarConfiguracion = useCallback(async () => {
    try {
      setLoading(true);
      const config = await AlertasService.obtenerConfiguracion(sensorId);
      setConfiguracion(config);
    } catch (err) {
      mostrarNotificacion('error', 'Error al cargar la configuración');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sensorId]);

  useEffect(() => {
    cargarConfiguracion();
  }, [sensorId, cargarConfiguracion]);

  const mostrarNotificacion = (tipo: 'error' | 'success', mensaje: string) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 5000);
  };

  const handleNotificacionChange = async (config: NotificacionConfig) => {
    if (!configuracion) return;
    try {
      const actualizado = await AlertasService.actualizarConfiguracion(sensorId, {
        ...configuracion,
        configuracionNotificacion: config,
      });
      setConfiguracion(actualizado);
      mostrarNotificacion('success', 'Configuración actualizada correctamente');
    } catch (err) {
      mostrarNotificacion('error', 'Error al actualizar la configuración');
      console.error(err);
    }
  };

  const handleAgregarDestinatario = async (destinatario: Omit<Destinatario, 'id'>) => {
    try {
      const nuevoDestinatario = await AlertasService.agregarDestinatario(
        sensorId,
        destinatario
      );
      if (configuracion) {
        setConfiguracion({
          ...configuracion,
          destinatarios: [...configuracion.destinatarios, nuevoDestinatario],
        });
      }
      mostrarNotificacion('success', 'Destinatario agregado correctamente');
    } catch (err) {
      mostrarNotificacion('error', 'Error al agregar el destinatario');
      console.error(err);
    }
  };

  const handleEliminarDestinatario = async (destinatarioId: number) => {
    try {
      await AlertasService.eliminarDestinatario(sensorId, destinatarioId);
      if (configuracion) {
        setConfiguracion({
          ...configuracion,
          destinatarios: configuracion.destinatarios.filter(
            (d) => d.id !== destinatarioId
          ),
        });
      }
      mostrarNotificacion('success', 'Destinatario eliminado correctamente');
    } catch (err) {
      mostrarNotificacion('error', 'Error al eliminar el destinatario');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!configuracion) {
    return (
      <div className="text-center text-gray-500">
        No se encontró la configuración
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notificacion && (
        <div
          className={`rounded-md p-4 ${
            notificacion.tipo === 'error'
              ? 'bg-red-50 border border-red-200'
              : 'bg-green-50 border border-green-200'
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {notificacion.tipo === 'error' ? (
                <AlertTriangle className="h-5 w-5 text-red-400" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-medium ${
                  notificacion.tipo === 'error'
                    ? 'text-red-800'
                    : 'text-green-800'
                }`}
              >
                {notificacion.mensaje}
              </p>
            </div>
          </div>
        </div>
      )}

      <TiposNotificacion
        config={configuracion.configuracionNotificacion}
        onChange={handleNotificacionChange}
      />

      <DestinatariosAlertas
        destinatarios={configuracion.destinatarios}
        onAgregar={handleAgregarDestinatario}
        onEliminar={handleEliminarDestinatario}
        configuracionAlertaId={configuracion.id}
      />
    </div>
  );
};
