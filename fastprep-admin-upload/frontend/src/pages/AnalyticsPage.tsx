import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const AnalyticsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Analytics
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Analytics and reports interface will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AnalyticsPage;
