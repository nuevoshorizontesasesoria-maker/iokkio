import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ClienteDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: cliente } = await supabase
    .from('clients')
    .select('id, name, contact_email, contact_phone, active')
    .eq('id', id)
    .single();

  if (!cliente) notFound();

  const { data: restaurantes } = await supabase
    .from('restaurants')
    .select('id, name, city, active')
    .eq('client_id', id)
    .order('name');
    
  return (
    <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <Link href="/admin/clientes" style={{ display: 'inline-block', marginBottom: '24px', color: '#2563eb', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>
        ← Volver a Clientes
      </Link>

      <h1 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px 0', color: '#0f172a' }}>
        👥 {cliente.name}
      </h1>
      <p style={{ color: '#64748b', margin: '0 0 32px 0' }}>
        {cliente.contact_email || 'Sin email'} · {cliente.contact_phone || 'Sin teléfono'}
      </p>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
        🏪 Restaurantes ({restaurantes?.length || 0})
      </h2>

      {!restaurantes || restaurantes.length === 0 ? (
        <div style={{ backgroundColor: '#f8fafc', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
          Sin restaurantes todavía.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {restaurantes.map((rest: any) => (
            <div key={rest.id} style={{ padding: '14px 18px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{rest.name}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>📍 {rest.city || 'Sin ciudad'}</div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
