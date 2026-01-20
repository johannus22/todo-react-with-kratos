import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as ory from '../services/ory';
import type { OryIdentity, OrySession } from '../services/ory';

interface AuthContextType {
  user: OryIdentity | null;
  session: OrySession | null;
  loading: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<OryIdentity | null>(null);
  const [session, setSession] = useState<OrySession | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    setLoading(true);
    try {
      const response = await ory.whoami();
      if (response.session) {
        setSession(response.session);
        setUser(response.session.identity);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const logout = async () => {
    try {
      // Clear local state first
      setSession(null);
      setUser(null);

      // Perform logout via Ory
      await ory.logout('/login');
    } catch (error) {
      // Fallback: redirect to login if logout fails
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, checkSession, logout }}>
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
