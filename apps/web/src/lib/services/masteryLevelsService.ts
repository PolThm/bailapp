import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FirestoreMasteryLevels {
  levels: Record<string, number>; // { figureId: level }
  updatedAt: Timestamp;
}

/**
 * Get user mastery levels from Firestore
 */
export async function getUserMasteryLevelsFromFirestore(
  userId: string
): Promise<Record<string, number>> {
  try {
    const masteryLevelsDoc = await getDoc(doc(db, 'masteryLevels', userId));
    if (masteryLevelsDoc.exists()) {
      const data = masteryLevelsDoc.data() as FirestoreMasteryLevels;
      return data.levels || {};
    }
    return {};
  } catch (error) {
    console.error('Error getting user mastery levels from Firestore:', error);
    throw error;
  }
}

/**
 * Save user mastery levels to Firestore
 */
export async function saveUserMasteryLevelsToFirestore(
  userId: string,
  levels: Record<string, number>
): Promise<void> {
  try {
    const masteryLevelsRef = doc(db, 'masteryLevels', userId);
    const existingDoc = await getDoc(masteryLevelsRef);

    if (existingDoc.exists()) {
      // Update existing mastery levels
      await updateDoc(masteryLevelsRef, {
        levels,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new mastery levels document
      await setDoc(masteryLevelsRef, {
        levels,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error saving user mastery levels to Firestore:', error);
    throw error;
  }
}

/**
 * Set mastery level for a specific figure in Firestore
 */
export async function setMasteryLevelInFirestore(
  userId: string,
  figureId: string,
  level: number
): Promise<void> {
  try {
    const masteryLevelsRef = doc(db, 'masteryLevels', userId);
    const existingDoc = await getDoc(masteryLevelsRef);

    if (existingDoc.exists()) {
      const data = existingDoc.data() as FirestoreMasteryLevels;
      const levels = { ...(data.levels || {}), [figureId]: level };
      await updateDoc(masteryLevelsRef, {
        levels,
        updatedAt: serverTimestamp(),
      });
    } else {
      // Create new mastery levels document
      await setDoc(masteryLevelsRef, {
        levels: { [figureId]: level },
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error setting mastery level in Firestore:', error);
    throw error;
  }
}

/**
 * Remove mastery level for a specific figure in Firestore
 */
export async function removeMasteryLevelFromFirestore(
  userId: string,
  figureId: string
): Promise<void> {
  try {
    const masteryLevelsRef = doc(db, 'masteryLevels', userId);
    const existingDoc = await getDoc(masteryLevelsRef);

    if (existingDoc.exists()) {
      const data = existingDoc.data() as FirestoreMasteryLevels;
      const levels = { ...(data.levels || {}) };
      delete levels[figureId];
      await updateDoc(masteryLevelsRef, {
        levels,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error removing mastery level from Firestore:', error);
    throw error;
  }
}

