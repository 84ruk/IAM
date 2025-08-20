import React from 'react';
import {
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Typography,
  Box,
} from '@mui/material';
import { NotificacionConfig } from '../types/alertas';

interface TiposNotificacionProps {
  config: NotificacionConfig;
  onChange: (config: NotificacionConfig) => void;
  disabled?: boolean;
}

export const TiposNotificacion: React.FC<TiposNotificacionProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  const handleChange = (tipo: keyof NotificacionConfig) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({
      ...config,
      [tipo]: event.target.checked,
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Tipos de Notificación
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <FormControlLabel
            control={
              <Switch
                checked={config.email}
                onChange={handleChange('email')}
                disabled={disabled}
              />
            }
            label="Email"
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.sms}
                onChange={handleChange('sms')}
                disabled={disabled}
              />
            }
            label="SMS"
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.webSocket}
                onChange={handleChange('webSocket')}
                disabled={disabled}
              />
            }
            label="WebSocket"
          />
          <FormControlLabel
            control={
              <Switch
                checked={config.push || false}
                onChange={handleChange('push')}
                disabled={disabled}
              />
            }
            label="Push"
          />
        </Box>
      </CardContent>
    </Card>
  );
};
