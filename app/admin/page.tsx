import Link from 'next/link';

export default function AdminPage() {
  return (
    <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px' }}>
        ⚙️ Panel de Administración
      </h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Elegí una sección para administrar:
      </p>

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '12px' }}>
        <li>
          <Link
            href="/admin/menu"
            style={{
              display: 'block',
              padding: '16px 20px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              border: '1px solid #334155'
            }}
          >
            🍽️ Gestionar Menú →
          </Link>
        </li>
        <li>
          <Link
            href="/admin/nuevo-restaurante"
            style={{
              display: 'block',
              padding: '16px 20px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 600,
              border: '1px solid #334155'
            }}
          >
            🏪 Nuevo Restaurante →
          </Link>
        </li>
      </ul>
    </main>
  );
}