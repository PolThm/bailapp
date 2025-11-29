import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { createUserProfileOnSignIn } from '@/lib/services/userService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  forceSlowMode: boolean; // True if auth timeout occurred (5s)
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [forceSlowMode, setForceSlowMode] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isResolved = false;

    // Timeout: if auth doesn't load in 5 seconds, force slow mode
    timeoutId = setTimeout(() => {
      if (!isResolved) {
        setForceSlowMode(true);
        setLoading(false);
        // Try to get user from cache if available
        const cachedUser = auth.currentUser;
        if (cachedUser) {
          setUser(cachedUser);
        }
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      isResolved = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      setUser(user);
      setLoading(false);
      setForceSlowMode(false);
      
      // Create user profile in Firestore on first sign-in
      if (user) {
        try {
          await createUserProfileOnSignIn(user);
        } catch (error) {
          // Don't block the app if profile creation fails
          console.error('Failed to create user profile:', error);
        }
      }
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe();
    };
  }, []);

  const signInWithGoogleHandler = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        forceSlowMode,
        signInWithGoogle: signInWithGoogleHandler,
        logout,
      }}
    >
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

