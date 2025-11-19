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
  return {
    userId,
    name: choreography.name,
    danceStyle: choreography.danceStyle,
    danceSubStyle: choreography.danceSubStyle,
    complexity: choreography.complexity,
    phrasesCount: choreography.phrasesCount,
    movements: choreography.movements,
    lastOpenedAt: choreography.lastOpenedAt
      ? Timestamp.fromDate(new Date(choreography.lastOpenedAt))
      : undefined,
  };
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
    const docRef = await addDoc(collection(db, 'choreographies'), {
      ...firestoreData,
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
  userId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'choreographies', choreographyId);
    const updateData: Partial<FirestoreChoreography> = {
      updatedAt: serverTimestamp(),
    };

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

    await updateDoc(docRef, updateData);
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

