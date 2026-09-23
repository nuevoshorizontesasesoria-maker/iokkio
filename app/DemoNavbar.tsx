export default function DemoNavbar() {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 9999,
      backgroundColor: '#0f172a',
      color: '#ffffff',
      borderBottom: '1px solid #334155',
      padding: '12px 20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ 
          fontWeight: 800, 
          fontSize: '18px', 
          letterSpacing: '0.05em', 
          color: '#34d399' 
        }}>
          IOKKIO DEMO
        </div>
        <nav style={{ 
          display: 'flex', 
          gap: '8px', 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <a href="/reservar" style={btnStyle}>📝 Reservar</a>
          <a href="/eleccion-menu" style={btnStyle}>🍽️ Menú</a>
          <a href="/dashboard" style={btnStyle}>📊 Dashboard</a>
          <a href="/admin" style={btnStyle}>⚙️ Admin</a>
        </nav>
      </div>
    </header>
  );
}

const btnStyle = {
  backgroundColor: '#1e293b',
  color: '#ffffff',
  padding: '8px 14px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
  border: '1px solid #475569',
  display: 'inline-block',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};