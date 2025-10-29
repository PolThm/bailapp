import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { PostHogProvider } from 'posthog-js/react';

function Root() {
  return <App />;
}

// Disable PostHog in development to avoid polluting analytics
const isProduction = import.meta.env.PROD;

const AppWithProviders = () => {
  if (isProduction) {
    return (
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
          defaults: '2025-05-24',
          capture_exceptions: true, // This enables capturing exceptions using Error Tracking
          debug: false,
        }}
      >
        <Root />
      </PostHogProvider>
    );
  }

  // In development, return children without PostHog
  return <Root />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
);
