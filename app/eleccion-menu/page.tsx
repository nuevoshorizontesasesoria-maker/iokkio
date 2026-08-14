'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function EleccionMenuContenido() {
  const searchParams = useSearchParams();
  const reservationId = searchParams?.get('reservation_id');
  const guestId = searchParams?.get('guest_id');

  const [invitado, setInvitado] = useState<any>(null);
  const [reserva, setReserva] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [bebida, setBebida] = useState<string>('');
  const [entrada, setEntrada] = useState<string>('');
  const [estado, setEstado] = useState<string>('cargando');
  const [mensajeError, setMensajeError] = useState<string>('');

  useEffect(() => {
    if (!reservationId || !guestId) {
      setEstado('error');
      setMensajeError('Enlace inválido o incompleto.');
      return;
    }

    async function cargarDatos() {
      try {
        // 1. Cargar datos del invitado
        const { data: guestData, error: guestError } = await supabase
          .from('guests')
          .select('*')
          .eq('id', guestId)
          .single();

        if (guestError || !guestData) throw new Error('Invitado no encontrado.');
        setInvitado(guestData);

        // 2. Cargar detalles de la reserva y restaurante
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select('*, restaurants(name)')
          .eq('id', reservationId)
          .single();

        if (resError || !resData) throw new Error('Reserva no encontrada.');
        setReserva(resData);

        // 3. Cargar menú del restaurante
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', resData.restaurant_id);

        if (menuError) throw new Error('Error al cargar la carta.');
        setMenuItems(menuData || []);

        setEstado('pendiente');
      } catch (err: any) {
        setEstado('error');
        setMensajeError(err.message);
      }
    }

    cargarDatos();
  }, [reservationId, guestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bebida || !entrada) {
      alert('Por favor selecciona una bebida y una entrada.');
      return;
    }

    try {
      // 1. Insertar las selecciones del acompañante en preorders
      const { error: preorderError } = await supabase
        .from('preorders')
        .insert([
          {
            reservation_id: reservationId,
            menu_item_id: bebida,
            guest_name: invitado.name,
            guest_phone: invitado.phone,
            quantity: 1,
          },
          {
            reservation_id: reservationId,
            menu_item_id: entrada,
            guest_name: invitado.name,
            guest_phone: invitado.phone,
            quantity: 1,
          },
        ]);

      if (preorderError) throw preorderError;

      // 2. Notificar al restaurante en tiempo real sobre este pedido (incluyendo el responsable)
      await fetch('/api/notificar-restaurante', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservationId,
          guest_name: invitado.name,
          guest_phone: invitado.phone,
        }),
      });

      setEstado('exito');
    } catch (err: any) {
      alert(`Error al guardar tu elección: ${err.message}`);
    }
  };

  if (estado === 'cargando') {
    return <div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando menú...</div>;
  }

  if (estado === 'error') {
    return (
      <main style={{ maxWidth: '450px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#d32f2f', marginBottom: '1rem' }}>Enlace no válido</h2>
        <p style={{ color: '#666' }}>{mensajeError}</p>
      </main>
    );
  }

  if (estado === 'exito') {
    return (
      <main style={{ maxWidth: '450px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#2e7d32', marginBottom: '1rem' }}>¡Elección Guardada!</h2>
        <p style={{ color: '#444', lineHeight: '1.6' }}>
          Gracias <strong>{invitado?.name}</strong>. Hemos registrado tus preferencias para la reserva en <strong>{reserva?.restaurants?.name}</strong>.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '500px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Hola, {invitado?.name} 👋</h2>
      <p style={{ color: '#555', textAlign: 'center', marginBottom: '1.5rem' }}>
        Selecciona tu bebida y entrada para la reserva en <strong>{reserva?.restaurants?.name}</strong>.
      </p>

      {/* Tarjeta Informativa con Horario y Responsable */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #2e7d32', fontSize: '0.95rem' }}>
        <div>⏰ <strong>Horario de Reserva:</strong> {reserva?.reservation_date || ''} a las {reserva?.reservation_time || 'Por definir'}</div>
        <div>👤 <strong>Responsable de Reserva:</strong> {reserva?.organizer_name || 'Organizador de la mesa'}</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
            Elige tu Bebida:
          </label>
          <select
            value={bebida}
            onChange={(e) => setBebida(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', background: '#fff', boxSizing: 'border-box' }}
          >
            <option value="">-- Selecciona una bebida --</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} {item.price ? `- $${item.price}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
            Elige tu Entrada:
          </label>
          <select
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', background: '#fff', boxSizing: 'border-box' }}
          >
            <option value="">-- Selecciona una entrada --</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} {item.price ? `- $${item.price}` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          style={{
            background: '#2e7d32',
            color: '#fff',
            padding: '0.85rem',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            marginTop: '1rem',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          Guardar Mi Selección
        </button>
      </form>
    </main>
  );
}

export default function EleccionMenuPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando...</div>}>
      <EleccionMenuContenido />
    </Suspense>
  );
}
