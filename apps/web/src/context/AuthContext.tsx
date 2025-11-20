import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { createUserProfileOnSignIn } from '@/lib/services/userService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to detect if we're on mobile/PWA
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result (for mobile/PWA)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // User signed in via redirect
          setUser(result.user);
          setLoading(false);
          // Create user profile in Firestore on first sign-in
          createUserProfileOnSignIn(result.user).catch((error) => {
            console.error('Failed to create user profile:', error);
          });
        }
      })
      .catch((error) => {
        console.error('Error getting redirect result:', error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
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

    return unsubscribe;
  }, []);

  const signInWithGoogleHandler = async () => {
    try {
      // Use redirect on mobile/PWA for better account selection support
      if (isMobileDevice()) {
        // Create a new provider instance with prompt for mobile
        const mobileProvider = new GoogleAuthProvider();
        mobileProvider.setCustomParameters({
          prompt: 'select_account'
        });
        await signInWithRedirect(auth, mobileProvider);
      } else {
        // On desktop, use popup (prompt is not needed as popup always shows account selection)
        await signInWithPopup(auth, googleProvider);
      }
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

