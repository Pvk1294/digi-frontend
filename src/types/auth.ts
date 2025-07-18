export interface User {
  id: string;
  email: string;
  role: 'crm_manager' | 'super_admin';
  name: string;
  lastLogin?: string;
  ipAddress?: string;
}

export interface LoginActivity {
  id: string;
  userId: string;
  email: string;
  ipAddress: string;
  location: string;
  timestamp: string;
  suspicious: boolean;
  userAgent: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  otp?: string;
  authenticatorCode?: string;
}