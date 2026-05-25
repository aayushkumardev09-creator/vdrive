import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import App from './App.tsx';
import './index.css';
import { validateEnvOrThrow } from './lib/config';
import { ConfigErrorScreen } from './components/ConfigErrorScreen';

function Root() {
  const [missing, setMissing] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      validateEnvOrThrow();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      // Extract keys from message.
      const keys = msg
        .replace('Missing required environment variables: ', '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      setMissing(keys.length ? keys : ['Missing environment variables']);
    }
  }, []);

  if (missing) return <ConfigErrorScreen missingKeys={missing} />;
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

