import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const UsersPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Users Management
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Users management interface will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default UsersPage;
