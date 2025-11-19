import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// Types for function calls
export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  bio?: string;
  favoriteStyles?: string[];
  profileCreated: boolean;
}

export interface UpdateUserProfileData {
  displayName?: string;
  bio?: string;
  favoriteStyles?: string[];
}

export interface SaveChoreographyData {
  title: string;
  description?: string;
  moves: Array<{
    id: string;
    name: string;
    order: number;
  }>;
}

export interface SaveChoreographyResponse {
  success: boolean;
  choreographyId: string;
}

// Function references
const getUserProfileCallable = httpsCallable<UserProfile, UserProfile>(
  functions,
  'getUserProfile'
);

const updateUserProfileCallable = httpsCallable<
  UpdateUserProfileData,
  { success: boolean }
>(functions, 'updateUserProfile');

const saveChoreographyCallable = httpsCallable<
  SaveChoreographyData,
  SaveChoreographyResponse
>(functions, 'saveChoreography');

/**
 * Get user profile from Firebase Functions
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const result = await getUserProfileCallable();
    return result.data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

/**
 * Update user profile via Firebase Functions
 */
export async function updateUserProfile(
  data: UpdateUserProfileData
): Promise<{ success: boolean }> {
  try {
    const result = await updateUserProfileCallable(data);
    return result.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Save a choreography via Firebase Functions
 */
export async function saveChoreography(
  data: SaveChoreographyData
): Promise<SaveChoreographyResponse> {
  try {
    const result = await saveChoreographyCallable(data);
    return result.data;
  } catch (error) {
    console.error('Error saving choreography:', error);
    throw error;
  }
}

