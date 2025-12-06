# Adding New Videos 🎥

We're always looking for quality Salsa and Bachata videos! Here's how to add new dance tutorials to the app.

## Before You Start

1. **Find a good video** on YouTube (Salsa or Bachata)
2. **Check it doesn't already exist** in `apps/web/src/data/videoList.ts`
3. **Verify the video quality**: clear explanations, good camera angles, appropriate content

## Step-by-Step Guide

### 1. Open the file

Navigate to `apps/web/src/data/videoList.ts`

### 2. Choose the right list

- **`classicVideoList`** - For regular YouTube videos (tutorials, step-by-step guides)
- **`shortVideoList`** - For YouTube Shorts (vertical format, quick tips)

### 3. Add your video at the END of the array

**For a Classic Video:**

```typescript
{
  id: 'watch_VIDEO_ID_HERE',
  youtubeUrl: 'https://www.youtube.com/watch?v=VIDEO_ID_HERE',
  shortTitle: 'Short catchy name',
  fullTitle: 'Full video title from YouTube',
  description: 'A helpful description of what the figure teaches (use AI if needed!)',
  videoAuthor: 'Channel Name',
  startTime: '0:15',  // Optional: where the tutorial starts (format: 'M:SS' or 'MM:SS')
  endTime: '2:30',    // Optional: where it ends
  previewStartDelay: 5, // Seconds to wait before showing preview (usually 3-10)
  danceStyle: 'salsa', // or 'bachata'
  danceSubStyle: 'cuban', // or 'sensual', 'modern', etc. (see types below)
  figureType: 'figure',
  complexity: 'basic-intermediate', // see options below
  phrasesCount: 4, // Number of 8-count phrases (estimate if unsure)
  videoLanguage: 'english', // 'english', 'french', 'spanish' or 'italian'
  visibility: 'public',
  importedBy: 'Bailapp',
  createdAt: new Date().toISOString(),
},
```

**For a Short Video:**

```typescript
{
  id: 'short_SHORT_VIDEO_ID',
  youtubeUrl: 'https://www.youtube.com/shorts/SHORT_VIDEO_ID',
  shortTitle: 'Quick descriptive name',
  fullTitle: 'Full short title',
  description: 'Brief description of the tip/move',
  videoAuthor: 'Channel Name',
  startTime: undefined,
  endTime: undefined,
  previewStartDelay: 0, // Shorts usually start at 0
  danceStyle: 'bachata',
  danceSubStyle: undefined, // or specific style
  figureType: undefined,
  complexity: 'basic',
  phrasesCount: undefined,
  videoLanguage: 'spanish',
  visibility: 'public',
  importedBy: 'Bailapp',
  createdAt: new Date().toISOString(),
},
```

### 4. Field Explanations

**Required fields:**

- **`id`**:
  - Classic: `'watch_VIDEO_ID'` (extract from YouTube URL)
  - Short: `'short_VIDEO_ID'`
  - **Multiple figures from same video**: If a video contains several figures/parts, you can add the same `youtubeUrl` multiple times! Just change the `id` to `'watch_VIDEO_ID_1'`, `'watch_VIDEO_ID_2'`, etc., and update the `startTime`, `endTime`, `shortTitle`, `fullTitle`, and `description` for each figure.

- **`youtubeUrl`**: Full YouTube URL

- **`shortTitle`**: Short, catchy name (shown in cards)

- **`fullTitle`**: Complete video title

- **`description`**: What does this video teach? Be creative! AI can help you write engaging descriptions.

- **`videoAuthor`**: YouTube channel name

- **`danceStyle`**: `'salsa'` or `'bachata'`

- **`complexity`**: One of:
  - `'basic'` - Beginner friendly
  - `'basic-intermediate'` - Between basic and intermediate
  - `'intermediate'` - Requires some experience
  - `'intermediate-advanced'` - Advanced intermediate
  - `'advanced'` - For experienced dancers

- **`videoLanguage`**: `'english'`, `'french'`, `'spanish'` or `'italian'`

**Optional but recommended:**

- **`danceSubStyle`**: Be specific!
  - Salsa: `'cuban'`, `'la-style'`, `'ny-style'`, `'colombian'`, etc.
  - Bachata: `'dominican'`, `'modern'`, `'sensual'`, `'urban'`, etc.

- **`startTime`** / **`endTime`**: Use format `'M:SS'` or `'MM:SS'` (e.g., `'0:15'`, `'1:30'`)
  - **Essential when adding multiple figures from the same video!**
  - Great for long videos with multiple figures
  - Extract the specific section you want to highlight
  - Each figure should have its own time range

- **`previewStartDelay`**: Number of seconds to delay preview (from startTime)
  - Helps skip intros and show the actual move
  - Classic videos: usually 3-10 seconds
  - Shorts: usually 0-2 seconds

- **`figureType`**: `'figure'` for structured choreography moves

- **`phrasesCount`**: Number of musical phrases (8-count beats)

### 5. Example: Adding a Real Video

Let's say you found this video: `https://www.youtube.com/watch?v=ABC123xyz`

```typescript
// Add at the END of classicVideoList array, before the closing ];
{
  id: 'watch_ABC123xyz',
  youtubeUrl: 'https://www.youtube.com/watch?v=ABC123xyz',
  shortTitle: 'Cross Body Lead',
  fullTitle: 'Salsa Tutorial: Master the Cross Body Lead',
  description: 'Learn the fundamental cross body lead in salsa - one of the most important figures to master. This tutorial breaks down the footwork, timing, and connection needed to execute this move smoothly.',
  videoAuthor: 'Salsa Dance Academy',
  startTime: '0:30',
  endTime: '3:45',
  previewStartDelay: 8,
  danceStyle: 'salsa',
  danceSubStyle: 'la-style',
  figureType: 'figure',
  complexity: 'basic',
  phrasesCount: 2,
  videoLanguage: 'english',
  visibility: 'public',
  importedBy: 'Bailapp',
  createdAt: new Date().toISOString(),
},
```

### 5.1. Example: Adding Multiple Figures from the Same Video

If a video contains multiple figures (like a "10 figures tutorial"), you can add each figure separately using the same `youtubeUrl` but different `id`, `startTime`, `endTime`, and titles:

```typescript
// Figure 1 from the video
{
  id: 'watch_6yV0luuLZdw_1',
  youtubeUrl: 'https://www.youtube.com/watch?v=6yV0luuLZdw',
  shortTitle: '#1 of 10 easy figures you must know for the party',
  fullTitle: 'Figure 1 of: 🕺🏼💃🏻 10 NEW & EASY Bachata Figures | You Must Know for the Party! 🔥',
  description: 'First figure: A smooth and elegant bachata move perfect for beginners.',
  videoAuthor: 'Avinciia-Danse',
  startTime: '0:16',
  endTime: '1:31',
  previewStartDelay: 54,
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
// Figure 2 from the SAME video
{
  id: 'watch_6yV0luuLZdw_2',
  youtubeUrl: 'https://www.youtube.com/watch?v=6yV0luuLZdw', // Same URL!
  shortTitle: '#2 of 10 easy figures you must know for the party',
  fullTitle: 'Figure 2 of: 🕺🏼💃🏻 10 NEW & EASY Bachata Figures | You Must Know for the Party! 🔥',
  description: 'Second figure: A dynamic turn combination that adds flair to your dancing.',
  videoAuthor: 'Avinciia-Danse',
  startTime: '1:31', // Different time range!
  endTime: '2:51',
  previewStartDelay: 8,
  danceStyle: 'bachata',
  danceSubStyle: undefined,
  figureType: 'figure',
  complexity: 'basic-intermediate',
  phrasesCount: 5,
  videoLanguage: 'english',
  visibility: 'public',
  importedBy: 'Bailapp',
  createdAt: new Date().toISOString(),
},
// Continue for figures 3, 4, 5... with id: 'watch_6yV0luuLZdw_3', etc.
```

**Key points:**

- ✅ Same `youtubeUrl` for all figures from the same video
- ✅ Unique `id` for each figure (`_1`, `_2`, `_3`, etc.)
- ✅ Different `startTime` and `endTime` for each figure
- ✅ Update `shortTitle`, `fullTitle`, and `description` to match each specific figure
- ✅ Adjust `previewStartDelay` if needed for each figure

### 6. Test Your Addition

After adding the video:

```bash
bun dev
```

Navigate to the app and check:

- Does the video appear in the list?
- Does it play correctly?
- Are the start/end times accurate?
- Does the preview look good?

### 7. Submit Your PR

Follow the [Contributing Guide](CONTRIBUTING.md) to create your Pull Request. In your PR description, mention:

- The video title
- Why you think it's a good addition
- Any special notes (e.g., "Great for beginners", "Advanced styling tutorial")

## Tips for Finding Great Videos

- Look for clear, well-lit tutorials
- Prefer videos with step-by-step breakdowns
- Check that audio/music is appropriate
- Make sure the explanation is easy to follow
- Diverse skill levels help everyone learn!

## Questions?

Not sure about a field? Open an issue and ask! We're happy to help. 🤗
