import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

const functions = getFunctions(app);

export interface VideoSubmissionData {
  youtubeUrl: string;
  shortTitle: string;
  fullTitle: string;
  description?: string;
  videoAuthor?: string;
  startTime?: string;
  endTime?: string;
  previewStartDelay?: number;
  danceStyle: 'salsa' | 'bachata';
  danceSubStyle?: string;
  figureType?: string;
  complexity: string;
  phrasesCount?: number;
  videoLanguage: string;
  videoFormat: 'classic' | 'short';
}

export interface CreatePRResponse {
  success: boolean;
  prUrl: string;
  prNumber: number;
}

export async function createVideoPR(data: VideoSubmissionData): Promise<CreatePRResponse> {
  const createVideoPRFunction = httpsCallable<VideoSubmissionData, CreatePRResponse>(
    functions,
    'createVideoPR'
  );

  const result = await createVideoPRFunction(data);
  return result.data;
}
