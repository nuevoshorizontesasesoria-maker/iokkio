'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/tablero';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError('Email o contraseña incorrectos: ' + authError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError('Error desconocido');
      setLoading(false);
      return;
    }

    window.location.href = redirectTo;
  }

  return (
    <main style={{ maxWidth: '420px', margin: '4rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚡</div>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.6rem', fontWeight: 800 }}>IOKKIO</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>Iniciar sesión</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', color: '#333', fontSize: '0.9rem' }}>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required autoFocus style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }} />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', color: '#333', fontSize: '0.9rem' }}>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', boxSizing: 'border-box' }} />
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', borderLeft: '3px solid #dc2626' }}>{error}</div>
        )}

        <button type="submit" disabled={loading} style={{ backgroundColor: loading ? '#94a3b8' : '#0f172a', color: '#fff', padding: '0.85rem', borderRadius: '10px', border: 'none', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', marginTop: '0.5rem' }}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '2rem' }}>¿No tenés cuenta? Contactá a IOKKIO.</p>
    </main>
  );
}
