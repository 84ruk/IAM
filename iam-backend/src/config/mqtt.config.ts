import { registerAs } from '@nestjs/config';

export default registerAs('mqtt', () => {
  const host = process.env.MQTT_HOST || 'localhost';
  const port = process.env.MQTT_PORT ? parseInt(process.env.MQTT_PORT, 10) : 1883;
  const username = process.env.MQTT_USERNAME || '';
  const password = process.env.MQTT_PASSWORD || '';
  const enabled = process.env.MQTT_ENABLED === 'true';

  // Nuevas configuraciones para EMQX
  const useTls = process.env.MQTT_USE_TLS === 'true';
  const appId = process.env.MQTT_APP_ID || '';
  const appSecret = process.env.MQTT_APP_SECRET || '';
  const apiEndpoint = process.env.MQTT_API_ENDPOINT || '';

  // Solo construir URL si está habilitado y configurado
  let url = '';
  if (enabled && host && port) {
    const protocol = useTls ? 'mqtts' : 'mqtt';
    const auth = username && password ? `${username}:${password}@` : '';
    url = `${protocol}://${auth}${host}:${port}`;
  }

  return {
    enabled,
    host,
    port,
    username,
    password,
    url,
    useTls,
    appId,
    appSecret,
    apiEndpoint,
    // Configuraciones adicionales
    reconnectPeriod: process.env.MQTT_RECONNECT_PERIOD ? parseInt(process.env.MQTT_RECONNECT_PERIOD, 10) : 5000,
    connectTimeout: process.env.MQTT_CONNECT_TIMEOUT ? parseInt(process.env.MQTT_CONNECT_TIMEOUT, 10) : 10000,
    maxReconnectAttempts: process.env.MQTT_MAX_RECONNECT_ATTEMPTS ? parseInt(process.env.MQTT_MAX_RECONNECT_ATTEMPTS, 10) : 5,
  };
});