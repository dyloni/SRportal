import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { AdminRole } from '../types';
import { supabase } from '../utils/supabase';

interface AuthUser {
  id: number;
  firstName: string;
  surname: string;
  email?: string;
  profilePictureUrl?: string;
  type: 'agent' | 'admin';
  role?: AdminRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  updateUser: (updatedData: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const signInAnonymously = async () => {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Error signing in to Supabase:', error);
      } else {
        console.log('Signed in to Supabase:', data);
      }
    };

    signInAnonymously();
  }, []);

  const login = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updatedData: Partial<AuthUser>) => {
    setUser(prevUser => (prevUser ? { ...prevUser, ...updatedData } : null));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
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