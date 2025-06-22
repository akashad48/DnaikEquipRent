
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const hardcodedUsers = [
  { email: 'akashad48@gmail.com', pass: 'Pass2123', name: 'Sujit' },
  { email: 'gorobadandnaik@gmail.com', pass: 'goroba123', name: 'Goroba Dandnaik' }
];

const USER_STORAGE_KEY = 'dandnaik-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    
    const foundUser = hardcodedUsers.find(u => u.email === email && u.pass === pass);
    
    if (foundUser) {
      const loggedInUser: User = { name: foundUser.name, email: foundUser.email };
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedInUser));
      } catch (error) {
        console.error("Failed to save user to localStorage", error);
      }
      setUser(loggedInUser);
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
       console.error("Failed to remove user from localStorage", error);
    }
    setUser(null);
  };

  const value = { user, isAuthenticated: !!user, isLoading, login, logout };
  
  return (
    <AuthContext.Provider value={value}>
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
