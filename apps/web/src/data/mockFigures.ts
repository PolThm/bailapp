import { Figure } from '@/types';

export const mockFigures: Figure[] = [
  {
    id: 'salsa-setenta-1',
    youtubeUrl: 'https://www.youtube.com/watch?v=eXU2o27ozso',
    title: 'Setenta',
    description: 'La fameuse figure "Setenta" de la salsa cubaine',
    videoAuthor: 'Bachata Mastery',
    startTime: undefined,
    endTime: undefined,
    danceStyle: 'salsa',
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
    title: 'Figure 1 of: "🕺🏼💃🏻 10 NEW & EASY Bachata Figures | You Must Know for the Party! 🔥"',
    description:
      "We'll take you step by step through each figure, giving tips and tricks to perfect your technique and shine on the dance floor. From sultry slides to mesmerizing turns, discover the moves that will make you the highlight of dance floor.",
    videoAuthor: 'Avinciia-Danse',
    startTime: '0:16',
    endTime: '1:31',
    danceStyle: 'bachata',
    figureType: 'combination',
    complexity: 'basic',
    phrasesCount: 4,
    videoLanguage: 'english',
    visibility: 'public',
    importedBy: 'Bailapp',
    createdAt: new Date().toISOString(),
  },
];

