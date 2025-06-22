
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface User {
  name: string;
  email: string;
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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email || 'Admin',
          email: firebaseUser.email!,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // onAuthStateChanged handles success and setting isLoading to false.
      return { success: true };
    } catch (error: any) {
      console.error("Firebase login error:", error.code, error.message);
      setIsLoading(false);
      
      let message = "An unknown error occurred.";
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          message = 'Invalid email or password. Please check your credentials and try again.';
          break;
        case 'auth/operation-not-allowed':
          message = `Login is disabled. Please enable Email/Password sign-in in the Firebase Console for Project ID: "${projectId || 'Not Found! Check .env.local file'}".`;
          break;
        case 'auth/too-many-requests':
           message = 'Access to this account has been temporarily disabled due to many failed login attempts. You can reset your password or try again later.';
           break;
        case 'auth/invalid-email':
            message = 'The email address is not valid.';
            break;
        default:
           message = `Login failed. Error: ${error.code}`;
           break;
      }
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
       console.error("Firebase logout error:", error);
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
