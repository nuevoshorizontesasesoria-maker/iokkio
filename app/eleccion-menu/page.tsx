'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const RESERVA_DEMO_ID = '1bedc4d7-e326-45a5-be37-321a9859bdc9';

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
        // 1. Guest — valida que pertenezca a esa reserva
        const { data: guestData, error: guestError } = await supabase
          .from('guests')
          .select('*')
          .eq('id', guestId)
          .eq('reservation_id', reservationId)
          .single();

        if (guestError || !guestData) throw new Error('Invitado no encontrado para esta reserva.');
        setInvitado(guestData);

        // 2. Si ya preordenó, mostrar éxito directamente
        if (guestData.preordered) {
          setEstado('exito');
          return;
        }

        // 3. Cargar reserva + restaurante
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select('*, restaurants(name)')
          .eq('id', reservationId)
          .single();

        if (resError || !resData) throw new Error('Reserva no encontrada.');
        setReserva(resData);

        // 4. Cargar menú — solo activos de ese restaurante
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', resData.restaurant_id)
          .eq('active', true);

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
      // Verificar duplicados
      const { data: existing } = await supabase
        .from('preorders')
        .select('id')
        .eq('reservation_id', reservationId)
        .eq('guest_phone', invitado.phone);

      if (existing && existing.length > 0) {
        alert('Ya habíamos registrado tu elección previamente.');
        setEstado('exito');
        return;
      }

      // Insertar selecciones
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

      // Marcar guest como preordered
      const { error: updateError } = await supabase
        .from('guests')
        .update({ preordered: true })
        .eq('id', guestId);

      if (updateError) throw updateError;

      // Notificar al restaurante
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

  // Filtrar por categoría con los valores exactos de tu DB
  const bebidas = menuItems.filter((i) => i.category === 'Bebida');
  const entradas = menuItems.filter((i) => i.category === 'Entrada');

  if (estado === 'cargando') {
    return <div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando menú...</div>;
  }

  if (estado === 'error') {
    const esSinParametros = mensajeError === 'Enlace inválido o incompleto.';

    // ✅ PÁGINA EDUCATIVA — cuando entran sin parámetros
    if (esSinParametros) {
      return (
        <main style={{ maxWidth: '520px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍽️</div>
            <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: '800' }}>
              Menú del Comensal
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              Cada invitado elige su menú desde un link personal
            </p>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1.2rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📱</span>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>¿Cómo llego al menú?</strong>
            </div>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem', lineHeight: '1.6' }}>
              El organizador de la reserva te comparte un link por WhatsApp. Cuando lo abras, vas a poder elegir tu bebida y entrada sin registrarte.
            </p>
          </div>

          <div style={{ backgroundColor: '#f0fdf4', padding: '1.2rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🏪</span>
              <strong style={{ fontSize: '0.95rem', color: '#14532d' }}>¿Sos el restaurante?</strong>
            </div>
            <p style={{ margin: '0 0 0.7rem 0', color: '#166534', fontSize: '0.88rem', lineHeight: '1.6' }}>
              Ingresá a tu panel de gestión para ver las reservas y comandas de tu local.
            </p>
            <a
              href="/tablero-de-reservas-y-comandas"
              style={{
                display: 'inline-block',
                backgroundColor: '#16a34a',
                color: '#fff',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: '700',
              }}
            >
              Ir al panel del restaurante →
            </a>
          </div>

          <div style={{ backgroundColor: '#fffbeb', padding: '1.2rem', borderRadius: '10px', border: '1px solid #fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🧪</span>
              <strong style={{ fontSize: '0.95rem', color: '#78350f' }}>Modo demo</strong>
            </div>
            <p style={{ margin: '0 0 0.7rem 0', color: '#92400e', fontSize: '0.88rem', lineHeight: '1.6' }}>
              Si estás probando el sistema, podés abrir un menú de ejemplo con datos reales:
            </p>
            <a
              href={`/menu-grupo?id=${RESERVA_DEMO_ID}`}
              style={{
                display: 'inline-block',
                backgroundColor: '#f59e0b',
                color: '#fff',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: '700',
              }}
            >
              🔗 Probar menú de ejemplo →
            </a>
            <p style={{ margin: '0.7rem 0 0 0', color: '#a16207', fontSize: '0.75rem', fontStyle: 'italic' }}>
              (Este link solo funciona en el entorno de demo)
            </p>
          </div>

        </main>
      );
    }

    // ❌ ERROR REAL — invitado no encontrado, reserva borrada, etc.
    return (
      <main style={{ maxWidth: '450px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
        <h2 style={{ color: '#d32f2f', marginBottom: '1rem', fontSize: '1.4rem' }}>Enlace no válido</h2>
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
            {bebidas.map((item) => (
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
            {entradas.map((item) => (
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