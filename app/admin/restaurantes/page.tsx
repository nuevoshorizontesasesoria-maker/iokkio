import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export default async function RestaurantesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: restaurantes, error } = await supabase
    .from('restaurants')
    .select('id, name, city, client_id, clients(name)')
    .order('name', { ascending: true });

  return (
    <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            🏪 Restaurantes
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
            Locales registrados por cliente
          </p>
        </div>
        <Link
          href="/admin/restaurantes/nuevo"
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
          ➕ Nuevo Restaurante
        </Link>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          Error: {error.message}
        </div>
      )}

      {!restaurantes || restaurantes.length === 0 ? (
        <div style={{ backgroundColor: '#f8fafc', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
          No hay restaurantes creados todavía.
          <br />
          <Link href="/admin/restaurantes/nuevo" style={{ color: '#2563eb', fontWeight: 700 }}>
            Crear el primero →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {restaurantes.map((rest: any) => (
            <div
              key={rest.id}
              style={{
                padding: '16px 20px',
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{rest.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    📍 {rest.city || 'Sin ciudad'} · 👥 {rest.clients?.name || 'Sin cliente'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}