import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import type { CallableContext } from 'firebase-functions/v1/https';

// Initialize Firebase Admin
admin.initializeApp();

// Example HTTP function
export const helloWorld = functions.https.onRequest((request, response) => {
  response.json({ message: 'Hello from Bailapp Functions!' });
});

// Example authenticated function
export const getUserProfile = functions.https.onCall(
  async (data: unknown, context: CallableContext) => {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to get profile'
      );
    }

    const uid = context.auth.uid;

    try {
      // Get user data from Firestore
      const userDoc = await admin.firestore().collection('users').doc(uid).get();

      if (!userDoc.exists) {
        return {
          uid,
          displayName: context.auth.token.name || 'Anonymous',
          email: context.auth.token.email || null,
          profileCreated: false,
        };
      }

      return {
        uid,
        ...userDoc.data(),
        profileCreated: true,
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get user profile'
      );
    }
  }
);

// Example function to create/update user profile
interface UpdateUserProfileData {
  displayName?: string;
  bio?: string;
  favoriteStyles?: string[];
}

export const updateUserProfile = functions.https.onCall(
  async (data: UpdateUserProfileData, context: CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const uid = context.auth.uid;
    const { displayName, bio, favoriteStyles } = data;

    try {
      await admin
        .firestore()
        .collection('users')
        .doc(uid)
        .set(
          {
            displayName,
            bio,
            favoriteStyles,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to update user profile'
      );
    }
  }
);

// Example function to save a choreography
interface SaveChoreographyData {
  title: string;
  description?: string;
  moves: Array<{
    id: string;
    name: string;
    order: number;
  }>;
}

export const saveChoreography = functions.https.onCall(
  async (data: SaveChoreographyData, context: CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to save choreography'
      );
    }

    const uid = context.auth.uid;
    const { title, description, moves } = data;

    try {
      const choreographyRef = await admin
        .firestore()
        .collection('choreographies')
        .add({
          userId: uid,
          title,
          description,
          moves,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return {
        success: true,
        choreographyId: choreographyRef.id,
      };
    } catch (error) {
      console.error('Error saving choreography:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to save choreography'
      );
    }
  }
);

