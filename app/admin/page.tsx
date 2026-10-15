import Link from 'next/link';

export default function AdminPage() {
  const opciones = [
    {
      href: '/admin/clientes',
      emoji: '👥',
      titulo: 'Clientes',
      descripcion: 'Gestionar cadenas de restaurantes',
    },
    {
      href: '/admin/nuevo-restaurante',
      emoji: '🏪',
      titulo: 'Nuevo Restaurante',
      descripcion: 'Dar de alta un local',
    },
    {
      href: '/admin/usuarios',
      emoji: '👤',
      titulo: 'Usuarios',
      descripcion: 'Crear gerentes y encargados',
    },
    {
      href: '/admin/menu',
      emoji: '🍽️',
      titulo: 'Menús',
      descripcion: 'Gestionar cartas de restaurantes',
    },
  ];

  return (
    <main style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>
        ⚙️ Panel de Administración
      </h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>
        Elegí una sección para administrar:
      </p>

      <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '12px' }}>
        {opciones.map((op) => (
          <li key={op.href}>
            <Link
              href={op.href}
              style={{
                display: 'block',
                padding: '16px 20px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                borderRadius: '10px',
                textDecoration: 'none',
                border: '1px solid #334155',
              }}
            >
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
                {op.emoji} {op.titulo}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                {op.descripcion}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}