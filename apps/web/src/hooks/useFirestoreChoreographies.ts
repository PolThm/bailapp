import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  getUserChoreographies,
  getChoreography,
  createChoreography,
  updateChoreography,
  deleteChoreography,
  updateChoreographyLastOpened,
} from '@/lib/services/choreographyService';
import type { Choreography } from '@/types';

/**
 * Hook to get all user choreographies from Firestore
 */
export function useFirestoreChoreographies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query all user choreographies
  const {
    data: choreographies = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['choreographies', user?.uid],
    queryFn: () => {
      if (!user) throw new Error('User not authenticated');
      return getUserChoreographies(user.uid);
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Mutation to create a new choreography
  const createMutation = useMutation({
    mutationFn: async (choreography: Omit<Choreography, 'id' | 'createdAt'>) => {
      if (!user) throw new Error('User not authenticated');
      return createChoreography(choreography, user.uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choreographies', user?.uid] });
    },
  });

  // Mutation to update a choreography
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Choreography>;
    }) => {
      if (!user) throw new Error('User not authenticated');
      await updateChoreography(id, updates, user.uid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choreographies', user?.uid] });
    },
  });

  // Mutation to delete a choreography
  const deleteMutation = useMutation({
    mutationFn: deleteChoreography,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choreographies', user?.uid] });
    },
  });

  // Mutation to update last opened timestamp
  const updateLastOpenedMutation = useMutation({
    mutationFn: updateChoreographyLastOpened,
    // Don't invalidate queries for this - it's a background operation
  });

  return {
    choreographies,
    isLoading,
    error,
    refetch,
    createChoreography: createMutation.mutate,
    createChoreographyAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateChoreography: updateMutation.mutate,
    updateChoreographyAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteChoreography: deleteMutation.mutate,
    deleteChoreographyAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateLastOpened: updateLastOpenedMutation.mutate,
  };
}

/**
 * Hook to get a single choreography by ID
 */
export function useFirestoreChoreography(choreographyId: string | null) {
  const queryClient = useQueryClient();

  const {
    data: choreography,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['choreography', choreographyId],
    queryFn: () => {
      if (!choreographyId) throw new Error('Choreography ID is required');
      return getChoreography(choreographyId);
    },
    enabled: !!choreographyId,
    staleTime: 2 * 60 * 1000,
  });

  // Update last opened when viewing
  const updateLastOpenedMutation = useMutation({
    mutationFn: updateChoreographyLastOpened,
  });

  const markAsOpened = () => {
    if (choreographyId) {
      updateLastOpenedMutation.mutate(choreographyId);
    }
  };

  return {
    choreography,
    isLoading,
    error,
    markAsOpened,
  };
}

