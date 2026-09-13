import { usePostHog } from 'posthog-js/react';
import type { NewFigureFormData } from '@/components/NewFigureModal';
import type { Figure } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useFigures } from '@/hooks/useFigures';
import { AnalyticsEvents, trackEvent } from '@/lib/analytics';
import { createFigureInFirestore } from '@/lib/services/figureService';
import {
  deleteFigureVideoFromStorage,
  uploadFigureVideoToStorage,
} from '@/lib/services/figureUploadService';

/**
 * Persists a figure submitted through NewFigureModal.
 *
 * Shared by every page that can open that modal, so the upload/rollback
 * sequence lives in one place rather than being duplicated per entry point.
 */
export function useCreateFigure() {
  const { user } = useAuth();
  const { addFigure } = useFigures();
  const posthog = usePostHog();

  return async (data: NewFigureFormData) => {
    if (!user) return;

    const figureId = `user_${user.uid}_${Date.now()}`;
    const baseFigure: Figure = {
      id: figureId,
      shortTitle: data.shortTitle,
      fullTitle: data.fullTitle,
      description: data.description,
      videoAuthor: data.videoAuthor,
      startTime: data.startTime,
      endTime: data.endTime,
      danceStyle: data.danceStyle,
      danceSubStyle: data.danceSubStyle,
      figureType: data.figureType,
      complexity: data.complexity,
      phrasesCount: data.phrasesCount,
      videoLanguage: data.videoLanguage,
      visibility: data.visibility,
      importedBy: user.displayName || 'User',
      createdAt: new Date().toISOString(),
      ownerId: user.uid,
      videoSource: data.videoSource,
      moderationStatus: 'none',
    };

    if (data.videoSource === 'youtube') {
      const figure: Figure = { ...baseFigure, youtubeUrl: data.youtubeUrl };
      await createFigureInFirestore(figure);
      addFigure(figure);
      trackEvent(posthog, AnalyticsEvents.FIGURE_CREATED, { videoSource: 'youtube' });
      return;
    }

    const draft = data.uploadedVideo;
    if (!draft) {
      throw new Error('Upload submitted without a converted video');
    }

    trackEvent(posthog, AnalyticsEvents.VIDEO_UPLOAD_STARTED, {
      sizeBytes: draft.blob.size,
      durationSeconds: Math.round(draft.durationSeconds),
      videoFormat: draft.videoFormat,
    });

    let uploaded;
    try {
      uploaded = await uploadFigureVideoToStorage(
        user.uid,
        figureId,
        draft.blob,
        draft.thumbnailBlob
      );
    } catch (error) {
      trackEvent(posthog, AnalyticsEvents.VIDEO_UPLOAD_FAILED, {
        stage: 'storage',
        message: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }

    const figure: Figure = {
      ...baseFigure,
      // Uploads always start private, matching the security rules.
      visibility: 'private',
      videoUrl: uploaded.videoUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
      storagePath: uploaded.storagePath,
      videoFormat: draft.videoFormat,
      durationSeconds: Math.round(draft.durationSeconds),
      processingStatus: 'ready',
    };

    try {
      await createFigureInFirestore(figure);
    } catch (error) {
      // Otherwise the bytes sit in Storage forever with nothing pointing at
      // them, and nothing to delete them by.
      await deleteFigureVideoFromStorage(uploaded.storagePath).catch(() => undefined);
      trackEvent(posthog, AnalyticsEvents.VIDEO_UPLOAD_FAILED, {
        stage: 'firestore',
        message: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }

    addFigure(figure);
    trackEvent(posthog, AnalyticsEvents.VIDEO_UPLOAD_COMPLETED, {
      sizeBytes: draft.blob.size,
      durationSeconds: Math.round(draft.durationSeconds),
    });
    trackEvent(posthog, AnalyticsEvents.FIGURE_CREATED, { videoSource: 'upload' });
  };
}
