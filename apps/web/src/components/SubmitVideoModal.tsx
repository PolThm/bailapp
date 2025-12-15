import { useState, useEffect } from 'react';
import { Loader } from './Loader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { createVideoPR } from '@/lib/services/githubService';
import { getYouTubeVideoId, getYouTubeThumbnail } from '@/utils/youtube';

interface SubmitVideoModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubmitVideoModal({ open, onClose }: SubmitVideoModalProps) {
  const [formData, setFormData] = useState({
    youtubeUrl: '',
    shortTitle: '',
    fullTitle: '',
    description: '',
    videoAuthor: '',
    startTime: '',
    endTime: '',
    previewStartDelay: '',
    danceStyle: 'salsa' as 'salsa' | 'bachata',
    danceSubStyle: '',
    figureType: '',
    complexity: 'basic',
    phrasesCount: '',
    videoLanguage: 'english',
    videoFormat: 'classic' as 'classic' | 'short',
  });

  const [videoId, setVideoId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    prUrl?: string;
    error?: string;
  } | null>(null);

  // Auto-detect video format and extract video ID
  useEffect(() => {
    if (formData.youtubeUrl) {
      const id = getYouTubeVideoId(formData.youtubeUrl);
      setVideoId(id);

      // Detect if it's a short
      const isShort = formData.youtubeUrl.includes('/shorts/');
      setFormData((prev) => ({ ...prev, videoFormat: isShort ? 'short' : 'classic' }));
    } else {
      setVideoId(null);
    }
  }, [formData.youtubeUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSubmitResult(null);

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.youtubeUrl) newErrors.youtubeUrl = 'YouTube URL is required';
    if (!formData.shortTitle) newErrors.shortTitle = 'Short title is required';
    if (!formData.fullTitle) newErrors.fullTitle = 'Full title is required';
    if (!formData.danceStyle) newErrors.danceStyle = 'Dance style is required';
    if (!formData.complexity) newErrors.complexity = 'Complexity is required';
    if (!formData.videoLanguage) newErrors.videoLanguage = 'Video language is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createVideoPR({
        youtubeUrl: formData.youtubeUrl,
        shortTitle: formData.shortTitle,
        fullTitle: formData.fullTitle,
        description: formData.description || undefined,
        videoAuthor: formData.videoAuthor || undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        previewStartDelay: formData.previewStartDelay
          ? parseInt(formData.previewStartDelay)
          : undefined,
        danceStyle: formData.danceStyle,
        danceSubStyle: formData.danceSubStyle || undefined,
        figureType: formData.figureType || undefined,
        complexity: formData.complexity,
        phrasesCount: formData.phrasesCount ? parseInt(formData.phrasesCount) : undefined,
        videoLanguage: formData.videoLanguage,
        videoFormat: formData.videoFormat,
      });

      setSubmitResult({ success: true, prUrl: result.prUrl });
    } catch (error: any) {
      setSubmitResult({
        success: false,
        error: error.message || 'Failed to create pull request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      youtubeUrl: '',
      shortTitle: '',
      fullTitle: '',
      description: '',
      videoAuthor: '',
      startTime: '',
      endTime: '',
      previewStartDelay: '',
      danceStyle: 'salsa',
      danceSubStyle: '',
      figureType: '',
      complexity: 'basic',
      phrasesCount: '',
      videoLanguage: 'english',
      videoFormat: 'classic',
    });
    setVideoId(null);
    setErrors({});
    setSubmitResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader onClose={handleClose}>
          <DialogTitle>Submit Video</DialogTitle>
          <DialogDescription>
            Submit a new video to be added to the app via a GitHub Pull Request
          </DialogDescription>
        </DialogHeader>

        {submitResult?.success ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ✅ Pull Request created successfully!
              </p>
            </div>
            {submitResult.prUrl && (
              <div className="space-y-2">
                <p className="text-sm">Your PR has been created:</p>
                <a
                  href={submitResult.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm text-primary underline"
                >
                  {submitResult.prUrl}
                </a>
              </div>
            )}
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : submitResult?.error ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                ❌ Error: {submitResult.error}
              </p>
            </div>
            <Button onClick={() => setSubmitResult(null)} className="w-full">
              Try Again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* YouTube URL */}
            <div className="space-y-2">
              <Label htmlFor="youtubeUrl">
                YouTube URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="youtubeUrl"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.youtubeUrl}
                onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
                className={errors.youtubeUrl ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.youtubeUrl && <p className="text-sm text-destructive">{errors.youtubeUrl}</p>}
            </div>

            {/* Thumbnail Preview */}
            {videoId && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <img
                  src={getYouTubeThumbnail(videoId)}
                  alt="Video thumbnail"
                  className="w-full rounded-md"
                />
              </div>
            )}

            {/* Video Format */}
            <div className="space-y-2">
              <Label htmlFor="videoFormat">Video Format</Label>
              <Select
                value={formData.videoFormat}
                onValueChange={(value) =>
                  setFormData({ ...formData, videoFormat: value as 'classic' | 'short' })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classic Video</SelectItem>
                  <SelectItem value="short">YouTube Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Short Title */}
            <div className="space-y-2">
              <Label htmlFor="shortTitle">
                Short Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shortTitle"
                placeholder="Brief title"
                value={formData.shortTitle}
                onChange={(e) => setFormData({ ...formData, shortTitle: e.target.value })}
                className={errors.shortTitle ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.shortTitle && <p className="text-sm text-destructive">{errors.shortTitle}</p>}
            </div>

            {/* Full Title */}
            <div className="space-y-2">
              <Label htmlFor="fullTitle">
                Full Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fullTitle"
                placeholder="Complete video title"
                value={formData.fullTitle}
                onChange={(e) => setFormData({ ...formData, fullTitle: e.target.value })}
                className={errors.fullTitle ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.fullTitle && <p className="text-sm text-destructive">{errors.fullTitle}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this video teach?"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Video Author */}
            <div className="space-y-2">
              <Label htmlFor="videoAuthor">Video Author (Channel Name)</Label>
              <Input
                id="videoAuthor"
                placeholder="Channel name"
                value={formData.videoAuthor}
                onChange={(e) => setFormData({ ...formData, videoAuthor: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time (M:SS)</Label>
                <Input
                  id="startTime"
                  placeholder="0:15"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time (M:SS)</Label>
                <Input
                  id="endTime"
                  placeholder="2:30"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Preview Start Delay */}
            <div className="space-y-2">
              <Label htmlFor="previewStartDelay">Preview Start Delay (seconds)</Label>
              <Input
                id="previewStartDelay"
                type="number"
                placeholder="5"
                value={formData.previewStartDelay}
                onChange={(e) => setFormData({ ...formData, previewStartDelay: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Dance Style */}
            <div className="space-y-2">
              <Label htmlFor="danceStyle">
                Dance Style <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.danceStyle}
                onValueChange={(value) =>
                  setFormData({ ...formData, danceStyle: value as 'salsa' | 'bachata' })
                }
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.danceStyle ? 'border-destructive' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salsa">Salsa</SelectItem>
                  <SelectItem value="bachata">Bachata</SelectItem>
                </SelectContent>
              </Select>
              {errors.danceStyle && <p className="text-sm text-destructive">{errors.danceStyle}</p>}
            </div>

            {/* Dance Sub-Style */}
            <div className="space-y-2">
              <Label htmlFor="danceSubStyle">Dance Sub-Style</Label>
              <Input
                id="danceSubStyle"
                placeholder="e.g., cuban, modern, sensual"
                value={formData.danceSubStyle}
                onChange={(e) => setFormData({ ...formData, danceSubStyle: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Figure Type */}
            <div className="space-y-2">
              <Label htmlFor="figureType">Figure Type</Label>
              <Input
                id="figureType"
                placeholder="e.g., figure"
                value={formData.figureType}
                onChange={(e) => setFormData({ ...formData, figureType: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Complexity */}
            <div className="space-y-2">
              <Label htmlFor="complexity">
                Complexity <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.complexity}
                onValueChange={(value) => setFormData({ ...formData, complexity: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.complexity ? 'border-destructive' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="basic-intermediate">Basic-Intermediate</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="intermediate-advanced">Intermediate-Advanced</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              {errors.complexity && <p className="text-sm text-destructive">{errors.complexity}</p>}
            </div>

            {/* Phrases Count */}
            <div className="space-y-2">
              <Label htmlFor="phrasesCount">Phrases Count (8-count beats)</Label>
              <Input
                id="phrasesCount"
                type="number"
                min="1"
                placeholder="4"
                value={formData.phrasesCount}
                onChange={(e) => setFormData({ ...formData, phrasesCount: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            {/* Video Language */}
            <div className="space-y-2">
              <Label htmlFor="videoLanguage">
                Video Language <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.videoLanguage}
                onValueChange={(value) => setFormData({ ...formData, videoLanguage: value })}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="italian">Italian</SelectItem>
                </SelectContent>
              </Select>
              {errors.videoLanguage && (
                <p className="text-sm text-destructive">{errors.videoLanguage}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? <Loader className="h-4 w-4" /> : 'Submit PR'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
