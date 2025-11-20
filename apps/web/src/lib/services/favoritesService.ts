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
  lastOpenedAt?: Record<string, Timestamp>; // { figureId: timestamp }
  masteryLevels?: Record<string, number>; // { figureId: level }
  updatedAt: Timestamp;
}

export interface UserFavorites {
  figureIds: string[];
  lastOpenedAt: Record<string, string>; // { figureId: ISO string }
  masteryLevels: Record<string, number>; // { figureId: level }
}

/**
 * Get user favorites from Firestore
 */
export async function getUserFavoritesFromFirestore(
  userId: string
): Promise<UserFavorites> {
  try {
    const favoritesDoc = await getDoc(doc(db, 'favorites', userId));
    if (favoritesDoc.exists()) {
      const data = favoritesDoc.data() as FirestoreFavorites;
      const figureIds = data.figureIds || [];
      const lastOpenedAt = data.lastOpenedAt || {};
      
      // Convert Timestamps to ISO strings
      const lastOpenedAtMap: Record<string, string> = {};
      for (const [figureId, timestamp] of Object.entries(lastOpenedAt)) {
        if (timestamp instanceof Timestamp) {
          lastOpenedAtMap[figureId] = timestamp.toDate().toISOString();
        }
      }
      
      const masteryLevels = data.masteryLevels || {};
      
      return { figureIds, lastOpenedAt: lastOpenedAtMap, masteryLevels };
    }
    return { figureIds: [], lastOpenedAt: {}, masteryLevels: {} };
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
    const now = Timestamp.now();

    if (existingDoc.exists()) {
      const data = existingDoc.data() as FirestoreFavorites;
      const figureIds = data.figureIds || [];
      if (!figureIds.includes(figureId)) {
        const lastOpenedAt = { ...(data.lastOpenedAt || {}) };
        // Set lastOpenedAt to now when adding to favorites
        lastOpenedAt[figureId] = now;
        
        await updateDoc(favoritesRef, {
          figureIds: [...figureIds, figureId],
          lastOpenedAt,
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      // Create new favorites document
      await setDoc(favoritesRef, {
        figureIds: [figureId],
        lastOpenedAt: {
          [figureId]: now,
        },
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
      const lastOpenedAt = { ...(data.lastOpenedAt || {}) };
      delete lastOpenedAt[figureId];
      const masteryLevels = { ...(data.masteryLevels || {}) };
      delete masteryLevels[figureId];
      
      await updateDoc(favoritesRef, {
        figureIds,
        lastOpenedAt,
        masteryLevels,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error removing from favorites in Firestore:', error);
    throw error;
  }
}

/**
 * Update lastOpenedAt for a favorite figure in Firestore
 */
export async function updateFavoriteLastOpenedInFirestore(
  userId: string,
  figureId: string,
  lastOpenedAt: string
): Promise<void> {
  try {
    const favoritesRef = doc(db, 'favorites', userId);
    const existingDoc = await getDoc(favoritesRef);

    if (existingDoc.exists()) {
      const data = existingDoc.data() as FirestoreFavorites;
      // Only update if the figure is in favorites
      if (data.figureIds && data.figureIds.includes(figureId)) {
        const lastOpenedAtMap = { ...(data.lastOpenedAt || {}) };
        lastOpenedAtMap[figureId] = Timestamp.fromDate(new Date(lastOpenedAt));
        
        await updateDoc(favoritesRef, {
          lastOpenedAt: lastOpenedAtMap,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error('Error updating favorite lastOpenedAt in Firestore:', error);
    throw error;
  }
}

/**
 * Update mastery level for a favorite figure in Firestore
 */
export async function updateFavoriteMasteryLevelInFirestore(
  userId: string,
  figureId: string,
  level: number
): Promise<void> {
  try {
    const favoritesRef = doc(db, 'favorites', userId);
    const existingDoc = await getDoc(favoritesRef);

    if (existingDoc.exists()) {
      const data = existingDoc.data() as FirestoreFavorites;
      // Only update if the figure is in favorites
      if (data.figureIds && data.figureIds.includes(figureId)) {
        const masteryLevels = { ...(data.masteryLevels || {}) };
        masteryLevels[figureId] = level;
        
        await updateDoc(favoritesRef, {
          masteryLevels,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error('Error updating favorite mastery level in Firestore:', error);
    throw error;
  }
}

