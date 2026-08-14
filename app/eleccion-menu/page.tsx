'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function EleccionMenuContenido() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservation_id');
  const guestId = searchParams.get('guest_id');

  const [guest, setGuest] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [bebida, setBebida] = useState<string>('');
  const [entrada, setEntrada] = useState<string>('');
  const [estado, setEstado] = useState<string>('cargando');

  useEffect(() => {
    if (!reservationId || !guestId) {
      setEstado('error');
      return;
    }

    async function cargar() {
      try {
        const { data: guestData, error: gErr } = await supabase
          .from('guests')
          .select('*')
          .eq('id', guestId)
          .single();

        if (gErr || !guestData) throw new Error('Invitación no encontrada.');
        setGuest(guestData);

        const { data: resData } = await supabase
          .from('reservations')
          .select('restaurant_id')
          .eq('id', reservationId)
          .single();

        if (resData) {
          const { data: menuData } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', resData.restaurant_id);

          setMenuItems(menuData || []);
        }

        setEstado('pendiente');
      } catch (err) {
        setEstado('error');
      }
    }

    cargar();
  }, [reservationId, guestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bebida || !entrada) {
      alert('Por favor selecciona tu bebida y entrada.');
      return;
    }

    try {
      const { error } = await supabase.from('preorders').insert([
        {
          reservation_id: reservationId,
          menu_item_id: bebida,
          guest_name: guest?.name,
          guest_phone: guest?.phone,
          quantity: 1,
        },
        {
          reservation_id: reservationId,
          menu_item_id: entrada,
          guest_name: guest?.name,
          guest_phone: guest?.phone,
          quantity: 1,
        },
      ]);

      if (error) throw error;
      setEstado('exito');
    } catch (err: any) {
      alert(`Error al guardar tu menú: ${err.message}`);
    }
  };

  if (estado === 'cargando') return <div style={{ textAlign: 'center', marginTop: '5rem', fontFamily: 'sans-serif' }}>Cargando menú...</div>;
  if (estado === 'error') return <div style={{ textAlign: 'center', marginTop: '5rem', color: 'red', fontFamily: 'sans-serif' }}>Enlace no válido.</div>;
  if (estado === 'exito') {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem', color: '#2e7d32', fontFamily: 'sans-serif' }}>
        <h2>¡Gracias, {guest?.name}!</h2>
        <p>Tus opciones de menú se guardaron correctamente.</p>
      </div>
    );
  }

  return (
    <main style={{ maxWidth: '450px', margin: '3rem auto', padding: '2rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Hola, {guest?.name} 👋</h2>
      <p style={{ textAlign: 'center', color: '#666', marginBottom: '1.5rem' }}>Elige tus opciones de menú para la reserva:</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Tu Bebida:</label>
          <select value={bebida} onChange={(e) => setBebida(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem' }}>
            <option value="">-- Selecciona una bebida --</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>{item.name} {item.price ? `- $${item.price}` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', fontSize: '0.9rem' }}>Tu Entrada:</label>
          <select value={entrada} onChange={(e) => setEntrada(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem' }}>
            <option value="">-- Selecciona una entrada --</option>
            {menuItems.map((item) => (
              <option key={item.id} value={item.id}>{item.name} {item.price ? `- $${item.price}` : ''}</option>
            ))}
          </select>
        </div>

        <button type="submit" style={{ background: '#2e7d32', color: '#fff', padding: '0.85rem', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '1rem', fontSize: '1rem' }}>
          Guardar Mi Menú
        </button>
      </form>
    </main>
  );
}

export default function EleccionMenuPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '5rem', fontFamily: 'sans-serif' }}>Cargando...</div>}>
      <EleccionMenuContenido />
    </Suspense>
  );
}
