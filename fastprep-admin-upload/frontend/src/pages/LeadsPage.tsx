import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const LeadsPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Leads
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Leads management interface will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default LeadsPage;
