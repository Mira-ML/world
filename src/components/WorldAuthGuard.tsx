import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const ALLOWED_DOMAIN = '@mira.ml';

interface Props {
  children: React.ReactNode;
}

const WorldAuthGuard: React.FC<Props> = ({ children }) => {
  const { isLoading, isAuthenticated, user, loginWithRedirect, logout, error } = useAuth0();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-white text-sm opacity-50">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-950 gap-4">
        <div className="text-white text-lg font-semibold">Mira World</div>
        <div className="text-gray-400 text-sm">Internal operations dashboard</div>
        {error && (
          <div className="mt-2 px-4 py-3 bg-red-950 border border-red-800 rounded-lg max-w-sm text-center">
            <div className="text-red-400 text-xs font-mono">{error.message}</div>
          </div>
        )}
        <button
          onClick={() => loginWithRedirect()}
          className="mt-4 px-5 py-2 bg-white text-gray-950 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
        >
          Sign in with Auth0
        </button>
      </div>
    );
  }

  const email = user?.email ?? '';
  if (!email.endsWith(ALLOWED_DOMAIN)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-950 gap-3">
        <div className="text-white text-lg font-semibold">Access Restricted</div>
        <div className="text-gray-400 text-sm max-w-xs text-center">
          This dashboard is restricted to Mira team members. Please sign in with your <strong>@mira.ml</strong> account.
        </div>
        <div className="text-gray-600 text-xs mt-1">Signed in as: {email}</div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          className="mt-4 px-5 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:border-gray-500 transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default WorldAuthGuard;
