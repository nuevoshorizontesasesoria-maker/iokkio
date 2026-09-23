export default function DemoNavbar() {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: '#0f172a',
      color: '#ffffff',
      borderBottom: '1px solid #1e293b',
      padding: '12px 24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      fontFamily: 'system-ui, sans-serif'
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
        <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '0.05em', color: '#34d399' }}>
          IOKKIO DEMO
        </div>
        <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href="/reservar" style={buttonStyle}>
            📝 Reservar
          </a>
          <a href="/eleccion-menu" style={buttonStyle}>
            🍽️ Menú
          </a>
          <a href="/dashboard" style={buttonStyle}>
            📊 Dashboard
          </a>
          <a href="/admin" style={buttonStyle}>
            ⚙️ Admin
          </a>
        </nav>
      </div>
    </header>
  );
}

const buttonStyle = {
  backgroundColor: '#1e293b',
  color: '#ffffff',
  padding: '8px 14px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
  border: '1px solid #334155',
  display: 'inline-block'
};