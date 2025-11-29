import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DanceStyleBadge,
  DanceSubStyleBadge,
  ComplexityBadge,
} from '@/components/ui/badge';
import { Clock, Users } from 'lucide-react';
import type { Choreography } from '@/types';

interface ChoreographyCardProps {
  choreography: Choreography;
  isFollowed?: boolean;
}

export function ChoreographyCard({ choreography, isFollowed = false }: ChoreographyCardProps) {
  // Build the link URL - include ownerId if it's a followed choreography
  const linkUrl = isFollowed && choreography.ownerId
    ? `/choreography/${choreography.id}?ownerId=${choreography.ownerId}`
    : `/choreography/${choreography.id}`;

  return (
    <Link
      to={linkUrl}
      className="touch-manipulation active:scale-[0.98] transition-transform"
    >
      <Card className="h-full transition-shadow hover:shadow-lg border-2 hover:border-primary/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-2 text-base leading-tight flex-1 min-w-0">
              {choreography.name}
            </h3>
            {isFollowed && (
              <Users className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" aria-label="Followed" />
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            <DanceStyleBadge style={choreography.danceStyle} />
            {choreography.danceSubStyle && (
              <DanceSubStyleBadge
                style={choreography.danceStyle}
                subStyle={choreography.danceSubStyle}
              />
            )}
            {choreography.complexity && (
              <ComplexityBadge complexity={choreography.complexity} />
            )}
          </div>

          {/* Phrases Count */}
          {choreography.phrasesCount !== undefined && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium flex items-center gap-1">
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

