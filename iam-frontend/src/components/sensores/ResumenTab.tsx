import { TabPanel } from '@mui/lab';
import { Box, Paper, Typography } from '@mui/material';

interface ResumenTabProps {
  value: string;
  sensorId: number;
}

export const ResumenTab: React.FC<ResumenTabProps> = ({ value, sensorId }) => {
  // Aquí podrías hacer fetch de datos básicos del sensor si lo deseas
  return (
    <TabPanel value={value}>
      <Box sx={{ p: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Resumen del Sensor</Typography>
          <Typography>ID: {sensorId}</Typography>
          {/* Agrega aquí más información relevante del sensor */}
        </Paper>
      </Box>
    </TabPanel>
  );
};

