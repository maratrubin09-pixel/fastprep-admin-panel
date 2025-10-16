import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: {
    module: string;
    action: string;
  };
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermissions 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check permissions if required
  if (requiredPermissions && user) {
    const { module, action } = requiredPermissions;
    const permissions = user.role?.permissions;
    
    if (!permissions) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    // Parse permissions if it's a string (JSON)
    const parsedPermissions = typeof permissions === 'string' 
      ? JSON.parse(permissions) 
      : permissions;
    
    if (!parsedPermissions[module]?.[action]) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
