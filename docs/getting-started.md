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
   git clone <repository-url>
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

This command starts the development server, and you can access the application at `http://localhost:3000`.

## Building the Application

To build the application for production, run:

```bash
bun --cwd apps/web build
```

This command compiles the application into a production-ready format.

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
  eslint .
  ```

- **Fix linting issues automatically:**

  ```bash
  eslint . --fix
  ```

- **Format the code:**

  ```bash
  prettier --write "**/*.{ts,tsx,json,md}"
  ```

- **Check formatting:**

  ```bash
  prettier --check "**/*.{ts,tsx,json,md}"
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

## Ngrok

If you need to expose your local server to the internet, you can use Ngrok:

```bash
bun scripts/ngrok.ts
```

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
eslint .

# Fix linting issues
eslint . --fix
```

### Type Checking

To ensure type safety in your TypeScript files:

```bash
# Run type checking
bun --cwd apps/web run type-check
```

## Conclusion

You are now ready to develop and contribute to the BailApp project! For further information, refer to the documentation or reach out to the project maintainers.
