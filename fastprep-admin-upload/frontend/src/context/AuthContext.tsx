import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, LoginRequest, AuthContextType } from '../types';
import apiClient from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        isAuthenticated: !!action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await apiClient.getProfile();
          if (response.data) {
            dispatch({ type: 'SET_USER', payload: response.data });
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            dispatch({ type: 'SET_USER', payload: null });
          }
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          dispatch({ type: 'SET_USER', payload: null });
        }
      } else {
        dispatch({ type: 'SET_USER', payload: null });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await apiClient.login(credentials);
      
      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const value: AuthContextType = {
    user: state.user,
    login,
    logout,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
