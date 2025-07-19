import { registerAs } from '@nestjs/config';

export default registerAs('mqtt', () => {
  const host = process.env.MQTT_HOST || 'localhost';
  const port = process.env.MQTT_PORT ? parseInt(process.env.MQTT_PORT, 10) : 1883;
  const username = process.env.MQTT_USERNAME || '';
  const password = process.env.MQTT_PASSWORD || '';
  const enabled = process.env.MQTT_ENABLED === 'true';

  // Solo construir URL si está habilitado y configurado
  let url = '';
  if (enabled && host && port) {
    url = username && password
      ? `mqtt://${username}:${password}@${host}:${port}`
      : `mqtt://${host}:${port}`;
  }

  return {
    enabled,
    host,
    port,
    username,
    password,
    url,
    // Configuraciones adicionales
    reconnectPeriod: process.env.MQTT_RECONNECT_PERIOD ? parseInt(process.env.MQTT_RECONNECT_PERIOD, 10) : 5000,
    connectTimeout: process.env.MQTT_CONNECT_TIMEOUT ? parseInt(process.env.MQTT_CONNECT_TIMEOUT, 10) : 10000,
    maxReconnectAttempts: process.env.MQTT_MAX_RECONNECT_ATTEMPTS ? parseInt(process.env.MQTT_MAX_RECONNECT_ATTEMPTS, 10) : 5,
  };
});