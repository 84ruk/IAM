import axios from 'axios';
import { ConfiguracionAlerta, Destinatario } from '../types/alertas';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const AlertasService = {
  // Obtener configuración de notificaciones
  async obtenerConfiguracion(sensorId: number): Promise<ConfiguracionAlerta> {
    const response = await axios.get(
      `${API_URL}/sensores/alertas/config/${sensorId}/notificaciones`
    );
    return response.data;
  },

  // Actualizar configuración
  async actualizarConfiguracion(
    sensorId: number,
    config: Partial<ConfiguracionAlerta>
  ): Promise<ConfiguracionAlerta> {
    const response = await axios.put(
      `${API_URL}/sensores/alertas/config/${sensorId}/notificaciones`,
      config
    );
    return response.data;
  },

  // Agregar destinatario
  async agregarDestinatario(
    sensorId: number,
    destinatario: Omit<Destinatario, 'id'>
  ): Promise<Destinatario> {
    const response = await axios.post(
      `${API_URL}/sensores/alertas/config/${sensorId}/destinatarios`,
      destinatario
    );
    return response.data;
  },

  // Eliminar destinatario
  async eliminarDestinatario(
    sensorId: number,
    destinatarioId: number
  ): Promise<void> {
    await axios.delete(
      `${API_URL}/sensores/alertas/config/${sensorId}/destinatarios/${destinatarioId}`
    );
  }
};
