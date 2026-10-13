'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ReservaConfirmadaPage() {
  const params = useParams();
  const id = params?.id as string;

  const [reserva, setReserva] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function cargar() {
      const { data } = await supabase
        .from('reservations')
        .select('*, restaurants(name, city)')
        .eq('id', id)
        .single();
      setReserva(data);
      setCargando(false);
    }
    cargar();
  }, [id]);

  if (cargando) {
    return <div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando...</div>;
  }

  if (!reserva) {
    return <div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Reserva no encontrada</div>;
  }

  const BASE_URL = 'https://app.iokkio.com';
  const linkInvitados = `${BASE_URL}/menu-grupo?id=${reserva.id}`;
  const mensaje = `¡Hola! 🎉\n\nReservé una mesa en *${reserva.restaurants?.name}* para el ${reserva.reservation_date} a las ${reserva.reservation_time}.\n\n👉 Entrá a este link para elegir tu menú:\n${linkInvitados}`;
  const telefonoLimpio = (reserva.organizer_phone || '').replace(/\D/g, '');
  const whatsappLink = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`;

  const copiarLink = () => {
    navigator.clipboard.writeText(linkInvitados);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <main style={{ maxWidth: '560px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🎉</div>
        <h1 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.6rem', fontWeight: 800 }}>
          ¡Reserva confirmada!
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          {reserva.restaurants?.name} · {reserva.restaurants?.city}
        </p>
      </div>

      <div style={{ backgroundColor: '#f1f5f9', padding: '1rem 1.2rem', borderRadius: '10px', marginBottom: '1.5rem', borderLeft: '4px solid #2563eb' }}>
        <div style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '0.4rem' }}>
          📅 <strong>Fecha:</strong> {reserva.reservation_date}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '0.4rem' }}>
          ⏰ <strong>Hora:</strong> {reserva.reservation_time}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#334155' }}>
          👥 <strong>Personas:</strong> {reserva.guest_count}
        </div>
      </div>

      <div style={{ backgroundColor: '#fffbeb', padding: '1.2rem', borderRadius: '10px', border: '1px solid #fde68a', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📨</span>
          <strong style={{ fontSize: '0.95rem', color: '#78350f' }}>Reenviá este link a tus invitados</strong>
        </div>
        <p style={{ margin: '0 0 1rem 0', color: '#92400e', fontSize: '0.88rem', lineHeight: '1.6' }}>
          Cada uno pone su nombre, elige su menú, y vos recibís todo en tiempo real.
        </p>

        <div style={{ backgroundColor: '#fff', padding: '0.8rem', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.72rem', wordBreak: 'break-all', marginBottom: '1rem', color: '#334155', border: '1px solid #fde68a' }}>
          {linkInvitados}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            style={{
              backgroundColor: '#25d366',
              color: '#fff',
              padding: '0.75rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            📱 Enviar por WhatsApp
          </a>
          <button
            onClick={copiarLink}
            style={{
              backgroundColor: '#f1f5f9',
              color: '#334155',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {copiado ? '✅ Link copiado' : '📋 Copiar link'}
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#166534', lineHeight: '1.6' }}>
          🕐 <strong>¿Qué pasa ahora?</strong> Te enviaremos una notificación 15 minutos antes para confirmar tu reserva. Cuando confirmes, tus invitados podrán elegir su menú.
        </p>
      </div>

    </main>
  );
}
