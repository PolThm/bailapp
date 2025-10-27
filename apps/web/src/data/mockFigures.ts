import { Figure } from '@/types';

export const mockFigures: Figure[] = [
  {
    id: 'salsa-setenta-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=eXU2o27ozso',
    shortTitle: 'Setenta',
    fullTitle: 'Salsa Cubaine Setenta',
    description: 'La Setenta est une figure classique de salsa cubaine où, à partir d’une prise croisée, le danseur guide la danseuse dans une succession fluide de tours et d’entrelacements de bras, créant un effet dynamique et élégant.',
    videoAuthor: 'Bachata Mastery',
    startTime: undefined,
    endTime: undefined,
    danceStyle: 'salsa',
    danceSubStyle: 'cuban',
    figureType: 'figure',
    complexity: 'basic-intermediate',
    phrasesCount: 5,
    videoLanguage: 'french',
    visibility: 'public',
    importedBy: 'Bailapp',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'bachata-figure1-2',
    youtubeUrl:
      'https://www.youtube.com/watch?v=6yV0luuLZdw&list=PL2SzvxUaqIlRiDr66o3QMW7qwTzrOKoT6',
    shortTitle: '#1 of 10 easy figures you must know for the party',
    fullTitle: 'Figure 1 of: 🕺🏼💃🏻 10 NEW & EASY Bachata Figures | You Must Know for the Party! 🔥',
    description:
      "We'll take you step by step through each figure, giving tips and tricks to perfect your technique and shine on the dance floor. From sultry slides to mesmerizing turns, discover the moves that will make you the highlight of dance floor.",
    videoAuthor: 'Avinciia-Danse',
    startTime: '0:16',
    endTime: '1:31',
    danceStyle: 'bachata',
    danceSubStyle: undefined,
    figureType: 'figure',
    complexity: 'basic-intermediate',
    phrasesCount: 4,
    videoLanguage: 'english',
    visibility: 'public',
    importedBy: 'Bailapp',
    createdAt: new Date().toISOString(),
  },
];

