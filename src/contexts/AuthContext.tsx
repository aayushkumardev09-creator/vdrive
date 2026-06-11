import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check local storage on initial load
    const storedAuth = localStorage.getItem('vdrive_admin_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setIsReady(true);
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('vdrive_admin_auth', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('vdrive_admin_auth');
  };

  if (!isReady) {
    return null; // prevent flash of login screen if already authed
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
