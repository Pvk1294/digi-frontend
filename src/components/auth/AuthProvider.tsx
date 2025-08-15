// src/components/auth/AuthProvider.tsx

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials } from '@/types/auth';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface AuthContextType extends AuthState {
  token: string | null;
  is2faRequired: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  verify2fa: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'INIT'; payload: { user: User | null; token: string | null } }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_2FA_REQUIRED' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' };

type AuthReducerState = AuthState & { token: string | null; is2faRequired: boolean };

const authReducer = (state: AuthReducerState, action: AuthAction): AuthReducerState => {
  switch (action.type) {
    case 'INIT':
      return { ...state, isAuthenticated: !!action.payload.user, user: action.payload.user, token: action.payload.token, isLoading: false };
    case 'LOGIN_START':
      return { ...state, isLoading: true, user: null, token: null, isAuthenticated: false, is2faRequired: false };
    
    // THIS IS THE CRITICAL CASE:
    // We are waiting for the 2FA code. The user is NOT authenticated yet.
    case 'LOGIN_2FA_REQUIRED':
      return { ...state, isLoading: false, isAuthenticated: false, is2faRequired: true };
      
    // This case only runs after a token is successfully received (from either login step).
    case 'LOGIN_SUCCESS':
      return { ...state, user: action.payload.user, isAuthenticated: true, isLoading: false, token: action.payload.token, is2faRequired: false };
      
    case 'LOGIN_FAILURE':
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, isLoading: false, token: null, is2faRequired: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
    is2faRequired: false,
  });

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    const savedUser = sessionStorage.getItem('user');
    let user: User | null = null;
    if (savedUser) user = JSON.parse(savedUser);
    
    dispatch({ type: 'INIT', payload: { user, token } });
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const res = await api.post('/auth/login', { email: credentials.email, password: credentials.password });
      const data = res.data;

      if (data.requires2fa) {
        dispatch({ type: 'LOGIN_2FA_REQUIRED' });
      } else if (data.token) {
        sessionStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.token } });
        toast({ title: "Login Successful" });
      } else {
        throw new Error(data.message || "Invalid login response.");
      }
    } catch (err: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      const errorMessage = err.response?.data?.message || err.message || "An error occurred.";
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      throw err;
    }
  };
  
  const verify2fa = async (token: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const res = await api.post('/auth/login/verify-2fa', { token });
      const data = res.data;

      if (data.token) {
        sessionStorage.setItem('auth_token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.token } });
        toast({ title: "Login Successful" });
      } else {
        throw new Error(data.message || "Invalid 2FA token.");
      }
    } catch (err: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      const errorMessage = err.response?.data?.message || "Invalid 2FA token.";
      toast({ title: "Verification Failed", description: errorMessage, variant: "destructive" });
      throw err;
    }
  };

  const logout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
    toast({ title: "Logged Out" });
    window.location.reload();
  };

  const value = { ...state, login, logout, verify2fa };

  return (
    <AuthContext.Provider value={value}>
      {!state.isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};