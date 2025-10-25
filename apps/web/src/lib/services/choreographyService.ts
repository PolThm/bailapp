import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
  collection,
  getDocs,
} from 'firebase/firestore';
import type { Choreography, ChoreographyMovement } from '@/types';
import { db } from '@/lib/firebase';

/**
 * Clean movements array to remove undefined values from movement objects
 * Firestore doesn't accept undefined values
 */
function cleanMovements(movements: ChoreographyMovement[]): ChoreographyMovement[] {
  return movements.map((movement) => {
    const clean: ChoreographyMovement = {
      id: movement.id,
      name: movement.name,
      order: movement.order,
    };
    // Only include mentionId and mentionType if they are defined and not null
    if (movement.mentionId !== undefined && movement.mentionId !== null) {
      clean.mentionId = movement.mentionId;
    }
    if (movement.mentionType !== undefined && movement.mentionType !== null) {
      clean.mentionType = movement.mentionType;
    }
    return clean;
  });
}

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
  sharingMode?: 'view-only' | 'collaborative';
  followedBy?: string[]; // IDs of users who follow this choreography
}

/**
 * Convert Firestore choreography item to Choreography type
 */
function firestoreItemToChoreography(
  item: FirestoreChoreographyItem,
  ownerId?: string
): Choreography {
  // Clean movements when reading from Firestore (in case of existing data with undefined values)
  const movements = cleanMovements(item.movements || []);

  return {
    id: item.id,
    name: item.name,
    danceStyle: item.danceStyle as Choreography['danceStyle'],
    danceSubStyle: item.danceSubStyle as Choreography['danceSubStyle'],
    complexity: item.complexity as Choreography['complexity'],
    phrasesCount: item.phrasesCount,
    movements: movements,
    createdAt: item.createdAt.toDate().toISOString(),
    lastOpenedAt: item.lastOpenedAt?.toDate().toISOString(),
    isPublic: item.isPublic || false,
    ownerId: item.ownerId || ownerId,
    sharingMode: item.sharingMode || 'view-only',
    followedBy: item.followedBy || [],
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
    movements: cleanMovements(choreography.movements || []),
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
  if (choreography.sharingMode !== undefined) {
    item.sharingMode = choreography.sharingMode;
  }
  if (choreography.followedBy !== undefined) {
    item.followedBy = choreography.followedBy;
  }

  return item;
}

/**
 * Get all choreographies for a user
 */
export async function getUserChoreographies(userId: string): Promise<Choreography[]> {
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
      sharingMode: choreography.sharingMode || 'view-only',
      followedBy: choreography.followedBy || [],
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
 * @param ownerId - Optional owner ID. If provided, updates the choreography in the owner's document instead of the user's document
 */
export async function updateChoreography(
  choreographyId: string,
  updates: Partial<Choreography>,
  userId: string,
  ownerId?: string
): Promise<void> {
  try {
    // Use ownerId if provided (for shared choreographies), otherwise use userId
    const targetUserId = ownerId || userId;
    const choreographiesRef = doc(db, 'choreographies', targetUserId);
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

    // Update the choreography item - start with existing item and only include defined fields
    const existingItem = choreographies[index];

    const movementsToUse =
      updates.movements !== undefined ? cleanMovements(updates.movements) : existingItem.movements;

    const updatedItem: FirestoreChoreographyItem = {
      id: existingItem.id,
      name: updates.name !== undefined ? updates.name : existingItem.name,
      danceStyle: updates.danceStyle !== undefined ? updates.danceStyle : existingItem.danceStyle,
      movements: movementsToUse,
      createdAt: existingItem.createdAt,
    };

    // Only include optional fields if they are defined (either in updates or existing)
    if (updates.danceSubStyle !== undefined) {
      updatedItem.danceSubStyle = updates.danceSubStyle;
    } else if (existingItem.danceSubStyle !== undefined) {
      updatedItem.danceSubStyle = existingItem.danceSubStyle;
    }

    if (updates.complexity !== undefined) {
      updatedItem.complexity = updates.complexity;
    } else if (existingItem.complexity !== undefined) {
      updatedItem.complexity = existingItem.complexity;
    }

    if (updates.phrasesCount !== undefined) {
      updatedItem.phrasesCount = updates.phrasesCount;
    } else if (existingItem.phrasesCount !== undefined) {
      updatedItem.phrasesCount = existingItem.phrasesCount;
    }

    if (updates.lastOpenedAt !== undefined) {
      updatedItem.lastOpenedAt = Timestamp.fromDate(new Date(updates.lastOpenedAt));
    } else if (existingItem.lastOpenedAt !== undefined) {
      updatedItem.lastOpenedAt = existingItem.lastOpenedAt;
    }

    if (updates.isPublic !== undefined) {
      updatedItem.isPublic = updates.isPublic;
    } else if (existingItem.isPublic !== undefined) {
      updatedItem.isPublic = existingItem.isPublic;
    }

    if (updates.ownerId !== undefined) {
      updatedItem.ownerId = updates.ownerId;
    } else if (existingItem.ownerId !== undefined) {
      updatedItem.ownerId = existingItem.ownerId;
    }

    if (updates.sharingMode !== undefined) {
      updatedItem.sharingMode = updates.sharingMode;
    } else if (existingItem.sharingMode !== undefined) {
      updatedItem.sharingMode = existingItem.sharingMode;
    }

    if (updates.followedBy !== undefined) {
      updatedItem.followedBy = updates.followedBy;
    } else if (existingItem.followedBy !== undefined) {
      updatedItem.followedBy = existingItem.followedBy;
    }

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
export async function deleteChoreography(choreographyId: string, userId: string): Promise<void> {
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
 * Note: This function doesn't require authentication, so it can be called even when logged out
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

/**
 * Get a choreography by ID and owner ID, even if it's private
 * This is used to check if a followed choreography still exists and if it's private
 */
export async function getChoreographyByIdAndOwner(
  choreographyId: string,
  ownerId: string
): Promise<Choreography | null> {
  try {
    const choreographiesDoc = await getDoc(doc(db, 'choreographies', ownerId));
    if (choreographiesDoc.exists()) {
      const data = choreographiesDoc.data() as FirestoreChoreographies;
      const items = data.choreographies || [];
      const item = items.find((c) => c.id === choreographyId);
      if (item) {
        return firestoreItemToChoreography(item, ownerId);
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting choreography by ID and owner:', error);
    throw error;
  }
}

/**
 * Follow a public choreography
 * Adds the current user to the followedBy array of the choreography
 */
export async function followChoreography(
  choreographyId: string,
  ownerId: string,
  userId: string
): Promise<void> {
  try {
    const choreographiesRef = doc(db, 'choreographies', ownerId);
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

    const choreography = choreographies[index];

    // Check if user is already following
    const followedBy = choreography.followedBy || [];
    if (followedBy.includes(userId)) {
      return; // Already following
    }

    // Add user to followedBy array
    const updatedItem = {
      ...choreography,
      followedBy: [...followedBy, userId],
    };

    const updatedChoreographies = [...choreographies];
    updatedChoreographies[index] = updatedItem;

    await updateDoc(choreographiesRef, {
      choreographies: updatedChoreographies,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error following choreography:', error);
    throw error;
  }
}

/**
 * Unfollow a choreography
 * Removes the current user from the followedBy array
 */
export async function unfollowChoreography(
  choreographyId: string,
  ownerId: string,
  userId: string
): Promise<void> {
  try {
    const choreographiesRef = doc(db, 'choreographies', ownerId);
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

    const choreography = choreographies[index];
    const followedBy = choreography.followedBy || [];

    // Remove user from followedBy array
    const updatedItem = {
      ...choreography,
      followedBy: followedBy.filter((id) => id !== userId),
    };

    const updatedChoreographies = [...choreographies];
    updatedChoreographies[index] = updatedItem;

    await updateDoc(choreographiesRef, {
      choreographies: updatedChoreographies,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error unfollowing choreography:', error);
    throw error;
  }
}

/**
 * Update the sharing mode of a choreography (owner only)
 */
export async function updateChoreographySharingMode(
  choreographyId: string,
  userId: string,
  sharingMode: 'view-only' | 'collaborative'
): Promise<void> {
  try {
    await updateChoreography(choreographyId, { sharingMode }, userId);
  } catch (error) {
    console.error('Error updating sharing mode:', error);
    throw error;
  }
}

/**
 * Get all choreographies that the user is following
 * This searches through all choreographies documents to find public choreographies
 * where the user is in the followedBy array
 */
export async function getFollowedChoreographies(userId: string): Promise<Choreography[]> {
  try {
    const followedChoreographies: Choreography[] = [];

    // Get all choreographies documents
    const choreographiesCollection = collection(db, 'choreographies');
    const snapshot = await getDocs(choreographiesCollection);

    // Iterate through all documents
    snapshot.forEach((docSnapshot) => {
      const ownerId = docSnapshot.id;
      // Skip user's own document
      if (ownerId === userId) return;

      const data = docSnapshot.data() as FirestoreChoreographies;
      const items = data.choreographies || [];

      // Find choreographies where user is in followedBy (including private ones)
      items.forEach((item) => {
        if (item.followedBy && item.followedBy.includes(userId)) {
          const choreography = firestoreItemToChoreography(item, ownerId);
          followedChoreographies.push(choreography);
        }
      });
    });

    // Sort by createdAt descending
    return followedChoreographies.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error('Error getting followed choreographies:', error);
    throw error;
  }
}
