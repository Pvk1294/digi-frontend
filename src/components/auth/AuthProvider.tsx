import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials } from '@/types/auth'; // Ensure these types are defined correctly
import { toast } from '@/hooks/use-toast';
import { jwtDecode } from 'jwt-decode';
import { useAdAccounts } from '../providers/AdAccountProvider';

// 1. UPDATE THE CONTEXT TYPE TO INCLUDE THE TOKEN
interface AuthContextType extends AuthState {
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. UPDATE THE ACTIONS TO HANDLE THE TOKEN
type AuthAction =
  | { type: 'INIT'; payload: { user: User | null; token: string | null } }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' };

// 3. UPDATE THE REDUCER TO MANAGE THE TOKEN STATE
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
    isLoading: true, // Start as true to check localStorage
    token: null,
  });

  // This effect runs on page load to check for an existing session
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');
    let user: User | null = null;
    
    if (savedUser) {
      try {
        user = JSON.parse(savedUser);
      } catch (error) {
        // If parsing fails, clear storage
        localStorage.clear();
        user = null;
      }
    }
    
    dispatch({ type: 'INIT', payload: { user, token } });
  }, []);

  const login = async (credentials: LoginCredentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid credentials.");
      }
      
      // Save both the token and the user object
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Dispatch both to the state
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.token } });
      
      toast({ title: "Login Successful" });
    } catch (err: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast({ title: "Login Failed", description: err.message, variant: "destructive" });
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    dispatch({ type: 'LOGOUT' });
    toast({ title: "Logged Out" });
  };

  // The 'value' now correctly matches the AuthContextType
  const value = { ...state, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {/* Don't render the app until the token check is complete */}
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