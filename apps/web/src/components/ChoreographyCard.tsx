import { Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Choreography } from '@/types';
import { DanceStyleBadge, DanceSubStyleBadge, ComplexityBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ChoreographyCardProps {
  choreography: Choreography;
  isFollowed?: boolean;
}

export function ChoreographyCard({ choreography, isFollowed = false }: ChoreographyCardProps) {
  // Build the link URL - include ownerId if it's a followed choreography
  const linkUrl =
    isFollowed && choreography.ownerId
      ? `/choreography/${choreography.id}?ownerId=${choreography.ownerId}`
      : `/choreography/${choreography.id}`;

  return (
    <Link to={linkUrl} className="touch-manipulation transition-transform active:scale-[0.98]">
      <Card className="h-full overflow-hidden border-2 transition-shadow hover:border-primary/50 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 min-w-0 flex-1 text-base font-semibold leading-tight">
              {choreography.name}
            </h3>
            {(isFollowed || choreography.isPublic) && (
              <Users
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive"
                aria-label={isFollowed ? 'Followed' : 'Shared'}
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            <DanceStyleBadge style={choreography.danceStyle} />
            {choreography.danceSubStyle && (
              <DanceSubStyleBadge
                style={choreography.danceStyle}
                subStyle={choreography.danceSubStyle}
              />
            )}
            {choreography.complexity && <ComplexityBadge complexity={choreography.complexity} />}
          </div>

          {/* Phrases Count */}
          {choreography.phrasesCount !== undefined && (
            <div className="text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="h-4 w-4" />
                {choreography.phrasesCount} phrases
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
