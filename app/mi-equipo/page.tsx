import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function MiEquipoPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'gerente') {
    redirect('/tablero');
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: usuarios } = await supabase
    .from('users')
    .select('id, email, name, role, shift, active, created_at')
    .eq('restaurant_id', currentUser.restaurant_id)
    .order('created_at', { ascending: true });

  return (
    <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            👥 Mi Equipo
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
            Personas con acceso a tu restaurante
          </p>
        </div>
        <Link
          href="/mi-equipo/nuevo"
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
          ➕ Crear Encargado
        </Link>
      </div>

      {!usuarios || usuarios.length === 0 ? (
        <div style={{ backgroundColor: '#f8fafc', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
          Todavía no hay usuarios en tu equipo.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {usuarios.map((u: any) => (
            <div key={u.id} style={{ padding: '16px 20px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: u.role === 'gerente' ? '#dbeafe' : '#fef3c7',
                    color: u.role === 'gerente' ? '#2563eb' : '#d97706',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    {u.role}
                  </span>
                  {u.shift && (
                    <span style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}>
                      {u.shift === 'morning' ? '🌅 Mañana' : u.shift === 'afternoon' ? '☀️ Tarde' : '🌙 Noche'}
                    </span>
                  )}
                  <span style={{
                    backgroundColor: u.active ? '#dcfce7' : '#f1f5f9',
                    color: u.active ? '#16a34a' : '#94a3b8',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}>
                    {u.active ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}