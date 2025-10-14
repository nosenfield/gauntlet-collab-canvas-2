import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../services/firebase';
import type { User, UserState } from '../types/user';

const generateRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const getUserColorFromStorage = (userId: string): string | null => {
  try {
    const stored = localStorage.getItem(`userColor_${userId}`);
    return stored;
  } catch {
    return null;
  }
};

const saveUserColorToStorage = (userId: string, color: string): void => {
  try {
    localStorage.setItem(`userColor_${userId}`, color);
  } catch {
    // Silently fail if localStorage is not available
  }
};

export const useAuth = (): UserState => {
  const [user, setUser] = useState<User | null>(null);
  const [userColor, setUserColor] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setIsLoading(true);
        setError(null);

        if (firebaseUser) {
          // User is already signed in - check for existing color
          let color = getUserColorFromStorage(firebaseUser.uid);
          if (!color) {
            color = generateRandomColor();
            saveUserColorToStorage(firebaseUser.uid, color);
          }
          
          setUser({
            uid: firebaseUser.uid,
            color,
            displayName: firebaseUser.displayName || undefined
          });
          setUserColor(color);
        } else {
          // No user, sign in anonymously
          const result = await signInAnonymously(auth);
          let color = getUserColorFromStorage(result.user.uid);
          if (!color) {
            color = generateRandomColor();
            saveUserColorToStorage(result.user.uid, color);
          }
          
          setUser({
            uid: result.user.uid,
            color,
            displayName: result.user.displayName || undefined
          });
          setUserColor(color);
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, userColor, isLoading, error };
};
