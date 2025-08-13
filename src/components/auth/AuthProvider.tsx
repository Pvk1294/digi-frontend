import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials } from '@/types/auth';
import { toast } from '@/hooks/use-toast';
import api from '@/lib/api'; // <-- IMPORT THE NEW API SERVICE

interface AuthContextType extends AuthState {
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'INIT'; payload: { user: User | null; token: string | null } }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' };

const authReducer = (state: AuthState & { token: string | null }, action: AuthAction) => {
  switch (action.type) {
    case 'INIT':
      return { ...state, isAuthenticated: !!action.payload.user, user: action.payload.user, token: action.payload.token, isLoading: false };
    case 'LOGIN_START':
      return { ...state, isLoading: true, user: null, token: null, isAuthenticated: false };
    case 'LOGIN_SUCCESS':
      return { user: action.payload.user, isAuthenticated: true, isLoading: false, token: action.payload.token };
    case 'LOGIN_FAILURE':
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false, token: null };
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
  });

  useEffect(() => {
    // --- CHANGE TO sessionStorage ---
    const token = sessionStorage.getItem('auth_token');
    const savedUser = sessionStorage.getItem('user');
    let user: User | null = null;
    
    if (savedUser) {
      try {
        user = JSON.parse(savedUser);
      } catch (error) {
        sessionStorage.clear();
        user = null;
      }
    }
    
    dispatch({ type: 'INIT', payload: { user, token } });
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      // --- USE THE NEW 'api' SERVICE ---
      const res = await api.post('/auth/login', credentials);
      const data = res.data;
      
      // The backend response might not have a 'success' field, check for token instead
      if (!data.token) {
        throw new Error(data.message || "Invalid credentials.");
      }
      
      // --- CHANGE TO sessionStorage ---
      sessionStorage.setItem('auth_token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.token } });
      
      toast({ title: "Login Successful" });
    } catch (err: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      const errorMessage = err.response?.data?.message || err.message || "An error occurred.";
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      throw err;
    }
  };

  const logout = () => {
    // --- CHANGE TO sessionStorage ---
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
    toast({ title: "Logged Out" });
    // Reloading is a simple way to ensure all component states are cleared
    window.location.reload();
  };

  const value = { ...state, login, logout };

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
