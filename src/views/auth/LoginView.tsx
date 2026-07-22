'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Shield, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { saveSession, isLoggedIn } from '@/logic/authSession';
import type { AppUser, UserRole } from '@/lib/types/auth';

const ROLE_INFO: Record<UserRole, { color: string; bg: string; label: string }> = {
  'Super Admin':  { color: '#e11d48', bg: 'rgba(225,29,72,0.12)',   label: 'Super Admin' },
  'Admin Data':   { color: '#059669', bg: 'rgba(5,150,105,0.12)',   label: 'Admin Data' },
  'Match Editor': { color: '#2563eb', bg: 'rgba(37,99,235,0.12)',   label: 'Match Editor' },
  'Rumor Editor': { color: '#d97706', bg: 'rgba(217,119,6,0.12)',   label: 'Rumor Editor' },
  'Reviewer':     { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)',  label: 'Reviewer' },
};

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

      // Brief success moment before redirect
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
      background: 'linear-gradient(135deg, #0d1117 0%, #151a1d 50%, #1a2332 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background decorative blobs */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(102,117,106,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(102,117,106,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '10%',
        width: 120, height: 120, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Offline badge */}
      {!isOnline && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(155,95,95,0.95)', color: 'white',
          padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8, zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <WifiOff size={14} /> Mode Offline — Login menggunakan akun lokal
        </div>
      )}

      {/* Main Login Card */}
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 20,
        padding: '40px 36px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Logo & App Name */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {appLogo ? (
            <div style={{
              width: 72, height: 72,
              borderRadius: 16,
              background: '#0d1117',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              padding: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              <img src={appLogo} alt={appName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{
              width: 72, height: 72,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #66756A 0%, #536057 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 32px rgba(102,117,106,0.4)',
            }}>
              <Shield size={32} color="white" />
            </div>
          )}

          <h1 style={{
            fontSize: 22, fontWeight: 800, color: '#f8fafc',
            margin: '0 0 6px',
            letterSpacing: '-0.3px',
          }}>
            {appName}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 500 }}>
            Admin Panel — Masuk untuk melanjutkan
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            background: 'rgba(155,95,95,0.15)',
            border: '1px solid rgba(155,95,95,0.4)',
            borderRadius: 10,
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Username */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 700,
              color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6,
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
                height: 48,
                background: 'rgba(255,255,255,0.06)',
                border: `1px solid ${error ? 'rgba(155,95,95,0.5)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 10,
                padding: '0 14px',
                fontSize: 14,
                color: '#f8fafc',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(102,117,106,0.7)';
                e.target.style.boxShadow = '0 0 0 3px rgba(102,117,106,0.15)';
              }}
              onBlur={e => {
                e.target.style.borderColor = error ? 'rgba(155,95,95,0.5)' : 'rgba(255,255,255,0.12)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 700,
              color: 'rgba(255,255,255,0.55)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6,
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
                  height: 48,
                  background: 'rgba(255,255,255,0.06)',
                  border: `1px solid ${error ? 'rgba(155,95,95,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: 10,
                  padding: '0 44px 0 14px',
                  fontSize: 14,
                  color: '#f8fafc',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(102,117,106,0.7)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(102,117,106,0.15)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = error ? 'rgba(155,95,95,0.5)' : 'rgba(255,255,255,0.12)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                tabIndex={-1}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
                  cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username.trim() || !password.trim()}
            style={{
              width: '100%',
              height: 50,
              marginTop: 4,
              background: isLoading
                ? 'rgba(102,117,106,0.5)'
                : 'linear-gradient(135deg, #66756A 0%, #4a6050 100%)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: isLoading || !username.trim() || !password.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.2s ease',
              opacity: !username.trim() || !password.trim() ? 0.5 : 1,
              boxShadow: isLoading ? 'none' : '0 4px 20px rgba(102,117,106,0.35)',
            }}
            onMouseEnter={e => {
              if (!isLoading && username.trim() && password.trim()) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 28px rgba(102,117,106,0.5)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(102,117,106,0.35)';
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

        {/* Divider */}
        <div style={{
          margin: '24px 0 16px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(21,26,29,0.95)', padding: '0 12px',
            fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8,
          }}>
            Akun tersedia
          </span>
        </div>

        {/* Role Hint Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {(Object.entries(ROLE_INFO) as [UserRole, typeof ROLE_INFO[UserRole]][]).map(([role, info]) => (
            <span key={role} style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 99,
              background: info.bg,
              color: info.color,
              border: `1px solid ${info.color}33`,
            }}>
              {info.label}
            </span>
          ))}
        </div>

        {/* Online indicator */}
        <div style={{
          marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontSize: 11, color: 'rgba(255,255,255,0.25)',
        }}>
          {isOnline
            ? <><Wifi size={12} style={{ color: '#4ade80' }} /> Terhubung ke server</>
            : <><WifiOff size={12} style={{ color: '#f87171' }} /> Mode offline — akun lokal aktif</>
          }
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.18)', textAlign: 'center' }}>
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
          color: rgba(255,255,255,0.2);
        }
      `}</style>
    </div>
  );
}
