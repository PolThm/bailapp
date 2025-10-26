export type DanceStyle = 'salsa' | 'bachata';

export type FigureType = 'figure' | 'basic-step' | 'complex-step' | 'combination';

export type Complexity =
  | 'basic'
  | 'basic-intermediate'
  | 'intermediate'
  | 'intermediate-advanced'
  | 'advanced';

export type VideoLanguage = 'french' | 'english' | 'spanish';

export type Visibility = 'public' | 'private' | 'unlisted';

export interface Figure {
  id: string;
  youtubeUrl: string;
  title: string;
  description?: string;
  videoAuthor?: string;
  startTime?: string; // Format: HH:MM:SS or MM:SS
  endTime?: string; // Format: HH:MM:SS or MM:SS
  danceStyle: DanceStyle;
  figureType: FigureType;
  complexity: Complexity;
  phrasesCount: number; // Number of 8-count phrases
  videoLanguage: VideoLanguage;
  visibility: Visibility;
  importedBy: string;
  createdAt: string;
}

