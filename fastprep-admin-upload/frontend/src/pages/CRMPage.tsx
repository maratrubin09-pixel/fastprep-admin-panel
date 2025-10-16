import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const CRMPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        CRM
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Customer relationship management interface will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default CRMPage;
