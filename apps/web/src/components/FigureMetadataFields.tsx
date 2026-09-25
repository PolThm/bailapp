import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { EmbeddedVideoSource } from '@/hooks/useEmbeddedPlayer';
import type { FigureMetadataValues } from '@/lib/figureMetadata';
import type { Complexity, DanceSubStyle, FigureType, VideoFormat, VideoLanguage } from '@/types';
import { Collapsible } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { VideoTrimmer } from '@/components/VideoTrimmer';

/**
 * The metadata half of a figure form: everything that is not the video itself.
 *
 * Shared by creation and editing so the two cannot drift apart - they describe
 * the same object, and a field added to one has to exist in the other.
 */

interface FigureMetadataFieldsProps {
  values: FigureMetadataValues;
  onChange: (patch: Partial<FigureMetadataValues>) => void;
  errors: Record<string, string>;
  /** Rendered beside the title label; used to show the YouTube lookup spinner. */
  titleAdornment?: ReactNode;
  /** Fires on the first title keystroke, so autofill can stop overwriting it. */
  onTitleChange?: () => void;
  /** The figure's video, needed to pick the excerpt on it. */
  video?: { source: EmbeddedVideoSource; format: VideoFormat };
}

export function FigureMetadataFields({
  values: form,
  onChange: update,
  errors,
  titleAdornment,
  onTitleChange,
  video,
}: FigureMetadataFieldsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="shortTitle">
          {t('newFigure.figureTitle')} {t('newFigure.required')}
          {titleAdornment}
        </Label>
        <Input
          id="shortTitle"
          placeholder={t('newFigure.titlePlaceholder')}
          value={form.shortTitle}
          onChange={(e) => {
            onTitleChange?.();
            update({ shortTitle: e.target.value });
          }}
          className={errors.shortTitle ? 'border-destructive' : ''}
        />
        {errors.shortTitle && <p className="text-sm text-destructive">{errors.shortTitle}</p>}
      </div>

      {/* Dance style */}
      <div className="space-y-2">
        <Label htmlFor="danceStyle">
          {t('newFigure.danceStyle')} {t('newFigure.required')}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {(['salsa', 'bachata'] as const).map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => update({ danceStyle: style, danceSubStyle: undefined })}
              className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                form.danceStyle === style
                  ? 'border-primary bg-primary/10 text-foreground'
                  : errors.danceStyle
                    ? 'border-destructive text-muted-foreground'
                    : 'border-input text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(`badges.danceStyle.${style}`)}
            </button>
          ))}
        </div>
        {errors.danceStyle && <p className="text-sm text-destructive">{errors.danceStyle}</p>}
      </div>

      {/* Everything below is optional */}
      <Collapsible title={t('newFigure.moreOptions')} hint={t('newFigure.moreOptionsHint')}>
        <div className="space-y-2">
          <Label htmlFor="description">{t('newFigure.description')}</Label>
          <Textarea
            id="description"
            placeholder={t('newFigure.descriptionPlaceholder')}
            rows={3}
            value={form.description}
            onChange={(e) => update({ description: e.target.value })}
          />
        </div>

        {form.danceStyle && (
          <div className="space-y-2">
            <Label>{t('newFigure.danceSubStyle')}</Label>
            <Select
              value={form.danceSubStyle}
              onValueChange={(value) => update({ danceSubStyle: value as DanceSubStyle })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('newFigure.danceSubStylePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {(form.danceStyle === 'salsa'
                  ? ([
                      ['cuban', 'cuban'],
                      ['la-style', 'la-style'],
                      ['ny-style', 'ny-style'],
                      ['puerto-rican', 'puerto-rican'],
                      ['colombian', 'colombian'],
                      ['rueda-de-casino', 'ruedadecasino'],
                      ['romantica', 'romantica'],
                    ] as const)
                  : ([
                      ['dominican', 'dominican'],
                      ['modern', 'modern'],
                      ['sensual', 'sensual'],
                      ['urban', 'urban'],
                      ['fusion', 'fusion'],
                      ['ballroom', 'ballroom'],
                    ] as const)
                ).map(([value, key]) => (
                  <SelectItem key={value} value={value}>
                    {t(`badges.danceSubStyle.${key}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>{t('newFigure.complexity')}</Label>
          <Select
            value={form.complexity}
            onValueChange={(value) => update({ complexity: value as Complexity })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('newFigure.complexityPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">{t('badges.complexity.basic')}</SelectItem>
              <SelectItem value="basic-intermediate">
                {t('badges.complexity.basicIntermediate')}
              </SelectItem>
              <SelectItem value="intermediate">{t('badges.complexity.intermediate')}</SelectItem>
              <SelectItem value="intermediate-advanced">
                {t('badges.complexity.intermediateAdvanced')}
              </SelectItem>
              <SelectItem value="advanced">{t('badges.complexity.advanced')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('newFigure.figureType')}</Label>
          <Select
            value={form.figureType}
            onValueChange={(value) => update({ figureType: value as FigureType })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('newFigure.figureTypePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="figure">{t('badges.figureType.figure')}</SelectItem>
              <SelectItem value="basic-step">{t('badges.figureType.basicStep')}</SelectItem>
              <SelectItem value="complex-step">{t('badges.figureType.complexStep')}</SelectItem>
              <SelectItem value="mix">{t('badges.figureType.mix')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('videoTrimmer.excerpt')}</Label>
          {video ? (
            <VideoTrimmer
              key={video.source.kind === 'youtube' ? video.source.videoId : video.source.url}
              source={video.source}
              format={video.format}
              start={form.startTime}
              end={form.endTime}
              onChange={(range) => update({ startTime: range.start, endTime: range.end })}
              previewStart={form.previewStartTime}
              onPreviewStartChange={(previewStartTime) => update({ previewStartTime })}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t('videoTrimmer.needsVideo')}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phrasesCount">{t('newFigure.phrasesCount')}</Label>
          <Input
            id="phrasesCount"
            type="number"
            min="1"
            placeholder={t('newFigure.phrasesCountPlaceholder')}
            value={form.phrasesCount}
            onChange={(e) => update({ phrasesCount: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="videoAuthor">{t('newFigure.videoAuthor')}</Label>
          <Input
            id="videoAuthor"
            placeholder={t('newFigure.videoAuthorPlaceholder')}
            value={form.videoAuthor}
            onChange={(e) => update({ videoAuthor: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('newFigure.videoLanguage')}</Label>
          <Select
            value={form.videoLanguage}
            onValueChange={(value) => update({ videoLanguage: value as VideoLanguage })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('newFigure.videoLanguagePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="french">🇫🇷 {t('badges.videoLanguage.french')}</SelectItem>
              <SelectItem value="english">🇬🇧 {t('badges.videoLanguage.english')}</SelectItem>
              <SelectItem value="spanish">🇪🇸 {t('badges.videoLanguage.spanish')}</SelectItem>
              <SelectItem value="italian">🇮🇹 {t('badges.videoLanguage.italian')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Collapsible>
    </>
  );
}
