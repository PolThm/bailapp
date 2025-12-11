import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Figure } from '@/types';
import { AdvancedFiltersModal } from '@/components/AdvancedFiltersModal';
import { AuthModal } from '@/components/AuthModal';
import { ComingSoonModal } from '@/components/ComingSoonModal';
import { EmptyState } from '@/components/EmptyState';
import { FigureCard } from '@/components/FigureCard';
import { NewFigureModal, type NewFigureFormData } from '@/components/NewFigureModal';
import { ResultsSummary } from '@/components/ResultsSummary';
import { SearchAndFilters } from '@/components/SearchAndFilters';
import { ShortsCarousel } from '@/components/ShortsCarousel';
import { useAuth } from '@/context/AuthContext';
import { useFigureFilters } from '@/hooks/useFigureFilters';
import { useFigures } from '@/hooks/useFigures';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { getStorageKey, StorageKey } from '@/lib/storageKeys';
import { isEmpty } from '@/lib/utils';

// Fisher-Yates shuffle algorithm for randomizing array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function Discover() {
  const { t } = useTranslation();
  const { figures, shorts, addFigure } = useFigures();
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewFigureModal, setShowNewFigureModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImages, setShowImages] = useIndexedDB(
    getStorageKey(StorageKey.DISCOVER_SHOW_IMAGES),
    true
  );
  // Store the order of figure IDs to maintain stable order when figures are updated
  const figureOrderRef = useRef<Map<string, number>>(new Map());
  // Store the order of shorts IDs to maintain stable order when shorts are updated
  const shortsOrderRef = useRef<Map<string, number>>(new Map());

  // Check screen size for responsive carousel positioning
  const [screenSize, setScreenSize] = useState<'mobile' | 'sm' | 'md' | 'lg'>(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 'mobile'; // < sm
      if (width < 768) return 'sm'; // sm to md
      if (width < 1024) return 'md'; // md to lg
      return 'lg'; // >= lg
    }
    return 'mobile';
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('mobile');
      else if (width < 768) setScreenSize('sm');
      else if (width < 1024) setScreenSize('md');
      else setScreenSize('lg');
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const isMobilePortrait = screenSize === 'mobile';

  // First get filters without shorts
  const {
    selectedStyle,
    setSelectedStyle,
    searchQuery,
    setSearchQuery,
    advancedFilters,
    setAdvancedFilters,
    filteredFigures: filteredFiguresWithShorts,
    hasActiveFilters,
    clearFilters,
  } = useFigureFilters([...figures, ...shorts]);

  // Filter shorts based on device type
  // On mobile: exclude shorts from main grid (they appear in carousel sections)
  // On desktop: exclude shorts from main grid (they appear in a single carousel at the top)
  const filteredFigures = useMemo(() => {
    if (searchQuery.trim() || !showImages) {
      // Keep shorts in search results or when images are hidden
      return filteredFiguresWithShorts;
    }
    // Always exclude shorts from main grid (they appear in carousels)
    return filteredFiguresWithShorts.filter(
      (figure) => !shorts.some((short) => short.id === figure.id)
    );
  }, [filteredFiguresWithShorts, shorts, searchQuery, showImages]);

  // Maintain stable random order of figures - shuffle once and maintain that order through filters
  const shuffledFigures = useMemo(() => {
    // Only reshuffle if it's a new page load (figureOrderRef is empty)
    if (figureOrderRef.current.size === 0) {
      // Get all figures (not just filtered ones) to establish initial order
      const allFigures = [...figures, ...shorts];
      const shuffled = shuffleArray(allFigures);
      // Store the order by ID
      shuffled.forEach((figure, index) => {
        figureOrderRef.current.set(figure.id, index);
      });
    }

    // Only reshuffle shorts if it's a new page load (shortsOrderRef is empty)
    if (shortsOrderRef.current.size === 0) {
      // Get all shorts to establish initial order
      const shuffledShorts = shuffleArray([...shorts]);
      // Store the order by ID
      shuffledShorts.forEach((short, index) => {
        shortsOrderRef.current.set(short.id, index);
      });
    }

    // Apply the stored random order to filtered figures
    const orderedFigures = [...filteredFigures].sort((a, b) => {
      const orderA = figureOrderRef.current.get(a.id) ?? Infinity;
      const orderB = figureOrderRef.current.get(b.id) ?? Infinity;
      return orderA - orderB;
    });

    // Add any new figures that weren't in the original order at the end
    const newFigures = filteredFigures.filter((f) => !figureOrderRef.current.has(f.id));
    return [...orderedFigures, ...newFigures];
  }, [filteredFigures, figures, shorts]);

  // Filter shorts with the same filters as figures
  const filteredShorts = useMemo(() => {
    let filtered = shorts;

    // Filter by dance style
    if (selectedStyle !== 'all') {
      filtered = filtered.filter((short) => short.danceStyle === selectedStyle);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (short) =>
          short.shortTitle.toLowerCase().includes(query) ||
          short.fullTitle.toLowerCase().includes(query) ||
          (short.description && short.description.toLowerCase().includes(query))
      );
    }

    // Apply advanced filters
    if (advancedFilters.figureType) {
      filtered = filtered.filter((short) => short.figureType === advancedFilters.figureType);
    }

    if (advancedFilters.complexity) {
      filtered = filtered.filter((short) => short.complexity === advancedFilters.complexity);
    }

    if (advancedFilters.videoLanguage) {
      filtered = filtered.filter((short) => short.videoLanguage === advancedFilters.videoLanguage);
    }

    if (advancedFilters.videoFormat) {
      // Shorts are always shorts, so only show them if format is 'short'
      if (advancedFilters.videoFormat === 'classic') {
        return []; // No shorts if filtering for classic videos only
      }
      // If filtering for 'short', keep all shorts (they're already shorts)
    }

    if (advancedFilters.danceSubStyle) {
      filtered = filtered.filter((short) => short.danceSubStyle === advancedFilters.danceSubStyle);
    }

    return filtered;
  }, [shorts, selectedStyle, searchQuery, advancedFilters]);

  // Distribute shorts uniquely across sections (4 per section on mobile)
  // If the last section has fewer than 3 shorts, merge it into the previous one
  const distributedShortsBySection = useMemo(() => {
    if (!filteredShorts.length) return [];

    // Apply the stored random order to filtered shorts
    const orderedShorts = [...filteredShorts].sort((a, b) => {
      const orderA = shortsOrderRef.current.get(a.id) ?? Infinity;
      const orderB = shortsOrderRef.current.get(b.id) ?? Infinity;
      return orderA - orderB;
    });

    const SHORTS_PER_SECTION = 4;
    const sections: Figure[][] = [];

    // Distribute shorts into sections of 4
    for (let i = 0; i < orderedShorts.length; i += SHORTS_PER_SECTION) {
      const section = orderedShorts.slice(i, i + SHORTS_PER_SECTION);
      sections.push(section);
    }

    // If the last section has fewer than 3 shorts, merge it with the previous section
    // This keeps the display clean and avoids a tiny final section
    if (sections.length > 1) {
      const lastSection = sections[sections.length - 1];
      if (lastSection.length < 3) {
        const secondToLastSection = sections[sections.length - 2];
        sections[sections.length - 2] = [...secondToLastSection, ...lastSection];
        sections.pop();
      }
    }

    return sections;
  }, [filteredShorts]);

  // Shuffle shorts for desktop display
  const shuffledFilteredShorts = useMemo(() => {
    // Apply the stored random order to filtered shorts
    const orderedShorts = [...filteredShorts].sort((a, b) => {
      const orderA = shortsOrderRef.current.get(a.id) ?? Infinity;
      const orderB = shortsOrderRef.current.get(b.id) ?? Infinity;
      return orderA - orderB;
    });

    // Add any new shorts that weren't in the original order at the end
    const newShorts = filteredShorts.filter((s) => !shortsOrderRef.current.has(s.id));
    return [...orderedShorts, ...newShorts];
  }, [filteredShorts]);

  // Helper function to get shorts for a specific section
  const getShortsForSection = (sectionIndex: number): Figure[] => {
    return distributedShortsBySection[sectionIndex] || [];
  };

  // Calculate valid positions for shorts sections (mobile only)
  // Skip the first section (index 0) as it's displayed at the top
  const shortsSectionPositions = useMemo(() => {
    if (!distributedShortsBySection.length || screenSize !== 'mobile') return [];
    if (distributedShortsBySection.length <= 1) return []; // Only first section, no intercalated sections

    const positions: number[] = [];
    // Mobile: After 2nd figure (index 1), then with increasing intervals
    // Positions: 1, 4 (1+3), 8 (4+4), 13 (8+5), 19 (13+6), etc.
    // Start from section index 1 (skip first section which is at the top)
    let currentPos = 1;
    let interval = 3;
    for (let i = 1; i < distributedShortsBySection.length; i++) {
      positions.push(currentPos);
      if (i < distributedShortsBySection.length - 1) {
        currentPos += interval;
        interval++;
      }
    }

    return positions;
  }, [distributedShortsBySection.length, screenSize]);

  const handleAddFigure = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowComingSoonModal(true);
    }
  };

  const handleSubmitFigure = (data: NewFigureFormData) => {
    const newFigure: Figure = {
      id: `figure-${Date.now()}`,
      ...data,
      importedBy: user?.displayName || 'User',
      createdAt: new Date().toISOString(),
    };
    addFigure(newFigure);
    setShowNewFigureModal(false);
  };

  return (
    <>
      {/* Header */}
      <div className="pb-3">
        <h1 className="text-3xl font-bold">{t('discover.title')}</h1>
        <p className="mt-1 text-muted-foreground">{t('discover.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="mb-5 space-y-4">
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStyle={selectedStyle}
          onStyleChange={setSelectedStyle}
          advancedFilters={advancedFilters}
          onAdvancedFiltersClick={() => setShowAdvancedFilters(true)}
          showImages={showImages}
          onShowImagesChange={setShowImages}
        />

        {/* Results Summary */}
        {hasActiveFilters && (
          <ResultsSummary
            count={shuffledFigures.length + filteredShorts.length}
            onClear={clearFilters}
          />
        )}
      </div>

      {/* Desktop Shorts Carousel - Single carousel at the top with all shorts */}
      {!isMobilePortrait &&
        shuffledFilteredShorts.length > 0 &&
        showImages &&
        !searchQuery.trim() && (
          <div className="mb-6">
            <ShortsCarousel shorts={shuffledFilteredShorts} />
          </div>
        )}

      {/* Mobile Shorts Carousel - First carousel at the top with 3 shorts */}
      {isMobilePortrait &&
        filteredShorts.length > 0 &&
        showImages &&
        !searchQuery.trim() &&
        distributedShortsBySection.length > 0 && (
          <div className="mb-6">
            <ShortsCarousel shorts={distributedShortsBySection[0] || []} />
          </div>
        )}

      {/* Figures Grid */}
      {isEmpty(shuffledFigures) && isEmpty(filteredShorts) ? (
        <EmptyState
          icon={Plus}
          title={!hasActiveFilters ? t('discover.empty.title') : t('discover.empty.filtered.title')}
          description={
            !hasActiveFilters
              ? t('discover.empty.description')
              : t('discover.empty.filtered.description')
          }
          actionLabel={t('discover.empty.action')}
          onAction={handleAddFigure}
        />
      ) : isEmpty(shuffledFigures) &&
        filteredShorts.length > 0 &&
        isMobilePortrait &&
        showImages ? (
        // Special case: only shorts to display on mobile
        // Skip first section (index 0) as it's already displayed at the top
        <div className="space-y-6">
          {distributedShortsBySection.slice(1).map((sectionShorts, sectionIndex) => (
            <ShortsCarousel key={`shorts-section-${sectionIndex + 1}`} shorts={sectionShorts} />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
            {shuffledFigures
              .map((figure, index) => {
                const elements = [
                  <FigureCard key={figure.id} figure={figure} showImage={showImages} />,
                ];

                // YouTube Shorts Section (mobile only)
                // Mobile: After 2nd figure (index 1), then with increasing intervals (1, 4, 8, 13, etc.)
                const shouldShowShorts = (() => {
                  if (
                    !isMobilePortrait ||
                    !shortsSectionPositions.length ||
                    searchQuery.trim() ||
                    !showImages
                  )
                    return false;

                  // Check if current index matches a valid shorts position
                  return shortsSectionPositions.includes(index);
                })();

                if (shouldShowShorts) {
                  // Find the section number for this position
                  // Add 1 because positions array starts from section index 1 (first section is at top)
                  const sectionNumber = shortsSectionPositions.indexOf(index) + 1;

                  // Make sure section number is valid
                  if (sectionNumber >= 1 && sectionNumber < distributedShortsBySection.length) {
                    // Get shorts for this section (already distributed uniquely)
                    const sectionShorts = getShortsForSection(sectionNumber);

                    // Only show section if it has enough shorts
                    if (sectionShorts.length > 0) {
                      elements.push(
                        <ShortsCarousel key={`shorts-${index}`} shorts={sectionShorts} />
                      );
                    }
                  }
                }

                return elements;
              })
              .flat()}
          </div>

          {/* Show remaining shorts sections after the grid (mobile only) if there are filters and shorts that weren't displayed */}
          {hasActiveFilters &&
            isMobilePortrait &&
            showImages &&
            distributedShortsBySection.length > 1 &&
            shuffledFigures.length < distributedShortsBySection.length - 1 && (
              <div className="mt-6 space-y-6">
                {distributedShortsBySection
                  .slice(
                    Math.max(
                      1, // Start from section index 1 (skip first section at top)
                      shortsSectionPositions.filter((pos) => pos < shuffledFigures.length).length +
                        1
                    )
                  )
                  .map((sectionShorts, index) => (
                    <ShortsCarousel key={`remaining-shorts-${index}`} shorts={sectionShorts} />
                  ))}
              </div>
            )}
        </>
      )}

      {/* Auth Dialog */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Coming Soon Modal */}
      <ComingSoonModal open={showComingSoonModal} onClose={() => setShowComingSoonModal(false)} />

      {/* New Figure Modal */}
      <NewFigureModal
        open={showNewFigureModal}
        onClose={() => setShowNewFigureModal(false)}
        onSubmit={handleSubmitFigure}
      />

      {/* Advanced Filters Modal */}
      <AdvancedFiltersModal
        open={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={advancedFilters}
        onFiltersChange={setAdvancedFilters}
        onApply={() => setShowAdvancedFilters(false)}
        selectedStyle={selectedStyle}
      />
    </>
  );
}
