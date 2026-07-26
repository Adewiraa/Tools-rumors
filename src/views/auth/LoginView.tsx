'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Shield, AlertCircle } from 'lucide-react';
import { saveSession, isLoggedIn } from '@/logic/authSession';
import type { AppUser } from '@/lib/types/auth';
import { UNIVERSAL_PORTAL_THEME, applyThemeToDocument } from '@/logic/colorGenerator';

export default function LoginView() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [appName, setAppName] = useState('Gosball');
  const [appLogo, setAppLogo] = useState<string>('');

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/dashboard');
    }
  }, [router]);

  // Set universal portal document title, theme & favicon on mount
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.title = 'Media Tools - Multi-Media Operating System';
    applyThemeToDocument(UNIVERSAL_PORTAL_THEME);

    const universalLogo = '/brand/gosball-alt.png';
    const existingLinks = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
    existingLinks.forEach(el => el.remove());

    const iconTypes = [
      { rel: 'icon', type: 'image/png' },
      { rel: 'shortcut icon', type: 'image/x-icon' },
      { rel: 'apple-touch-icon', type: 'image/png' },
    ];

    iconTypes.forEach(({ rel, type }) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.type = type;
      link.href = `${universalLogo}?v=portal`;
      document.head.appendChild(link);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Login gagal. Periksa kembali username dan password.');
        return;
      }

      const user = json.data as Omit<AppUser, 'password'>;
      saveSession(user);

      await new Promise(r => setTimeout(r, 300));
      router.replace('/dashboard');
    } catch {
      setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--navy-950)',
      background: 'radial-gradient(circle at top, #1d2428 0%, #151a1d 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Main Login Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        backgroundColor: 'var(--navy-900)',
        border: '1px solid var(--navy-800)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px 36px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo & Portal Identity */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <Shield size={36} color="#ffffff" />
          </div>

          <h1 style={{
            fontSize: 24, fontWeight: 800, color: 'var(--white)',
            margin: '0 0 6px',
            letterSpacing: '-0.3px',
          }}>
            Media Tools
          </h1>
          <p style={{ fontSize: 13, color: 'var(--neutral-500)', margin: 0, fontWeight: 500 }}>
            Multi-Media Operating System — Masuk untuk melanjutkan
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(155,95,95,0.15)',
            border: '1px solid var(--danger-600)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            marginBottom: 20,
            display: 'flex', alignItems: 'flex-start', gap: 10,
            animation: 'fadeIn 0.2s ease',
          }}>
            <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: '#fca5a5', fontWeight: 500, lineHeight: 1.4 }}>
              {error}
            </span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Username */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 700,
              color: 'var(--neutral-300)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6,
            }}>
              Username
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              placeholder="Masukkan username..."
              disabled={isLoading}
              style={{
                width: '100%',
                height: 44,
                backgroundColor: 'var(--navy-950)',
                border: `1px solid ${error ? 'var(--danger-600)' : 'var(--navy-800)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '0 14px',
                fontSize: 14,
                color: 'var(--white)',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--primary-600)';
                e.target.style.boxShadow = '0 0 0 3px rgba(102,117,106,0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = error ? 'var(--danger-600)' : 'var(--navy-800)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 700,
              color: 'var(--neutral-300)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6,
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Masukkan password..."
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: 44,
                  backgroundColor: 'var(--navy-950)',
                  border: `1px solid ${error ? 'var(--danger-600)' : 'var(--navy-800)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0 44px 0 14px',
                  fontSize: 14,
                  color: 'var(--white)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'all 0.15s ease',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'var(--primary-600)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102,117,106,0.2)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = error ? 'var(--danger-600)' : 'var(--navy-800)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--neutral-500)',
                  cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--white)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--neutral-500)')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              height: 46,
              marginTop: 6,
              fontSize: 15,
              fontWeight: 700,
              gap: 10,
              opacity: !username.trim() || !password.trim() ? 0.5 : 1,
            }}
          >
            {isLoading ? (
              <>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  animation: 'spin 0.75s linear infinite',
                  flexShrink: 0,
                }} />
                Memverifikasi...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Masuk
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--neutral-500)', textAlign: 'center' }}>
        Media Tools Operating System &copy; {new Date().getFullYear()}
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        #login-username::placeholder,
        #login-password::placeholder {
          color: var(--neutral-500);
        }
      `}</style>
    </div>
  );
}
