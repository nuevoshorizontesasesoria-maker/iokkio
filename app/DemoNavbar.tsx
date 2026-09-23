import Link from 'next/link';

export default function DemoNavbar() {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 99999,
      backgroundColor: '#090d16',
      color: '#ffffff',
      borderBottom: '1px solid #1e293b',
      padding: '12px 24px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontWeight: 900,
            fontSize: '18px',
            letterSpacing: '0.05em',
            background: 'linear-gradient(to right, #34d399, #38bdf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ⚡ IOKKIO DEMO
          </span>
        </div>

        <nav style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Link href="/reservar" style={navButtonStyle}>📝 Reservar</Link>
          <Link href="/eleccion-menu" style={navButtonStyle}>🍽️ Menú</Link>
          <Link href="/dashboard" style={navButtonStyle}>📊 Dashboard</Link>
          <Link href="/admin" style={navButtonStyle}>⚙️ Admin</Link>
          <Link href="/tablero-de-reservas-y-comandas" style={navButtonStyle}>📋 Comandas</Link>
        </nav>
      </div>
    </header>
  );
}

const navButtonStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  color: '#f8fafc',
  padding: '8px 14px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '13px',
  fontWeight: 600,
  border: '1px solid #334155',
  display: 'inline-block',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  transition: 'all 0.2s ease'
};