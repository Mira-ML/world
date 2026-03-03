import React, { createContext, useContext, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getApiBaseUrl } from '../config/stage';

interface WorldDataContextValue {
  apiFetch: (path: string, options?: RequestInit) => Promise<any>;
  /** Fetch any API path without the /world prefix (e.g. /widget?orgId=...) */
  baseApiFetch: (path: string, options?: RequestInit) => Promise<any>;
}

const WorldDataContext = createContext<WorldDataContextValue | null>(null);

export const WorldDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getAccessTokenSilently } = useAuth0();

  const doFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = await getAccessTokenSilently();
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

  const apiFetch = useCallback((path: string, options?: RequestInit) =>
    doFetch(`${getApiBaseUrl()}/world${path}`, options), [doFetch]);

  const baseApiFetch = useCallback((path: string, options?: RequestInit) =>
    doFetch(`${getApiBaseUrl()}${path}`, options), [doFetch]);

  return (
    <WorldDataContext.Provider value={{ apiFetch, baseApiFetch }}>
      {children}
    </WorldDataContext.Provider>
  );
};

export const useWorldData = () => {
  const ctx = useContext(WorldDataContext);
  if (!ctx) throw new Error('useWorldData must be used within WorldDataProvider');
  return ctx;
};
