export type DanceStyle = 'salsa' | 'bachata';

export type FigureType = 'figure' | 'basic-step' | 'complex-step' | 'mix';

export type Complexity =
  | 'basic'
  | 'basic-intermediate'
  | 'intermediate'
  | 'intermediate-advanced'
  | 'advanced';

export type VideoLanguage = 'french' | 'english' | 'spanish' | 'italian';

export type VideoFormat = 'classic' | 'short';

/** Where a figure's video actually lives. Absent means 'youtube' (the static catalogue). */
export type VideoSource = 'youtube' | 'upload';

/** Lifecycle of a user-uploaded video. */
export type FigureProcessingStatus = 'uploading' | 'ready' | 'failed';

/** Review state for a figure its owner submitted to the public catalogue. */
export type ModerationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type Visibility = 'public' | 'private' | 'unlisted';

export type DanceSubStyle =
  // Salsa
  | 'cuban'
  | 'la-style'
  | 'ny-style'
  | 'puerto-rican'
  | 'colombian'
  | 'rueda-de-casino'
  | 'romantica'
  // Bachata
  | 'dominican'
  | 'modern'
  | 'sensual'
  | 'urban'
  | 'fusion'
  | 'ballroom';

export interface Figure {
  id: string;
  /**
   * Present for YouTube-backed figures (the whole static catalogue).
   * Optional since figures can now also be user uploads — read it through the
   * helpers in `@/utils/figureVideo` rather than directly.
   */
  youtubeUrl?: string;
  shortTitle: string;
  fullTitle: string;
  description?: string;
  videoAuthor?: string;
  startTime?: string; // Format: HH:MM:SS or MM:SS
  endTime?: string; // Format: HH:MM:SS or MM:SS
  previewStartTime?: string; // Format: HH:MM:SS or MM:SS (default: startTime + 10s for videos, startTime for shorts)
  danceStyle: DanceStyle;
  danceSubStyle?: DanceSubStyle;
  figureType?: FigureType;
  complexity: Complexity;
  phrasesCount?: number; // Number of 8-count phrases
  videoLanguage: VideoLanguage;
  visibility: Visibility;
  importedBy: string;
  createdAt: string;
  lastOpenedAt?: string;

  // --- User-uploaded videos (Firebase Storage) ---------------------------
  /** Defaults to 'youtube' when absent, so the static lists need no migration. */
  videoSource?: VideoSource;
  /** Storage download URL of the video itself. */
  videoUrl?: string;
  /** Storage download URL of the poster frame generated at upload time. */
  thumbnailUrl?: string;
  /** Storage path, kept so the objects can be deleted alongside the document. */
  storagePath?: string;
  /** Explicit format for uploads; YouTube figures still fall back to URL sniffing. */
  videoFormat?: VideoFormat;
  durationSeconds?: number;
  /** Pixel dimensions of the stored video, so its real shape is known when rendering. */
  width?: number;
  height?: number;
  ownerId?: string;
  processingStatus?: FigureProcessingStatus;
  moderationStatus?: ModerationStatus;
}

export type MentionType = 'choreography' | 'figure';

export interface ChoreographyMovement {
  id: string;
  name: string;
  order: number;
  mentionId?: string; // ID of the mentioned choreography or figure
  mentionType?: MentionType; // Type of the mention: 'choreography' or 'figure'
}

export type ChoreographySharingMode = 'view-only' | 'collaborative';

export interface Choreography {
  id: string;
  name: string;
  danceStyle: DanceStyle;
  danceSubStyle?: DanceSubStyle;
  complexity?: Complexity;
  phrasesCount?: number;
  movements: ChoreographyMovement[];
  createdAt: string;
  lastOpenedAt?: string;
  isPublic?: boolean;
  ownerId?: string; // ID of the user who owns this choreography
  sharingMode?: ChoreographySharingMode; // 'view-only' or 'collaborative'
  followedBy?: string[]; // IDs of users who follow this choreography
}
