import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  Business,
  Assignment,
  Message,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { DashboardMetrics } from '../types';
import apiClient from '../services/api';

const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await apiClient.getDashboardMetrics();
        if (response.data) {
          setMetrics(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const metricCards = [
    {
      title: 'Total Customers',
      value: metrics?.totalCustomers || 0,
      icon: <People />,
      color: '#1976d2',
    },
    {
      title: 'Total Leads',
      value: metrics?.totalLeads || 0,
      icon: <Business />,
      color: '#388e3c',
    },
    {
      title: 'Total Tasks',
      value: metrics?.totalTasks || 0,
      icon: <Assignment />,
      color: '#f57c00',
    },
    {
      title: 'Total Messages',
      value: metrics?.totalMessages || 0,
      icon: <Message />,
      color: '#7b1fa2',
    },
    {
      title: 'New Leads Today',
      value: metrics?.newLeadsToday || 0,
      icon: <TrendingUp />,
      color: '#2e7d32',
    },
    {
      title: 'Completed Tasks Today',
      value: metrics?.completedTasksToday || 0,
      icon: <TrendingDown />,
      color: '#d32f2f',
    },
    {
      title: 'Unread Messages',
      value: metrics?.unreadMessages || 0,
      icon: <Message />,
      color: '#ed6c02',
    },
    {
      title: 'Conversion Rate',
      value: `${metrics?.conversionRate || 0}%`,
      icon: <TrendingUp />,
      color: '#1976d2',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome to Fast Prep USA Admin Panel
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {metricCards.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: card.color,
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box sx={{ color: 'white' }}>{card.icon}</Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activity feed will be implemented here
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quick action buttons will be implemented here
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
