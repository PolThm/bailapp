# Deployment Instructions for BailApp

This document outlines the steps to deploy the BailApp to Firebase Hosting, including configuration options, deployment scripts, and best practices for production deployment.

## Prerequisites

Before deploying the BailApp, ensure you have the following:

1. **Firebase CLI**: Install the Firebase CLI if you haven't already. You can find the installation instructions [here](https://firebase.google.com/docs/cli).
2. **Firebase Project**: Create a Firebase project (you can start with the free Spark plan).
3. **Bun**: Ensure you have Bun installed, as it is required for running scripts in this project. You can find the installation instructions [here](https://bun.sh).

## Project Structure

The BailApp project follows a monorepo structure with the main application located in the `apps/web` directory. The build output will be served from the `apps/web/dist` directory.

## Configuration Files

### `firebase.json`

The `firebase.json` file contains the hosting configuration for the BailApp. Below is the relevant configuration:

```json
{
  "hosting": [
    {
      "target": "bailapp",
      "public": "apps/web/dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ],
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true,
      "port": 4000
    },
    "singleProjectMode": true
  }
}
```

### `.firebaserc`

The `.firebaserc` file specifies the default project and hosting targets:

```json
{
  "projects": {
    "default": "bailapp-polthm"
  },
  "targets": {
    "bailapp-polthm": {
      "hosting": {
        "bailapp": ["bailapp"]
      }
    }
  }
}
```

## Deployment Scripts

The following scripts are available in the `package.json` file for managing the deployment process:

- **Deploy to Firebase Hosting**: This command deploys the application to Firebase Hosting.
  ```bash
  npm run deploy:hosting
  ```
- **Deploy All Firebase Services**: This command deploys all Firebase services configured for the project.
  ```bash
  npm run deploy
  ```

### Build the Application

Before deploying, ensure that the application is built. You can do this by running:

```bash
npm run build
```

This command compiles the application and outputs the files to the `apps/web/dist` directory, which is specified in the `firebase.json` configuration.

## Best Practices for Production Deployment

1. **Environment Variables**: Make sure to configure any necessary environment variables before deployment. You can use a `.env` file for local development and set them in the Firebase console for production.

2. **Testing**: Always test your application locally using the Firebase emulators before deploying to production. You can start the emulators with:

   ```bash
   npm run emu
   ```

3. **Linting and Formatting**: Ensure your code is linted and formatted before deployment. You can run:

   ```bash
   npm run lint
   npm run format
   ```

4. **Versioning**: Keep track of your application version in the `.env.public` file. Update the version number as needed before deployment.

## Usage Examples

### Deploying the Application

To deploy the BailApp to Firebase Hosting, follow these steps:

1. Build the application:

   ```bash
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```bash
   npm run deploy:hosting
   ```

### Running Locally

To run the application locally for testing:

```bash
npm run dev
```

This command starts the development server, allowing you to preview your changes in real-time.

## Conclusion

Following these instructions will help you successfully deploy the BailApp to Firebase Hosting. Ensure that you adhere to best practices for a smooth deployment process. For any issues or further assistance, refer to the Firebase documentation or contact your team.
