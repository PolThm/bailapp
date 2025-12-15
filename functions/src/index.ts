import { Octokit } from '@octokit/rest';
import { defineSecret } from 'firebase-functions/params';
import { onCall } from 'firebase-functions/v2/https';

const githubToken = defineSecret('GITHUB_TOKEN');

const REPO_OWNER = 'PolThm';
const REPO_NAME = 'bailapp';
const BASE_BRANCH = 'main';

interface VideoSubmission {
  youtubeUrl: string;
  shortTitle: string;
  fullTitle: string;
  description?: string;
  videoAuthor?: string;
  startTime?: string;
  endTime?: string;
  previewStartDelay?: number;
  danceStyle: 'salsa' | 'bachata';
  danceSubStyle?: string;
  figureType?: string;
  complexity: string;
  phrasesCount?: number;
  videoLanguage: string;
  videoFormat: 'classic' | 'short';
}

function generateVideoId(youtubeUrl: string, videoFormat: 'classic' | 'short'): string {
  const url = new URL(youtubeUrl);
  let videoId: string;

  if (videoFormat === 'short') {
    // For YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
    const pathParts = url.pathname.split('/');
    const shortsIndex = pathParts.indexOf('shorts');
    videoId = pathParts[shortsIndex + 1] || '';
    return `short_${videoId}`;
  } else {
    // For regular videos: https://www.youtube.com/watch?v=VIDEO_ID
    videoId = url.searchParams.get('v') || '';
    return `watch_${videoId}`;
  }
}

function formatVideoEntry(video: VideoSubmission): string {
  const id = generateVideoId(video.youtubeUrl, video.videoFormat);
  const createdAt = new Date().toISOString();

  const entry = `  {
    id: '${id}',
    youtubeUrl: '${video.youtubeUrl}',
    shortTitle: '${video.shortTitle.replace(/'/g, "\\'")}',
    fullTitle: '${video.fullTitle.replace(/'/g, "\\'")}',
    description: ${video.description ? `'${video.description.replace(/'/g, "\\'")}'` : 'undefined'},
    videoAuthor: ${video.videoAuthor ? `'${video.videoAuthor.replace(/'/g, "\\'")}'` : 'undefined'},
    startTime: ${video.startTime ? `'${video.startTime}'` : 'undefined'},
    endTime: ${video.endTime ? `'${video.endTime}'` : 'undefined'},
    previewStartDelay: ${video.previewStartDelay ?? 'undefined'},
    danceStyle: '${video.danceStyle}',
    danceSubStyle: ${video.danceSubStyle ? `'${video.danceSubStyle}'` : 'undefined'},
    figureType: ${video.figureType ? `'${video.figureType}'` : 'undefined'},
    complexity: '${video.complexity}',
    phrasesCount: ${video.phrasesCount ?? 'undefined'},
    videoLanguage: '${video.videoLanguage}',
    visibility: 'public',
    importedBy: 'Bailapp',
    createdAt: '${createdAt}',
  },`;

  return entry;
}

export const createVideoPR = onCall(
  {
    secrets: [githubToken],
  },
  async (request) => {
    const video = request.data as VideoSubmission;

    // Validation
    if (
      !video.youtubeUrl ||
      !video.shortTitle ||
      !video.fullTitle ||
      !video.danceStyle ||
      !video.complexity ||
      !video.videoLanguage ||
      !video.videoFormat
    ) {
      throw new Error('Missing required fields');
    }

    const octokit = new Octokit({
      auth: githubToken.value(),
    });

    try {
      // Get the base branch reference
      const { data: baseRef } = await octokit.rest.git.getRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: `heads/${BASE_BRANCH}`,
      });

      // Create a new branch
      const branchName = `add-video-${Date.now()}`;
      await octokit.rest.git.createRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      });

      // Determine which file to update
      const fileName =
        video.videoFormat === 'short'
          ? 'apps/web/src/data/shortVideoList.ts'
          : 'apps/web/src/data/classicVideoList.ts';

      // Get the current file content
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: fileName,
        ref: branchName,
      });

      if (Array.isArray(fileData) || fileData.type !== 'file') {
        throw new Error('File not found or is not a file');
      }

      const currentContent = Buffer.from(fileData.content, 'base64').toString('utf-8');

      // Find the insertion point (before the closing bracket)
      const lastBracketIndex = currentContent.lastIndexOf('];');
      if (lastBracketIndex === -1) {
        throw new Error('Could not find end of array');
      }

      // Generate the new video entry
      const videoEntry = formatVideoEntry(video);

      // Insert the new entry
      const newContent =
        currentContent.slice(0, lastBracketIndex) +
        '\n' +
        videoEntry +
        '\n' +
        currentContent.slice(lastBracketIndex);

      // Update the file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: fileName,
        message: `Add video: ${video.shortTitle}`,
        content: Buffer.from(newContent).toString('base64'),
        branch: branchName,
        sha: fileData.sha,
      });

      // Create the pull request
      const { data: pr } = await octokit.rest.pulls.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: `Add video: ${video.shortTitle}`,
        head: branchName,
        base: BASE_BRANCH,
        body: `## Video Submission\n\n**Title:** ${video.fullTitle}\n**Author:** ${video.videoAuthor || 'Unknown'}\n**Style:** ${video.danceStyle}${video.danceSubStyle ? ` (${video.danceSubStyle})` : ''}\n**Complexity:** ${video.complexity}\n**Language:** ${video.videoLanguage}\n\n${video.description ? `**Description:** ${video.description}\n` : ''}\n**YouTube URL:** ${video.youtubeUrl}\n\n---\n\nThis PR was created automatically from the Bailapp web application.`,
      });

      return {
        success: true,
        prUrl: pr.html_url,
        prNumber: pr.number,
      };
    } catch (error: any) {
      console.error('Error creating PR:', error);
      throw new Error(`Failed to create PR: ${error.message}`);
    }
  }
);
