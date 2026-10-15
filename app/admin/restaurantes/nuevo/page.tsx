'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

interface Cliente {
  id: string;
  name: string;
}

export default function NuevoRestaurantePage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargarClientes() {
      try {
        const response = await fetch('/api/admin/clientes/listar');
        const data = await response.json();
        if (data.clientes) {
          setClientes(data.clientes);
          if (data.clientes.length > 0) setClienteId(data.clientes[0].id);
        }
      } catch (err) {
        console.error('Error cargando clientes:', err);
      }
    }
    cargarClientes();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteId) {
      setError('SeleccionÃ¡ un cliente');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/restaurantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clienteId,
          name: nombre,
          city: ciudad,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al crear');

      router.push('/admin/restaurantes');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>
        ðŸª Nuevo Restaurante
      </h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>
        CreÃ¡ un nuevo local asignado a un cliente
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Cliente (cadena) *
          </label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
          >
            <option value="">-- SeleccionÃ¡ un cliente --</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Nombre del restaurante *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Pompeii Palermo"
            required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Ciudad *
          </label>
          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder="Ej: Palermo"
            required
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
            {loading ? 'Creando...' : 'Crear Restaurante'}
          </button>
        </div>
      </form>
    </main>
  );
}
