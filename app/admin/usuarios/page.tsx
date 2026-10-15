import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

export default async function UsuariosPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: usuarios, error } = await supabase
    .from('users')
    .select('id, email, name, role, restaurant_id, shift, active, restaurants(name, city)')
    .order('created_at', { ascending: false });

  const colorRol = (rol: string) => {
    if (rol === 'iokkio_admin') return { bg: '#ede9fe', color: '#7c3aed' };
    if (rol === 'gerente') return { bg: '#dbeafe', color: '#2563eb' };
    if (rol === 'encargado') return { bg: '#fef3c7', color: '#d97706' };
    return { bg: '#f1f5f9', color: '#64748b' };
  };

  return (
    <main style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            👤 Usuarios
          </h1>
          <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>
            Gerentes, encargados y administradores
          </p>
        </div>
        <Link
          href="/admin/usuarios/nuevo"
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
          ➕ Nuevo Usuario
        </Link>
      </div>

      {error && (
        <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
          Error: {error.message}
        </div>
      )}

      {!usuarios || usuarios.length === 0 ? (
        <div style={{ backgroundColor: '#f8fafc', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', border: '1px solid #e2e8f0' }}>
          No hay usuarios creados todavía.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {usuarios.map((u: any) => {
            const colores = colorRol(u.role);
            return (
              <div
                key={u.id}
                style={{
                  padding: '16px 20px',
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>
                      {u.name || 'Sin nombre'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{u.email}</div>
                    {u.restaurants && (
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                        🏪 {u.restaurants.name} ({u.restaurants.city})
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{
                      backgroundColor: colores.bg,
                      color: colores.color,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
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
                        fontSize: '0.75rem',
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
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}>
                      {u.active ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
