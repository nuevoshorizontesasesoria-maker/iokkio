'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoClientePage() {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre, contact_email: email, contact_phone: telefono }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al crear');

      router.push('/admin/clientes');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>
        👥 Nuevo Cliente
      </h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>
        Creá una nueva cadena de restaurantes
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Nombre de la cadena *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Grupo Pompeii"
            required
            autoFocus
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Email de contacto
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contacto@ejemplo.com"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Teléfono de contacto
          </label>
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+54 9 11 5555-0000"
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: loading ? '#94a3b8' : '#2563eb', color: '#fff', fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Creando...' : 'Crear Cliente'}
          </button>
        </div>
      </form>
    </main>
  );
}