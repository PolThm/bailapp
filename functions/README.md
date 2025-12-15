# Cloud Functions - Video PR Submission

This Cloud Function allows users to submit videos directly from the Bailapp web application via GitHub Pull Requests.

## Setup

### 1. Create a GitHub Personal Access Token (PAT)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "Bailapp PR Creator")
4. Select the following scopes:
   - `repo` (Full control of private repositories)
5. Generate the token and copy it

### 2. Set the GitHub Token in Firebase

For Firebase Functions v2, use secrets:

```bash
firebase functions:secrets:set GITHUB_TOKEN
```

Then enter your token when prompted. This will securely store the token as a secret that the function can access.

### 3. Deploy the Function

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## How It Works

1. User fills out the video submission form in the app
2. Frontend calls the `createVideoPR` Cloud Function
3. Function creates a new branch in the GitHub repository
4. Function adds the video entry to the appropriate file (`classicVideoList.ts` or `shortVideoList.ts`)
5. Function creates a Pull Request with the changes
6. User receives a link to the PR

## Configuration

The function is configured to work with:

- Repository: `PolThm/bailapp`
- Base branch: `main`
- Files:
  - `apps/web/src/data/classicVideoList.ts` (for regular videos)
  - `apps/web/src/data/shortVideoList.ts` (for YouTube Shorts)

To change these settings, edit `functions/src/index.ts`.
