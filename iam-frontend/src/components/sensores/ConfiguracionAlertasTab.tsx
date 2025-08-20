import React from 'react';
import { TabPanel } from '@mui/lab';
import { Box, Paper, Typography } from '@mui/material';
import { ConfiguracionAlertas } from './ConfiguracionAlertas';

interface ConfiguracionAlertasTabProps {
  value: string;
  sensorId: number;
}

export const ConfiguracionAlertasTab: React.FC<ConfiguracionAlertasTabProps> = ({ value, sensorId }) => {
  return (
    <TabPanel value={value}>
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Configuración Avanzada de Alertas</Typography>
          <ConfiguracionAlertas sensorId={sensorId} />
        </Paper>
      </Box>
    </TabPanel>
  );
};

