import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  FieldValue,
  UpdateData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Choreography, ChoreographyMovement } from '@/types';

// Firestore document structure (slightly different from local Choreography type)
export interface FirestoreChoreography {
  userId: string;
  name: string;
  danceStyle: string;
  danceSubStyle?: string;
  complexity?: string;
  phrasesCount?: number;
  movements: ChoreographyMovement[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastOpenedAt?: Timestamp;
}

// Type for update operations that can include FieldValue
export interface FirestoreChoreographyUpdate {
  userId?: string;
  name?: string;
  danceStyle?: string;
  danceSubStyle?: string;
  complexity?: string;
  phrasesCount?: number;
  movements?: ChoreographyMovement[];
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  lastOpenedAt?: Timestamp | FieldValue;
}

/**
 * Convert Firestore document to Choreography type
 */
function firestoreToChoreography(
  id: string,
  data: FirestoreChoreography
): Choreography {
  return {
    id,
    name: data.name,
    danceStyle: data.danceStyle as Choreography['danceStyle'],
    danceSubStyle: data.danceSubStyle as Choreography['danceSubStyle'],
    complexity: data.complexity as Choreography['complexity'],
    phrasesCount: data.phrasesCount,
    movements: data.movements,
    createdAt: data.createdAt.toDate().toISOString(),
    lastOpenedAt: data.lastOpenedAt?.toDate().toISOString(),
  };
}

/**
 * Convert Choreography type to Firestore document
 */
function choreographyToFirestore(
  choreography: Choreography,
  userId: string
): Omit<FirestoreChoreography, 'createdAt' | 'updatedAt'> {
  const data: Omit<FirestoreChoreography, 'createdAt' | 'updatedAt'> = {
    userId,
    name: choreography.name,
    danceStyle: choreography.danceStyle,
    movements: choreography.movements,
  };

  // Only include optional fields if they are defined
  if (choreography.danceSubStyle !== undefined) {
    data.danceSubStyle = choreography.danceSubStyle;
  }
  if (choreography.complexity !== undefined) {
    data.complexity = choreography.complexity;
  }
  if (choreography.phrasesCount !== undefined) {
    data.phrasesCount = choreography.phrasesCount;
  }
  if (choreography.lastOpenedAt) {
    data.lastOpenedAt = Timestamp.fromDate(new Date(choreography.lastOpenedAt));
  }

  return data;
}

/**
 * Get all choreographies for a user
 */
export async function getUserChoreographies(
  userId: string
): Promise<Choreography[]> {
  try {
    const q = query(
      collection(db, 'choreographies'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) =>
      firestoreToChoreography(doc.id, doc.data() as FirestoreChoreography)
    );
  } catch (error) {
    console.error('Error getting user choreographies:', error);
    throw error;
  }
}

/**
 * Get a single choreography by ID
 */
export async function getChoreography(
  choreographyId: string
): Promise<Choreography | null> {
  try {
    const docRef = doc(db, 'choreographies', choreographyId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return firestoreToChoreography(
        docSnap.id,
        docSnap.data() as FirestoreChoreography
      );
    }
    return null;
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
    const firestoreData = choreographyToFirestore(
      { ...choreography, id: '', createdAt: '' },
      userId
    );
    // Filter out undefined values before sending to Firestore
    const cleanData = Object.fromEntries(
      Object.entries(firestoreData).filter(([_, value]) => value !== undefined)
    );
    const docRef = await addDoc(collection(db, 'choreographies'), {
      ...cleanData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
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
  _userId: string // Prefixed with _ to indicate intentionally unused (used by Firestore rules)
): Promise<void> {
  try {
    const docRef = doc(db, 'choreographies', choreographyId);
    const updateData: UpdateData<FirestoreChoreography> = {
      updatedAt: serverTimestamp(),
    };

    // Only include fields that are defined (not undefined)
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.danceStyle !== undefined)
      updateData.danceStyle = updates.danceStyle;
    if (updates.danceSubStyle !== undefined)
      updateData.danceSubStyle = updates.danceSubStyle;
    if (updates.complexity !== undefined)
      updateData.complexity = updates.complexity;
    if (updates.phrasesCount !== undefined)
      updateData.phrasesCount = updates.phrasesCount;
    if (updates.movements !== undefined)
      updateData.movements = updates.movements;
    if (updates.lastOpenedAt !== undefined)
      updateData.lastOpenedAt = Timestamp.fromDate(
        new Date(updates.lastOpenedAt)
      );

    // Filter out undefined values before updating
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    ) as UpdateData<FirestoreChoreography>;

    await updateDoc(docRef, cleanUpdateData);
  } catch (error) {
    console.error('Error updating choreography:', error);
    throw error;
  }
}

/**
 * Delete a choreography from Firestore
 */
export async function deleteChoreography(
  choreographyId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'choreographies', choreographyId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting choreography:', error);
    throw error;
  }
}

/**
 * Update last opened timestamp for a choreography
 */
export async function updateChoreographyLastOpened(
  choreographyId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'choreographies', choreographyId);
    await updateDoc(docRef, {
      lastOpenedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating choreography last opened:', error);
    // Don't throw - this is a background operation
  }
}

