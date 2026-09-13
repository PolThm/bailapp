import { usePostHog } from 'posthog-js/react';
import { useTranslation } from 'react-i18next';
import type { NewFigureFormData } from '@/components/NewFigureModal';
import type { Figure, VideoLanguage } from '@/types';
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
/** The form no longer asks for a language; the UI locale is a better guess than nothing. */
const LANGUAGE_BY_LOCALE: Record<string, VideoLanguage> = {
  fr: 'french',
  en: 'english',
  es: 'spanish',
  it: 'italian',
};

export function useCreateFigure() {
  const { user } = useAuth();
  const { addFigure } = useFigures();
  const posthog = usePostHog();
  const { i18n } = useTranslation();

  return async (data: NewFigureFormData): Promise<Figure | undefined> => {
    if (!user) return undefined;

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
      // Defaulted rather than made optional, so filters and badges always
      // have something to show.
      complexity: data.complexity ?? 'intermediate',
      phrasesCount: data.phrasesCount,
      videoLanguage:
        data.videoLanguage ?? LANGUAGE_BY_LOCALE[i18n.language?.split('-')[0]] ?? 'english',
      // Every figure starts private; the security rules enforce it too.
      // Going public happens through review, from the profile.
      visibility: 'private',
      videoFormat: data.videoFormat,
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
      return figure;
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
      videoUrl: uploaded.videoUrl,
      thumbnailUrl: uploaded.thumbnailUrl,
      storagePath: uploaded.storagePath,
      // The form's explicit choice wins over the detected aspect ratio.
      videoFormat: data.videoFormat ?? draft.videoFormat,
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
    return figure;
  };
}
