import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Choreography, ChoreographyMovement } from '@/types';

// Firestore document structure - one document per user containing all choreographies
export interface FirestoreChoreographies {
  choreographies: FirestoreChoreographyItem[];
  updatedAt: Timestamp;
}

// Individual choreography item in Firestore
export interface FirestoreChoreographyItem {
  id: string;
  name: string;
  danceStyle: string;
  danceSubStyle?: string;
  complexity?: string;
  phrasesCount?: number;
  movements: ChoreographyMovement[];
  createdAt: Timestamp;
  lastOpenedAt?: Timestamp;
  isPublic?: boolean;
  ownerId?: string; // ID of the user who owns this choreography
}

/**
 * Convert Firestore choreography item to Choreography type
 */
function firestoreItemToChoreography(
  item: FirestoreChoreographyItem,
  ownerId?: string
): Choreography {
  return {
    id: item.id,
    name: item.name,
    danceStyle: item.danceStyle as Choreography['danceStyle'],
    danceSubStyle: item.danceSubStyle as Choreography['danceSubStyle'],
    complexity: item.complexity as Choreography['complexity'],
    phrasesCount: item.phrasesCount,
    movements: item.movements || [],
    createdAt: item.createdAt.toDate().toISOString(),
    lastOpenedAt: item.lastOpenedAt?.toDate().toISOString(),
    isPublic: item.isPublic || false,
    ownerId: item.ownerId || ownerId,
  };
}

/**
 * Convert Choreography type to Firestore item
 */
function choreographyToFirestoreItem(
  choreography: Choreography,
  userId?: string
): FirestoreChoreographyItem {
  const item: FirestoreChoreographyItem = {
    id: choreography.id,
    name: choreography.name,
    danceStyle: choreography.danceStyle,
    movements: choreography.movements || [],
    createdAt: Timestamp.fromDate(new Date(choreography.createdAt)),
  };

  // Only include optional fields if they are defined
  if (choreography.danceSubStyle !== undefined) {
    item.danceSubStyle = choreography.danceSubStyle;
  }
  if (choreography.complexity !== undefined) {
    item.complexity = choreography.complexity;
  }
  if (choreography.phrasesCount !== undefined) {
    item.phrasesCount = choreography.phrasesCount;
  }
  if (choreography.lastOpenedAt) {
    item.lastOpenedAt = Timestamp.fromDate(new Date(choreography.lastOpenedAt));
  }
  if (choreography.isPublic !== undefined) {
    item.isPublic = choreography.isPublic;
  }
  if (choreography.ownerId || userId) {
    item.ownerId = choreography.ownerId || userId;
  }

  return item;
}

/**
 * Get all choreographies for a user
 */
export async function getUserChoreographies(
  userId: string
): Promise<Choreography[]> {
  try {
    const choreographiesDoc = await getDoc(doc(db, 'choreographies', userId));
    if (choreographiesDoc.exists()) {
      const data = choreographiesDoc.data() as FirestoreChoreographies;
      const items = data.choreographies || [];
      // Sort by createdAt descending
      return items
        .map((item) => firestoreItemToChoreography(item, userId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (error) {
    console.error('Error getting user choreographies:', error);
    throw error;
  }
}

/**
 * Get a single choreography by ID
 */
export async function getChoreography(
  choreographyId: string,
  userId: string
): Promise<Choreography | null> {
  try {
    const choreographies = await getUserChoreographies(userId);
    return choreographies.find((c) => c.id === choreographyId) || null;
  } catch (error) {
    console.error('Error getting choreography:', error);
    throw error;
  }
}

/**
 * Create a new choreography in Firestore
 */
export async function createChoreography(
  choreography: Omit<Choreography, 'id' | 'createdAt'>,
  userId: string
): Promise<string> {
  try {
    const choreographiesRef = doc(db, 'choreographies', userId);
    const existingDoc = await getDoc(choreographiesRef);
    
    const newId = crypto.randomUUID();
    const newChoreography: Choreography = {
      ...choreography,
      id: newId,
      createdAt: new Date().toISOString(),
      ownerId: userId,
      isPublic: choreography.isPublic || false,
    };
    const newItem = choreographyToFirestoreItem(newChoreography, userId);
    
    if (existingDoc.exists()) {
      const data = existingDoc.data() as FirestoreChoreographies;
      const choreographies = data.choreographies || [];
      await updateDoc(choreographiesRef, {
        choreographies: [...choreographies, newItem],
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(choreographiesRef, {
        choreographies: [newItem],
        updatedAt: serverTimestamp(),
      });
    }
    
    return newId;
  } catch (error) {
    console.error('Error creating choreography:', error);
    throw error;
  }
}

/**
 * Update an existing choreography in Firestore
 */
export async function updateChoreography(
  choreographyId: string,
  updates: Partial<Choreography>,
  userId: string
): Promise<void> {
  try {
    const choreographiesRef = doc(db, 'choreographies', userId);
    const existingDoc = await getDoc(choreographiesRef);
    
    if (!existingDoc.exists()) {
      throw new Error('Choreographies document not found');
    }
    
    const data = existingDoc.data() as FirestoreChoreographies;
    const choreographies = data.choreographies || [];
    const index = choreographies.findIndex((c) => c.id === choreographyId);
    
    if (index === -1) {
      throw new Error('Choreography not found');
    }
    
    // Update the choreography item
    const updatedItem = { ...choreographies[index] };
    
    if (updates.name !== undefined) updatedItem.name = updates.name;
    if (updates.danceStyle !== undefined) updatedItem.danceStyle = updates.danceStyle;
    if (updates.danceSubStyle !== undefined) updatedItem.danceSubStyle = updates.danceSubStyle;
    if (updates.complexity !== undefined) updatedItem.complexity = updates.complexity;
    if (updates.phrasesCount !== undefined) updatedItem.phrasesCount = updates.phrasesCount;
    if (updates.movements !== undefined) updatedItem.movements = updates.movements;
    if (updates.lastOpenedAt !== undefined) {
      updatedItem.lastOpenedAt = Timestamp.fromDate(new Date(updates.lastOpenedAt));
    }
    if (updates.isPublic !== undefined) updatedItem.isPublic = updates.isPublic;
    
    // Replace the item in the array
    const updatedChoreographies = [...choreographies];
    updatedChoreographies[index] = updatedItem;
    
    await updateDoc(choreographiesRef, {
      choreographies: updatedChoreographies,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating choreography:', error);
    throw error;
  }
}

/**
 * Delete a choreography from Firestore
 */
export async function deleteChoreography(
  choreographyId: string,
  userId: string
): Promise<void> {
  try {
    const choreographiesRef = doc(db, 'choreographies', userId);
    const existingDoc = await getDoc(choreographiesRef);
    
    if (!existingDoc.exists()) {
      return; // Already deleted or doesn't exist
    }
    
    const data = existingDoc.data() as FirestoreChoreographies;
    const choreographies = data.choreographies || [];
    const filteredChoreographies = choreographies.filter((c) => c.id !== choreographyId);
    
    await updateDoc(choreographiesRef, {
      choreographies: filteredChoreographies,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error deleting choreography:', error);
    throw error;
  }
}

/**
 * Update last opened timestamp for a choreography
 */
export async function updateChoreographyLastOpened(
  choreographyId: string,
  userId: string
): Promise<void> {
  try {
    const choreographiesRef = doc(db, 'choreographies', userId);
    const existingDoc = await getDoc(choreographiesRef);
    
    if (!existingDoc.exists()) {
      return;
    }
    
    const data = existingDoc.data() as FirestoreChoreographies;
    const choreographies = data.choreographies || [];
    const index = choreographies.findIndex((c) => c.id === choreographyId);
    
    if (index === -1) {
      return;
    }
    
    const updatedItem = {
      ...choreographies[index],
      lastOpenedAt: serverTimestamp() as Timestamp,
    };
    
    const updatedChoreographies = [...choreographies];
    updatedChoreographies[index] = updatedItem;
    
    await updateDoc(choreographiesRef, {
      choreographies: updatedChoreographies,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating choreography last opened:', error);
    // Don't throw - this is a background operation
  }
}

/**
 * Get a public choreography by ID and owner ID
 */
export async function getPublicChoreography(
  choreographyId: string,
  ownerId: string
): Promise<Choreography | null> {
  try {
    const choreographiesDoc = await getDoc(doc(db, 'choreographies', ownerId));
    if (choreographiesDoc.exists()) {
      const data = choreographiesDoc.data() as FirestoreChoreographies;
      const items = data.choreographies || [];
      const item = items.find((c) => c.id === choreographyId && c.isPublic === true);
      if (item) {
        return firestoreItemToChoreography(item, ownerId);
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting public choreography:', error);
    throw error;
  }
}

