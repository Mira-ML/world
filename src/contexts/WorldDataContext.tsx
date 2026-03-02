import React, { createContext, useContext, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getApiBaseUrl } from '../config/stage';

interface WorldDataContextValue {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
}

const WorldDataContext = createContext<WorldDataContextValue | null>(null);

export const WorldDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessTokenSilently } = useAuth0();

  const apiFetch = useCallback(async (path: string, options: RequestInit = {}) => {
    const token = await getAccessTokenSilently();
    const base = getApiBaseUrl();
    const url = `${base}/world${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string> || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.json();
  }, [getAccessTokenSilently]);

  return (
    <WorldDataContext.Provider value={{ apiFetch }}>
      {children}
    </WorldDataContext.Provider>
  );
};

export const useWorldData = () => {
  const ctx = useContext(WorldDataContext);
  if (!ctx) throw new Error('useWorldData must be used within WorldDataProvider');
  return ctx;
};
