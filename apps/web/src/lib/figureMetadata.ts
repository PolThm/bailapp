import type { Complexity, DanceStyle, DanceSubStyle, FigureType, VideoLanguage } from '@/types';

/**
 * The editable metadata of a figure, as a form holds it: strings throughout,
 * so an empty input and an absent value are the same thing until submit.
 */
export type FigureMetadataValues = {
  shortTitle: string;
  description: string;
  videoAuthor: string;
  startTime: string;
  endTime: string;
  previewStartTime: string;
  danceStyle?: DanceStyle;
  danceSubStyle?: DanceSubStyle;
  figureType?: FigureType;
  complexity?: Complexity;
  phrasesCount: string;
  videoLanguage?: VideoLanguage;
};

export const EMPTY_FIGURE_METADATA: FigureMetadataValues = {
  shortTitle: '',
  description: '',
  videoAuthor: '',
  startTime: '',
  endTime: '',
  previewStartTime: '',
  phrasesCount: '',
};
