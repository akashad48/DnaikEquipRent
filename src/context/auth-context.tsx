
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, firebaseInitialized } from '@/lib/firebase';
import { FirebaseError } from 'firebase/app';

export interface User {
  uid: string;
  email: string | null;
  name: string | null;
}

interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!firebaseInitialized || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<LoginResult> => {
    if (!auth) return { success: false, message: 'Firebase not initialized.' };

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true };
    } catch (error: any) {
        let message = "An unexpected error occurred during login.";
        if (error instanceof FirebaseError) {
             switch (error.code) {
                case 'auth/invalid-email':
                    message = 'The email address is not valid.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                     message = 'Invalid email or password.';
                    break;
                case 'auth/too-many-requests':
                    message = 'Too many login attempts. Please try again later.';
                    break;
                default:
                    message = 'An error occurred during login. Please try again.';
                    break;
            }
        }
      return { success: false, message };
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
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
