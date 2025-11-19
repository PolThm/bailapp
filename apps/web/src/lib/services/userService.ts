import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from 'firebase/auth';

export interface UserProfileData {
  displayName?: string;
  email?: string;
  bio?: string;
  favoriteStyles?: string[];
  createdAt?: any; // Firestore Timestamp
  updatedAt?: any; // Firestore Timestamp
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfileFromFirestore(
  userId: string
): Promise<UserProfileData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile from Firestore:', error);
    throw error;
  }
}

/**
 * Create or update user profile in Firestore
 */
export async function saveUserProfileToFirestore(
  user: User,
  profileData: Partial<UserProfileData>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const existingDoc = await getDoc(userRef);

    if (existingDoc.exists()) {
      // Update existing profile
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new profile
      await setDoc(userRef, {
        displayName: user.displayName || profileData.displayName || '',
        email: user.email || profileData.email || '',
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error saving user profile to Firestore:', error);
    throw error;
  }
}

/**
 * Create user profile on first sign-in
 */
export async function createUserProfileOnSignIn(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const existingDoc = await getDoc(userRef);

    if (!existingDoc.exists()) {
      // Create profile with basic info from auth
      await setDoc(userRef, {
        displayName: user.displayName || '',
        email: user.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error creating user profile on sign-in:', error);
    // Don't throw - this is a background operation
  }
}

