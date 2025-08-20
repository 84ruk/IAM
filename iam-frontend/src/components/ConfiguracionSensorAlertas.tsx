import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Alert, Snackbar } from '@mui/material';
import { TiposNotificacion } from './TiposNotificacion';
import { DestinatariosAlertas } from './DestinatariosAlertas';
import { AlertasService } from '../services/alertas.service';
import { ConfiguracionAlerta, Destinatario, NotificacionConfig } from '../types/alertas';

interface ConfiguracionSensorAlertasProps {
  sensorId: number;
}

export const ConfiguracionSensorAlertas: React.FC<ConfiguracionSensorAlertasProps> = ({
  sensorId,
}) => {
  const [configuracion, setConfiguracion] = useState<ConfiguracionAlerta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mostrarNotificacion = useCallback((severity: 'success' | 'error', message: string) => {
    setError(null);
    setSuccess(null);
    if (severity === 'error') {
      setError(message);
    } else {
      setSuccess(message);
    }
  }, []);

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
  }, [sensorId, mostrarNotificacion]);

  useEffect(() => {
    cargarConfiguracion();
  }, [sensorId, cargarConfiguracion]);

  const handleNotificacionChange = async (config: NotificacionConfig) => {
    if (!configuracion) return;
    try {
      const actualizado = await AlertasService.actualizarConfiguracion(sensorId, {
        ...configuracion,
        configuracionNotificacion: config,
      });
      setConfiguracion(actualizado);
      setSuccess('Configuración actualizada correctamente');
    } catch (err) {
      setError('Error al actualizar la configuración');
      console.error(err);
    }
  };

  const handleAgregarDestinatario = async (destinatario: Omit<Destinatario, 'id'>) => {
    try {
      const nuevoDestinatario = await AlertasService.agregarDestinatario(sensorId, destinatario);
      if (configuracion) {
        setConfiguracion({
          ...configuracion,
          destinatarios: [...configuracion.destinatarios, nuevoDestinatario],
        });
      }
      setSuccess('Destinatario agregado correctamente');
    } catch (err) {
      setError('Error al agregar el destinatario');
      console.error(err);
    }
  };

  const handleEliminarDestinatario = async (destinatarioId: number) => {
    try {
      await AlertasService.eliminarDestinatario(sensorId, destinatarioId);
      if (configuracion) {
        setConfiguracion({
          ...configuracion,
          destinatarios: configuracion.destinatarios.filter(d => d.id !== destinatarioId),
        });
      }
      setSuccess('Destinatario eliminado correctamente');
    } catch (err) {
      setError('Error al eliminar el destinatario');
      console.error(err);
    }
  };

  if (loading) {
    return <Typography>Cargando configuración...</Typography>;
  }

  if (!configuracion) {
    return <Typography>No se encontró la configuración</Typography>;
  }

  return (
    <Box>
      <Box mb={4}>
        <TiposNotificacion
          config={configuracion.configuracionNotificacion}
          onChange={handleNotificacionChange}
        />
      </Box>

      <Box mb={4}>
        <DestinatariosAlertas
          destinatarios={configuracion.destinatarios}
          onAgregar={handleAgregarDestinatario}
          onEliminar={handleEliminarDestinatario}
          configuracionAlertaId={configuracion.id}
        />
      </Box>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};
