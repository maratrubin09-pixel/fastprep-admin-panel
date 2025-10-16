import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import CRMPage from './pages/CRMPage';
import LeadsPage from './pages/LeadsPage';
import TasksPage from './pages/TasksPage';
import MessagesPage from './pages/MessagesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import MessengerQRPage from './pages/MessengerQRPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/users" element={<ProtectedRoute requiredPermissions={{ module: 'users', action: 'read' }}><UsersPage /></ProtectedRoute>} />
                      <Route path="/crm" element={<ProtectedRoute requiredPermissions={{ module: 'crm', action: 'read' }}><CRMPage /></ProtectedRoute>} />
                      <Route path="/leads" element={<ProtectedRoute requiredPermissions={{ module: 'crm', action: 'read' }}><LeadsPage /></ProtectedRoute>} />
                      <Route path="/tasks" element={<ProtectedRoute requiredPermissions={{ module: 'tasks', action: 'read' }}><TasksPage /></ProtectedRoute>} />
                      <Route path="/messages" element={<ProtectedRoute requiredPermissions={{ module: 'messages', action: 'read' }}><MessagesPage /></ProtectedRoute>} />
                      <Route path="/analytics" element={<ProtectedRoute requiredPermissions={{ module: 'analytics', action: 'read' }}><AnalyticsPage /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute requiredPermissions={{ module: 'settings', action: 'read' }}><SettingsPage /></ProtectedRoute>} />
                      <Route path="/messengers" element={<ProtectedRoute requiredPermissions={{ module: 'messages', action: 'read' }}><MessengerQRPage /></ProtectedRoute>} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
