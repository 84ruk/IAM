import React from 'react';
import { TabPanel } from '@mui/lab';
import { Box, Paper } from '@mui/material';
import { ConfiguracionSensorAlertas } from '../alertas/ConfiguracionSensorAlertas';

interface ConfiguracionAlertasTabProps {
  sensorId: number;
  value: string;
}

export const ConfiguracionAlertasTab: React.FC<ConfiguracionAlertasTabProps> = ({
  sensorId,
  value,
}) => {
  return (
    <TabPanel value={value}>
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 2 }}>
          <ConfiguracionSensorAlertas sensorId={sensorId} />
        </Paper>
      </Box>
    </TabPanel>
  );
};
