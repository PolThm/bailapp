import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { PostHogProvider } from 'posthog-js/react';

function Root() {
  return <App />;
}

const isProduction = import.meta.env.PROD;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isProduction ? (
      <PostHogProvider
        apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
          defaults: '2025-05-24',
          capture_exceptions: true,
          debug: false,
        }}
      >
        <Root />
      </PostHogProvider>
    ) : (
      <Root />
    )}
  </React.StrictMode>
);
