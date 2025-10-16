import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const TasksPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tasks
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1">
          Task management interface will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default TasksPage;
