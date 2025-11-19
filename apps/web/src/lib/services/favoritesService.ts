import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FirestoreFavorites {
  figureIds: string[];
  updatedAt: Timestamp;
}

/**
 * Get user favorites from Firestore
 */
export async function getUserFavoritesFromFirestore(
  userId: string
): Promise<string[]> {
  try {
    const favoritesDoc = await getDoc(doc(db, 'favorites', userId));
    if (favoritesDoc.exists()) {
      const data = favoritesDoc.data() as FirestoreFavorites;
      return data.figureIds || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting user favorites from Firestore:', error);
    throw error;
  }
}

/**
 * Save user favorites to Firestore
 */
export async function saveUserFavoritesToFirestore(
  userId: string,
  figureIds: string[]
): Promise<void> {
  try {
    const favoritesRef = doc(db, 'favorites', userId);
    const existingDoc = await getDoc(favoritesRef);

    if (existingDoc.exists()) {
      // Update existing favorites
      await updateDoc(favoritesRef, {
        figureIds,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new favorites document
      await setDoc(favoritesRef, {
        figureIds,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error saving user favorites to Firestore:', error);
    throw error;
  }
}

/**
 * Add a figure to favorites in Firestore
 */
export async function addToFavoritesInFirestore(
  userId: string,
  figureId: string
): Promise<void> {
  try {
    const favoritesRef = doc(db, 'favorites', userId);
    const existingDoc = await getDoc(favoritesRef);

    if (existingDoc.exists()) {
      const data = existingDoc.data() as FirestoreFavorites;
      const figureIds = data.figureIds || [];
      if (!figureIds.includes(figureId)) {
        await updateDoc(favoritesRef, {
          figureIds: [...figureIds, figureId],
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      // Create new favorites document
      await setDoc(favoritesRef, {
        figureIds: [figureId],
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error adding to favorites in Firestore:', error);
    throw error;
  }
}

/**
 * Remove a figure from favorites in Firestore
 */
export async function removeFromFavoritesInFirestore(
  userId: string,
  figureId: string
): Promise<void> {
  try {
    const favoritesRef = doc(db, 'favorites', userId);
    const existingDoc = await getDoc(favoritesRef);

    if (existingDoc.exists()) {
      const data = existingDoc.data() as FirestoreFavorites;
      const figureIds = (data.figureIds || []).filter((id) => id !== figureId);
      await updateDoc(favoritesRef, {
        figureIds,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error removing from favorites in Firestore:', error);
    throw error;
  }
}

