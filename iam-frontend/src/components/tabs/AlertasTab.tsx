import React from 'react';
import { TabPanel } from '@mui/lab';
import { Box, Paper } from '@mui/material';
import { AlertasSensor } from '../sensores/AlertasSensor';

interface AlertasTabProps {
  sensorId: number;
  sensorNombre?: string;
  sensorTipo?: string;
  value: string;
}

export const AlertasTab: React.FC<AlertasTabProps> = ({
  sensorId,
  sensorNombre = '',
  sensorTipo = '',
  value,
}) => {
  return (
    <TabPanel value={value}>
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 2 }}>
          <AlertasSensor sensorId={sensorId} sensorNombre={sensorNombre} sensorTipo={sensorTipo} />
        </Paper>
      </Box>
    </TabPanel>
  );
};
