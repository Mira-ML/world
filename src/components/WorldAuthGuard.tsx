import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const MOAI = 'https://s3.us-east-2.amazonaws.com/beta.mira.ml/3D_MOAI_ROCK-PURPLE.svg';
const WORDMARK = 'https://s3.us-east-2.amazonaws.com/beta.mira.ml/terraWordmark.png';

interface Props {
  children: React.ReactNode;
}

const WorldAuthGuard: React.FC<Props> = ({ children }) => {
  const { isLoading, isAuthenticated, user, loginWithRedirect, logout, error } = useAuth0();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary, #F5EBE0)' }}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14, fontFamily: 'var(--font-primary)' }}>Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg-primary, #F5EBE0)', gap: 24,
        fontFamily: 'var(--font-primary)',
      }}>
        <img src={MOAI} alt="Mira" style={{ width: 80, height: 80 }} />
        <img src={WORDMARK} alt="Mira" style={{ height: 32, width: 'auto' }} />
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Internal operations dashboard</div>

        {error && (
          <div style={{
            padding: '12px 20px', background: 'rgba(168,89,81,0.08)',
            border: '1px solid rgba(168,89,81,0.3)', borderRadius: 8,
            color: '#A85951', fontSize: 12, fontFamily: 'monospace', maxWidth: 360, textAlign: 'center',
          }}>
            {error.message}
          </div>
        )}

        <button
          onClick={() => loginWithRedirect()}
          style={{
            marginTop: 8, padding: '12px 32px',
            background: 'var(--color-accent, #4A6C6F)', color: '#FFFFFF',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
            fontFamily: 'var(--font-primary)', cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-accent-hover, #5A7F82)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-accent, #4A6C6F)')}
        >
          Sign in with Auth0
        </button>
      </div>
    );
  }

  const email = user?.email ?? '';
  if (!email.endsWith('@mira.ml')) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--color-bg-primary, #F5EBE0)', gap: 16,
        fontFamily: 'var(--font-primary)',
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-primary)' }}>Access Restricted</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 14, maxWidth: 320, textAlign: 'center' }}>
          This dashboard is restricted to Mira team members. Please sign in with your <strong>@mira.ml</strong> account.
        </div>
        <div style={{ color: 'var(--color-text-subtle)', fontSize: 12 }}>Signed in as: {email}</div>
        <button
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          style={{
            marginTop: 8, padding: '10px 24px',
            background: 'transparent', color: 'var(--color-secondary, #A85951)',
            border: '1px solid var(--color-secondary, #A85951)', borderRadius: 8,
            fontSize: 14, fontFamily: 'var(--font-primary)', cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

export default WorldAuthGuard;
