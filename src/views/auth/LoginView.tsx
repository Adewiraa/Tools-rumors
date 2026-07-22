'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Shield, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { saveSession, isLoggedIn } from '@/logic/authSession';
import type { AppUser } from '@/lib/types/auth';

export default function LoginView() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [appName, setAppName] = useState('Gosball');
  const [appLogo, setAppLogo] = useState<string>('');

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/dashboard');
    }
  }, [router]);

  // Online/offline status
  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    updateOnline();
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  // Read app name & logo from localStorage settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('gosball_app_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.appName) setAppName(s.appName);
        if (s?.appLogoSrc) setAppLogo(s.appLogoSrc);
      }
    } catch {
      // ignore
    }
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

      {/* Offline badge */}
      {!isOnline && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--danger-600)', color: 'white',
          padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8, zIndex: 100,
          boxShadow: 'var(--shadow-lg)',
        }}>
          <WifiOff size={14} /> Mode Offline — Login menggunakan akun lokal
        </div>
      )}

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

        {/* Logo & App Name */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          {appLogo ? (
            <div style={{
              width: 80, height: 80,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              background: 'transparent',
            }}>
              <img src={appLogo} alt={appName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', background: 'transparent' }} />
            </div>
          ) : (
            <div style={{
              width: 72, height: 72,
              borderRadius: 16,
              background: 'var(--primary-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(102,117,106,0.3)',
            }}>
              <Shield size={32} color="white" />
            </div>
          )}

          <h1 style={{
            fontSize: 24, fontWeight: 800, color: 'var(--white)',
            margin: '0 0 6px',
            letterSpacing: '-0.3px',
          }}>
            {appName}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--neutral-500)', margin: 0, fontWeight: 500 }}>
            Admin Panel — Masuk untuk melanjutkan
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

        {/* Online indicator */}
        <div style={{
          marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 11, color: 'var(--neutral-500)',
        }}>
          {isOnline
            ? <><Wifi size={12} style={{ color: '#4ade80' }} /> Terhubung ke server</>
            : <><WifiOff size={12} style={{ color: '#f87171' }} /> Mode offline — akun lokal aktif</>
          }
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--neutral-500)', textAlign: 'center' }}>
        {appName} Admin Panel &copy; {new Date().getFullYear()}
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
