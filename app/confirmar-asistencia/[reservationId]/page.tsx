'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ReservaInfo {
  id: string;
  organizer_name: string;
  reservation_date: string;
  reservation_time: string;
  guest_count: number;
  restaurant_name?: string;
  comandas_open: boolean;
  organizer_confirmed: boolean;
  status: string;
}

export default function ConfirmarAsistenciaPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params?.reservationId as string;

  const [reserva, setReserva] = useState<ReservaInfo | null>(null);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [estado, setEstado] = useState<'pendiente' | 'confirmado' | 'cancelado' | 'error'>('pendiente');
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    if (!reservationId) {
      setEstado('error');
      setMensajeError('ID de reserva no válido');
      setCargando(false);
      return;
    }

    async function cargarReserva() {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*, restaurants(name)')
          .eq('id', reservationId)
          .single();

        if (error || !data) throw new Error('Reserva no encontrada');

        setReserva({
          id: data.id,
          organizer_name: data.organizer_name,
          reservation_date: data.reservation_date,
          reservation_time: data.reservation_time,
          guest_count: data.guest_count,
          restaurant_name: data.restaurants?.name || 'el restaurante',
          comandas_open: data.comandas_open || false,
          organizer_confirmed: data.organizer_confirmed || false,
          status: data.status || 'pending',
        });

        // Si ya estaba confirmada, mostrar directamente el estado
        if (data.organizer_confirmed) {
          setEstado('confirmado');
        } else if (data.status === 'cancelled') {
          setEstado('cancelado');
        }
      } catch (err: any) {
        setEstado('error');
        setMensajeError(err.message);
      } finally {
        setCargando(false);
      }
    }

    cargarReserva();
  }, [reservationId]);

  async function confirmar() {
    if (!reserva) return;
    setProcesando(true);

    try {
      const response = await fetch('/api/confirm-organizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: reserva.id, confirmed: true }),
      });

      if (!response.ok) throw new Error('Error confirmando la reserva');

      setEstado('confirmado');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  }

  async function cancelar() {
    if (!reserva) return;

    const confirmacion = window.confirm(
      '¿Seguro querés cancelar la reserva? Esta acción no se puede deshacer.'
    );
    if (!confirmacion) return;

    setProcesando(true);

    try {
      const response = await fetch('/api/confirm-organizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: reserva.id, confirmed: false }),
      });

      if (!response.ok) throw new Error('Error cancelando la reserva');

      setEstado('cancelado');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  }

  // ============================================
  // RENDER: CARGANDO
  // ============================================
  if (cargando) {
    return (
      <main style={{ maxWidth: '500px', margin: '4rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Cargando reserva...</p>
      </main>
    );
  }

  // ============================================
  // RENDER: ERROR
  // ============================================
  if (estado === 'error') {
    return (
      <main style={{ maxWidth: '450px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
        <h2 style={{ color: '#d32f2f', marginBottom: '1rem', fontSize: '1.4rem' }}>Error</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>{mensajeError}</p>
        <a
          href="/"
          style={{
            display: 'inline-block',
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '0.6rem 1.2rem',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: '700',
          }}
        >
          ← Volver al inicio
        </a>
      </main>
    );
  }

  // ============================================
  // RENDER: CONFIRMADO
  // ============================================
  if (estado === 'confirmado') {
    return (
      <main style={{ maxWidth: '500px', margin: '4rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h1 style={{ color: '#16a34a', marginBottom: '1rem', fontSize: '1.5rem' }}>
          ¡Reserva confirmada!
        </h1>
        <p style={{ color: '#475569', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          <strong>{reserva?.organizer_name}</strong>, tu mesa en <strong>{reserva?.restaurant_name}</strong> está confirmada.
        </p>

        <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #16a34a', marginBottom: '1.5rem', textAlign: 'left' }}>
          <div style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '0.4rem' }}>
            📅 <strong>Fecha:</strong> {reserva?.reservation_date}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#166534', marginBottom: '0.4rem' }}>
            ⏰ <strong>Hora:</strong> {reserva?.reservation_time}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#166534' }}>
            👥 <strong>Personas:</strong> {reserva?.guest_count}
          </div>
        </div>

        <div style={{ backgroundColor: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fde68a', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#78350f', lineHeight: '1.6' }}>
            🍽️ <strong>Ya abrimos las comandas.</strong> Tus invitados pueden elegir su menú desde el link que compartiste.
          </p>
        </div>

        <a
          href={`/menu-grupo?id=${reserva?.id}`}
          style={{
            display: 'inline-block',
            marginTop: '1.5rem',
            backgroundColor: '#2563eb',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            textDecoration: 'none',
            fontSize: '0.95rem',
            fontWeight: 700,
          }}
        >
          Ver el menú grupal
        </a>
      </main>
    );
  }

  // ============================================
  // RENDER: CANCELADO
  // ============================================
  if (estado === 'cancelado') {
    return (
      <main style={{ maxWidth: '500px', margin: '4rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
        <h1 style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '1.5rem' }}>
          Reserva cancelada
        </h1>
        <p style={{ color: '#475569', lineHeight: '1.6' }}>
          La reserva en <strong>{reserva?.restaurant_name}</strong> fue cancelada. Si fue un error, contactá al restaurante.
        </p>
      </main>
    );
  }

  // ============================================
  // RENDER: PENDIENTE (debe confirmar)
  // ============================================
  return (
    <main style={{ maxWidth: '520px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🍽️</div>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: 800 }}>
          ¿Confirmás tu reserva?
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          Tu mesa empieza pronto. Confirmá para que abramos las comandas a tus invitados.
        </p>
      </div>

      <div style={{ backgroundColor: '#f1f5f9', padding: '1.2rem', borderRadius: '10px', marginBottom: '1.5rem', borderLeft: '4px solid #2563eb' }}>
        <div style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '0.6rem' }}>
          👤 <strong>Anfitrión:</strong> {reserva?.organizer_name}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '0.6rem' }}>
          🏪 <strong>Restaurante:</strong> {reserva?.restaurant_name}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '0.6rem' }}>
          📅 <strong>Fecha:</strong> {reserva?.reservation_date}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#334155', marginBottom: '0.6rem' }}>
          ⏰ <strong>Hora:</strong> {reserva?.reservation_time}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#334155' }}>
          👥 <strong>Personas:</strong> {reserva?.guest_count}
        </div>
      </div>

      <button
        onClick={confirmar}
        disabled={procesando}
        style={{
          width: '100%',
          backgroundColor: procesando ? '#94a3b8' : '#16a34a',
          color: '#fff',
          padding: '1rem',
          borderRadius: '10px',
          border: 'none',
          fontSize: '1.05rem',
          fontWeight: 700,
          cursor: procesando ? 'wait' : 'pointer',
          marginBottom: '0.75rem',
          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
        }}
      >
        {procesando ? '⏳ Procesando...' : '✅ Sí, confirmo mi reserva'}
      </button>

      <button
        onClick={cancelar}
        disabled={procesando}
        style={{
          width: '100%',
          backgroundColor: '#fff',
          color: '#dc2626',
          padding: '0.85rem',
          borderRadius: '10px',
          border: '2px solid #fecaca',
          fontSize: '0.95rem',
          fontWeight: 700,
          cursor: procesando ? 'wait' : 'pointer',
        }}
      >
        ❌ No podemos ir
      </button>

      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', marginTop: '1.5rem' }}>
        Al confirmar, tus invitados recibirán una notificación para elegir su menú.
      </p>
    </main>
  );
}