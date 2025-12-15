---
title: "Getting Started with BailApp"
description: "A comprehensive guide to setting up the development environment, installing dependencies, and running the BailApp PWA locally."
icon: "🚀"
order: 1
---

# Getting Started with BailApp

Welcome to the BailApp project! This guide will help you set up your development environment, install the necessary dependencies, and run the BailApp web application locally.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Bun](https://bun.sh) (version >= 1.1.21)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- A Firebase project (you can start with the free Spark plan)

## Installation

1. **Clone the Repository**

   First, clone the BailApp repository to your local machine:

   ```bash
   git clone https://github.com/PolThm/bailapp
   cd bailapp
   ```

2. **Install Dependencies**

   Navigate to the `apps/web` directory and install the dependencies using Bun:

   ```bash
   cd apps/web
   bun install
   ```

## Running the Application

To run the BailApp web application locally, use the following command:

```bash
bun --cwd apps/web dev
```

This command starts the development server, and you can access the application at `http://localhost:5173`.

## Building the Application

To build the application for production, run:

```bash
bun --cwd apps/web build
```

This command compiles the application into a production-ready format, outputting files to the `apps/web/dist` directory.

## Previewing the Application

To preview the built application, use:

```bash
bun --cwd apps/web preview
```

This will serve the built application locally for testing.

## Linting and Formatting

To ensure code quality, you can lint and format the codebase:

- **Lint the code:**

  ```bash
  bun run lint
  ```

- **Fix linting issues automatically:**

  ```bash
  bun run lint:fix
  ```

- **Format the code:**

  ```bash
  bun run format
  ```

- **Check formatting:**

  ```bash
  bun run format:check
  ```

## Type Checking

To perform type checking on the TypeScript code, use:

```bash
bun --cwd apps/web run type-check
```

## Running Firebase Emulators

If you want to run Firebase emulators for local development, execute:

```bash
firebase emulators:start
```

## Deployment

To deploy the application to Firebase Hosting, use the following command:

```bash
firebase deploy --only hosting
```

For a full deployment, run:

```bash
firebase deploy
```

## Exposing Your Local Server

If you need to expose your local server to the internet, you can use Ngrok. First, ensure you have Ngrok installed. You can download it from [ngrok.com](https://ngrok.com/).

Once installed, run the following command to expose your local server:

```bash
ngrok http 5173
```

This command will create a secure tunnel to your local server running on port 5173, allowing you to share your application with others.

## Usage Examples

### Running the Application

After running the development server, you can access the application in your browser:

```bash
# Start the development server
bun --cwd apps/web dev
```

### Building for Production

To prepare the application for production:

```bash
# Build the application
bun --cwd apps/web build
```

### Linting and Fixing Issues

To check for linting errors and automatically fix them:

```bash
# Lint the code
bun run lint

# Fix linting issues
bun run lint:fix
```

### Type Checking

To ensure type safety in your TypeScript files:

```bash
# Run type checking
bun --cwd apps/web run type-check
```

## Troubleshooting Tips

Here are some common issues you might encounter and their solutions:

- **Issue:** The development server does not start.
  - **Solution:** Ensure that you have installed all dependencies correctly and that you are in the correct directory (`apps/web`).

- **Issue:** Firebase emulators fail to start.
  - **Solution:** Check your Firebase configuration and ensure that you have initialized your Firebase project correctly.

- **Issue:** Ngrok fails to connect.
  - **Solution:** Ensure that Ngrok is installed and that you are using the correct port number.

## Conclusion

You are now ready to develop and contribute to the BailApp project! For further information, refer to the documentation or reach out to the project maintainers.
