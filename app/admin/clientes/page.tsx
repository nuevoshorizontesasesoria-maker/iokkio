import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export default async function ClientesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: clientes, error } = await supabase
    .from('clients')
    .select('id, name, contact_email, contact_phone, active, created_at')
    .order('created_at', { ascending: false });

  return (
    <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            👥 Clientes
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
            Cadenas de restaurantes registradas
          </p>
        </div>
        <Link
          href="/admin/clientes/nuevo"
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          ➕ Nuevo Cliente
        </Link>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          Error: {error.message}
        </div>
      )}

      {!clientes || clientes.length === 0 ? (
        <div style={{ backgroundColor: '#f8fafc', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
          No hay clientes creados todavía.
          <br />
          <Link href="/admin/clientes/nuevo" style={{ color: '#2563eb', fontWeight: 700 }}>
            Crear el primero →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {clientes.map((cliente) => (
            <Link
              key={cliente.id}
              href={`/admin/clientes/${cliente.id}`}
              style={{
                display: 'block',
                padding: '16px 20px',
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                textDecoration: 'none',
                color: '#0f172a',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{cliente.name}</div>
                  {cliente.contact_email && (
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{cliente.contact_email}</div>
                  )}
                </div>
                <span style={{
                  backgroundColor: cliente.active ? '#dcfce7' : '#f1f5f9',
                  color: cliente.active ? '#16a34a' : '#94a3b8',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}>
                  {cliente.active ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}