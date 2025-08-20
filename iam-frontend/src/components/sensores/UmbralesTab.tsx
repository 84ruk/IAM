import React from 'react';
import { TabPanel } from '@mui/lab';
import { Box, Paper, Typography } from '@mui/material';
import { ConfiguracionUmbrales } from './ConfiguracionUmbrales';

interface UmbralesTabProps {
  value: string;
  sensorId: number;
  sensorTipo: string;
}

export const UmbralesTab: React.FC<UmbralesTabProps> = ({ value, sensorId, sensorTipo }) => {
  return (
    <TabPanel value={value}>
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Configuración de Umbrales</Typography>
          <ConfiguracionUmbrales sensorId={sensorId} sensorTipo={sensorTipo} onConfiguracionGuardada={() => {}} />
        </Paper>
      </Box>
    </TabPanel>
  );
};

