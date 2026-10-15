'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Restaurante {
  id: string;
  name: string;
  city: string;
}

function generarPassword(): string {
  const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minus = 'abcdefghijkmnpqrstuvwxyz';
  const nums = '23456789';
  const simb = '!@#$%';
  const todos = mayus + minus + nums + simb;
  let pass = '';
  pass += mayus[Math.floor(Math.random() * mayus.length)];
  pass += minus[Math.floor(Math.random() * minus.length)];
  pass += nums[Math.floor(Math.random() * nums.length)];
  pass += simb[Math.floor(Math.random() * simb.length)];
  for (let i = 0; i < 8; i++) {
    pass += todos[Math.floor(Math.random() * todos.length)];
  }
  return pass.split('').sort(() => Math.random() - 0.5).join('');
}

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'gerente' | 'encargado'>('gerente');
  const [restauranteId, setRestauranteId] = useState('');
  const [turno, setTurno] = useState<'morning' | 'afternoon' | 'evening'>('evening');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creado, setCreado] = useState<{ email: string; password: string; nombre: string } | null>(null);

  useEffect(() => {
    async function cargarRestaurantes() {
      try {
        const response = await fetch('/api/admin/restaurantes/listar');
        const data = await response.json();
        if (data.restaurantes) {
          setRestaurantes(data.restaurantes);
          if (data.restaurantes.length > 0) setRestauranteId(data.restaurantes[0].id);
        }
      } catch (err) {
        console.error('Error cargando restaurantes:', err);
      }
    }
    cargarRestaurantes();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!restauranteId) {
      setError('Seleccioná un restaurante');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: nombre,
          role: rol,
          restaurant_id: restauranteId,
          shift: rol === 'encargado' ? turno : null,
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al crear');

      setCreado({ email, password, nombre });
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  function copiarCredenciales() {
    if (!creado) return;
    const texto = 'Credenciales IOKKIO\n\nEmail: ' + creado.email + '\nPassword: ' + creado.password + '\n\nAccedé en: https://app.iokkio.com/login';
    navigator.clipboard.writeText(texto);
    alert('Credenciales copiadas');
  }

  if (creado) {
    return (
      <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '8px' }}>✅</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Usuario creado</h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            Compartile estas credenciales a <strong>{creado.nombre}</strong>
          </p>
        </div>

        <div style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '10px', marginBottom: '20px', borderLeft: '4px solid #2563eb' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Email</div>
            <div style={{ fontSize: '1rem', fontFamily: 'monospace', color: '#0f172a' }}>{creado.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Password temporal</div>
            <div style={{ fontSize: '1rem', fontFamily: 'monospace', color: '#0f172a' }}>{creado.password}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button
            onClick={copiarCredenciales}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#25d366', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            📋 Copiar credenciales
          </button>
          <button
            onClick={() => router.push('/admin/usuarios')}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 700, cursor: 'pointer' }}
          >
            Ver todos
          </button>
        </div>

        <div style={{ backgroundColor: '#fffbeb', padding: '16px', borderRadius: '8px', borderLeft: '3px solid #f59e0b', fontSize: '0.85rem', color: '#78350f' }}>
          ⚠️ <strong>Importante:</strong> Esta password solo se muestra una vez. Copiala y mandásela al usuario por WhatsApp.
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>
        👤 Nuevo Usuario
      </h1>
      <p style={{ color: '#64748b', marginBottom: '32px' }}>
        Creá un gerente o encargado para un restaurante
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Nombre completo *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Carlos Ruiz"
            required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="carlos@pompeii.com"
            required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Rol *
          </label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as 'gerente' | 'encargado')}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
          >
            <option value="gerente">Gerente (ve todo el histórico)</option>
            <option value="encargado">Encargado (solo su turno)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Restaurante *
          </label>
          <select
            value={restauranteId}
            onChange={(e) => setRestauranteId(e.target.value)}
            required
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
          >
            <option value="">-- Seleccioná --</option>
            {restaurantes.map((r) => (
              <option key={r.id} value={r.id}>{r.name} ({r.city})</option>
            ))}
          </select>
        </div>

        {rol === 'encargado' && (
          <div>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
              Turno *
            </label>
            <select
              value={turno}
              onChange={(e) => setTurno(e.target.value as any)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', backgroundColor: '#fff' }}
            >
              <option value="morning">Mañana (08:00 - 15:00)</option>
              <option value="afternoon">Tarde (15:00 - 20:00)</option>
              <option value="evening">Noche (20:00 - 00:00)</option>
            </select>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: '6px', color: '#334155', fontSize: '0.9rem' }}>
            Password temporal *
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box', fontFamily: 'monospace' }}
            />
            <button
              type="button"
              onClick={() => setPassword(generarPassword())}
              style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              🎲 Generar
            </button>
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '8px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: loading ? '#94a3b8' : '#2563eb', color: '#fff', fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </main>
  );
}
