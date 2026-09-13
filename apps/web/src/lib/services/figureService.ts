import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import type { Figure } from '@/types';
import { db } from '@/lib/firebase';

/**
 * Firestore access for user-contributed figures.
 *
 * Unlike choreographies and favorites, which keep one document per user, this
 * is one document per figure: the catalogue has to be queryable across users.
 */

const FIGURES_COLLECTION = 'figures';

/** On-disk shape: same fields as `Figure`, but dates are Timestamps. */
export interface FirestoreFigure extends Omit<Figure, 'id' | 'createdAt' | 'lastOpenedAt'> {
  createdAt: Timestamp;
  lastOpenedAt?: Timestamp;
}

function firestoreFigureToFigure(id: string, data: FirestoreFigure): Figure {
  // Timestamps are pulled out of the spread: the app-facing type carries ISO
  // strings, so letting them through untouched would be a lie to TypeScript.
  const { createdAt, lastOpenedAt, ...rest } = data;

  const figure: Figure = {
    ...rest,
    id,
    createdAt: createdAt?.toDate().toISOString() ?? new Date().toISOString(),
  };

  if (lastOpenedAt instanceof Timestamp) {
    figure.lastOpenedAt = lastOpenedAt.toDate().toISOString();
  }

  return figure;
}

/**
 * Firestore rejects `undefined`, and there is no shared stripping helper in
 * this codebase, so optional fields are attached explicitly.
 */
function figureToFirestoreFigure(figure: Figure): FirestoreFigure {
  const data: FirestoreFigure = {
    shortTitle: figure.shortTitle,
    fullTitle: figure.fullTitle,
    danceStyle: figure.danceStyle,
    complexity: figure.complexity,
    videoLanguage: figure.videoLanguage,
    visibility: figure.visibility,
    importedBy: figure.importedBy,
    createdAt: Timestamp.fromDate(new Date(figure.createdAt)),
  };

  const optionalFields = [
    'youtubeUrl',
    'description',
    'videoAuthor',
    'startTime',
    'endTime',
    'previewStartTime',
    'danceSubStyle',
    'figureType',
    'phrasesCount',
    'videoSource',
    'videoUrl',
    'thumbnailUrl',
    'storagePath',
    'videoFormat',
    'durationSeconds',
    'width',
    'height',
    'ownerId',
    'processingStatus',
    'moderationStatus',
  ] as const;

  for (const field of optionalFields) {
    const value = figure[field];
    if (value !== undefined && value !== null) {
      // Index assignment: the loop is uniform, the field types are not.
      (data as unknown as Record<string, unknown>)[field] = value;
    }
  }

  if (figure.lastOpenedAt) {
    data.lastOpenedAt = Timestamp.fromDate(new Date(figure.lastOpenedAt));
  }

  return data;
}

/**
 * Creates a figure. Always unlisted and unmoderated to begin with: reachable
 * by anyone holding the link, absent from the catalogue. Security rules
 * enforce the same thing, so anything else is rejected server-side.
 */
export async function createFigureInFirestore(figure: Figure): Promise<void> {
  try {
    const data = figureToFirestoreFigure({
      ...figure,
      visibility: 'unlisted',
      moderationStatus: figure.moderationStatus ?? 'none',
    });
    await setDoc(doc(db, FIGURES_COLLECTION, figure.id), data);
  } catch (error) {
    console.error('Creating figure in Firestore:', error);
    throw error;
  }
}

export async function getFigureFromFirestore(figureId: string): Promise<Figure | null> {
  try {
    const snapshot = await getDoc(doc(db, FIGURES_COLLECTION, figureId));
    if (!snapshot.exists()) {
      return null;
    }
    return firestoreFigureToFigure(snapshot.id, snapshot.data() as FirestoreFigure);
  } catch (error) {
    console.error('Getting figure from Firestore:', error);
    throw error;
  }
}

/**
 * Fetches figures by id, skipping any the caller may not read.
 *
 * This is the `get` path, the only one that reaches an unlisted figure: a
 * query would never return it. Used for figures a user favourited after
 * following someone's link.
 */
export async function getFiguresByIdsFromFirestore(figureIds: string[]): Promise<Figure[]> {
  if (figureIds.length === 0) {
    return [];
  }

  const results = await Promise.all(
    figureIds.map(async (figureId) => {
      try {
        return await getFigureFromFirestore(figureId);
      } catch {
        // Deleted, or no longer readable: drop it rather than failing the lot.
        return null;
      }
    })
  );

  return results.filter((figure): figure is Figure => figure !== null);
}

/**
 * The caller's own figures, whatever their visibility.
 *
 * Must stay constrained on ownerId: the security rule inspects
 * `resource.data`, so an unconstrained query is refused outright.
 */
export async function getUserFiguresFromFirestore(userId: string): Promise<Figure[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, FIGURES_COLLECTION),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      )
    );
    return snapshot.docs.map((item) =>
      firestoreFigureToFigure(item.id, item.data() as FirestoreFigure)
    );
  } catch (error) {
    console.error('Getting user figures from Firestore:', error);
    throw error;
  }
}

/** Figures a moderator has promoted to the public catalogue. */
export async function getPublicFiguresFromFirestore(): Promise<Figure[]> {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, FIGURES_COLLECTION),
        where('visibility', '==', 'public'),
        orderBy('createdAt', 'desc')
      )
    );
    return snapshot.docs.map((item) =>
      firestoreFigureToFigure(item.id, item.data() as FirestoreFigure)
    );
  } catch (error) {
    console.error('Getting public figures from Firestore:', error);
    throw error;
  }
}

/**
 * Metadata edits by the owner. `visibility` and `ownerId` are stripped: the
 * security rules refuse to let either change here, and only moderation can
 * promote a figure.
 */
export async function updateFigureInFirestore(
  figureId: string,
  updates: Partial<Figure>
): Promise<void> {
  try {
    const payload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || key === 'id' || key === 'visibility' || key === 'ownerId') {
        continue;
      }
      payload[key] = key === 'lastOpenedAt' ? Timestamp.fromDate(new Date(value as string)) : value;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    await updateDoc(doc(db, FIGURES_COLLECTION, figureId), payload);
  } catch (error) {
    console.error('Updating figure in Firestore:', error);
    throw error;
  }
}

/** Owner asks for the figure to be reviewed for the public catalogue. */
export async function submitFigureForReviewInFirestore(figureId: string): Promise<void> {
  try {
    await updateDoc(doc(db, FIGURES_COLLECTION, figureId), { moderationStatus: 'pending' });
  } catch (error) {
    console.error('Submitting figure for review in Firestore:', error);
    throw error;
  }
}

export async function deleteFigureFromFirestore(figureId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, FIGURES_COLLECTION, figureId));
  } catch (error) {
    console.error('Deleting figure from Firestore:', error);
    throw error;
  }
}
