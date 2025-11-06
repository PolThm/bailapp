import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface PullToRefreshContextType {
  setRefreshHandler: (handler: (() => Promise<void> | void) | null) => void;
  refreshHandler: (() => Promise<void> | void) | null;
}

const PullToRefreshContext = createContext<PullToRefreshContextType | undefined>(undefined);

export function PullToRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshHandler, setRefreshHandlerState] = useState<(() => Promise<void> | void) | null>(null);

  const setRefreshHandler = useCallback((handler: (() => Promise<void> | void) | null) => {
    setRefreshHandlerState(() => handler);
  }, []);

  return (
    <PullToRefreshContext.Provider
      value={{
        refreshHandler,
        setRefreshHandler,
      }}
    >
      {children}
    </PullToRefreshContext.Provider>
  );
}

export function usePullToRefreshContext() {
  const context = useContext(PullToRefreshContext);
  if (context === undefined) {
    throw new Error('usePullToRefreshContext must be used within a PullToRefreshProvider');
  }
  return context;
}

