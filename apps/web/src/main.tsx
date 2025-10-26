import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { SplashScreen } from './components/SplashScreen';
import './index.css';
import './i18n';

function Root() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

