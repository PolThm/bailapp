export type DanceStyle = 'salsa' | 'bachata';

export type FigureType = 'figure' | 'basic-step' | 'complex-step' | 'mix';

export type Complexity =
  | 'basic'
  | 'basic-intermediate'
  | 'intermediate'
  | 'intermediate-advanced'
  | 'advanced';

export type VideoLanguage = 'french' | 'english' | 'spanish';

export type Visibility = 'public' | 'private' | 'unlisted';

export type DanceSubStyle = 
  // Salsa
  | 'cuban' | 'la-style' | 'ny-style' | 'puerto-rican' | 'colombian' | 'rueda-de-casino' | 'romantica'
  // Bachata
  | 'dominican' | 'modern' | 'sensual' | 'urban' | 'fusion' | 'ballroom';

export interface Figure {
  id: string;
  youtubeUrl: string;
  shortTitle: string;
  fullTitle: string;
  description?: string;
  videoAuthor?: string;
  startTime?: string; // Format: HH:MM:SS or MM:SS
  endTime?: string; // Format: HH:MM:SS or MM:SS
  danceStyle: DanceStyle;
  danceSubStyle?: DanceSubStyle;
  figureType: FigureType;
  complexity: Complexity;
  phrasesCount: number; // Number of 8-count phrases
  videoLanguage: VideoLanguage;
  visibility: Visibility;
  importedBy: string;
  createdAt: string;
}

export interface ChoreographyMovement {
  id: string;
  name: string;
  order: number;
}

export interface Choreography {
  id: string;
  name: string;
  danceStyle: DanceStyle;
  danceSubStyle?: DanceSubStyle;
  complexity?: Complexity;
  phrasesCount?: number;
  movements: ChoreographyMovement[];
  createdAt: string;
}

