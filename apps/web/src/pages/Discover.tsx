import { useState, useMemo, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewFigureModal, setShowNewFigureModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImages, setShowImages] = useIndexedDB(
    getStorageKey(StorageKey.DISCOVER_SHOW_IMAGES),
    true
  );
  const [shuffleKey, setShuffleKey] = useState(0);
  // Store the order of figure IDs to maintain stable order when figures are updated
  const figureOrderRef = useRef<Map<string, number>>(new Map());
  const previousFilteredIdsRef = useRef<string>('');

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

  // Shuffle figures when arriving on the page or when filters change (only if no filters are active)
  useEffect(() => {
    if (!hasActiveFilters) {
      setShuffleKey(Date.now());
    }
  }, [location.pathname, hasActiveFilters]);

  // Maintain stable order of figures - only reshuffle when filters change or on initial load
  const shuffledFigures = useMemo(() => {
    const currentFilteredIds = filteredFigures.map((f) => f.id).join(',');
    const filtersChanged = currentFilteredIds !== previousFilteredIdsRef.current;

    if (hasActiveFilters) {
      // Don't shuffle when filters are active - keep consistent results
      previousFilteredIdsRef.current = currentFilteredIds;
      return filteredFigures;
    }

    // Only reshuffle if filters changed or it's a new page load
    if (filtersChanged || figureOrderRef.current.size === 0) {
      const shuffled = shuffleArray(filteredFigures);
      // Store the order by ID
      shuffled.forEach((figure, index) => {
        figureOrderRef.current.set(figure.id, index);
      });
      previousFilteredIdsRef.current = currentFilteredIds;
      return shuffled;
    }

    // Maintain the existing order even if figures are updated
    const orderedFigures = [...filteredFigures].sort((a, b) => {
      const orderA = figureOrderRef.current.get(a.id) ?? Infinity;
      const orderB = figureOrderRef.current.get(b.id) ?? Infinity;
      return orderA - orderB;
    });

    // Add any new figures that weren't in the original order at the end
    const newFigures = filteredFigures.filter((f) => !figureOrderRef.current.has(f.id));
    return [...orderedFigures, ...newFigures];
  }, [filteredFigures, hasActiveFilters, shuffleKey]);

  // Helper function to shuffle array with a seed for deterministic but different results
  const shuffleArrayWithSeed = <T,>(array: T[], seed: number): T[] => {
    const shuffled = [...array];
    // Use seed to initialize a pseudo-random generator
    let randomSeed = seed;
    const seededRandom = () => {
      randomSeed = (randomSeed * 9301 + 49297) % 233280;
      return randomSeed / 233280;
    };

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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

  // Distribute shorts uniquely across sections (3 per section)
  // If last section has less than 3, merge with second-to-last section
  const distributedShortsBySection = useMemo(() => {
    if (!filteredShorts.length) return [];

    // Shuffle all shorts once with the shuffleKey
    const shuffledShorts = shuffleArrayWithSeed(filteredShorts, shuffleKey);

    const SHORTS_PER_SECTION = 3;
    const sections: Figure[][] = [];

    // Distribute shorts into sections of 3
    for (let i = 0; i < shuffledShorts.length; i += SHORTS_PER_SECTION) {
      const section = shuffledShorts.slice(i, i + SHORTS_PER_SECTION);
      sections.push(section);
    }

    // If last section has less than 3, merge with second-to-last section
    // BUT only if we have filters active (when no filters, we want clean sections of 3)
    if (sections.length > 1 && hasActiveFilters) {
      const lastSection = sections[sections.length - 1];
      if (lastSection.length < 3) {
        const secondToLastSection = sections[sections.length - 2];
        sections[sections.length - 2] = [...secondToLastSection, ...lastSection];
        sections.pop();
      }
    }

    // When filters are active, keep all sections even if they have less than 3 shorts
    // Otherwise, only keep sections with at least 3 shorts for clean display
    if (hasActiveFilters) {
      return sections; // Keep all sections, even if they have 1 or 2 shorts
    } else {
      return sections.filter((section) => section.length >= SHORTS_PER_SECTION);
    }
  }, [filteredShorts, shuffleKey, hasActiveFilters]);

  // Shuffle shorts for desktop display
  const shuffledFilteredShorts = useMemo(() => {
    if (hasActiveFilters) {
      // Don't shuffle when filters are active - keep consistent results
      return filteredShorts;
    }
    // Shuffle with the same key as figures for consistency
    return shuffleArrayWithSeed(filteredShorts, shuffleKey);
  }, [filteredShorts, shuffleKey, hasActiveFilters]);

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
          <ResultsSummary count={shuffledFigures.length} onClear={clearFilters} />
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
        <div className="space-y-6">
          {distributedShortsBySection.map((sectionShorts, sectionIndex) => (
            <ShortsCarousel key={`shorts-section-${sectionIndex}`} shorts={sectionShorts} />
          ))}
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
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
