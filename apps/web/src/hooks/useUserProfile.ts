import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  getUserProfileFromFirestore,
  saveUserProfileToFirestore,
  createUserProfileOnSignIn,
  type UserProfileData,
} from '@/lib/services/userService';
import { getUserProfile, updateUserProfile } from '@/lib/services/functionsService';

/**
 * Hook to get and manage user profile from Firestore
 */
export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query user profile from Firestore
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userProfile', user?.uid],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return getUserProfileFromFirestore(user.uid);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation to update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserProfileData>) => {
      if (!user) throw new Error('User not authenticated');
      await saveUserProfileToFirestore(user, data);
    },
    onSuccess: () => {
      // Invalidate and refetch profile
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.uid] });
    },
  });

  // Mutation to create profile on first sign-in
  const createProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      await createUserProfileOnSignIn(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', user?.uid] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
    createProfile: createProfileMutation.mutate,
    createProfileAsync: createProfileMutation.mutateAsync,
  };
}

/**
 * Hook to use Firebase Functions for user profile (alternative to Firestore)
 */
export function useUserProfileFunctions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query user profile from Functions
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['userProfileFunctions', user?.uid],
    queryFn: () => getUserProfile(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation to update user profile via Functions
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['userProfileFunctions', user?.uid],
      });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdating: updateProfileMutation.isPending,
  };
}

