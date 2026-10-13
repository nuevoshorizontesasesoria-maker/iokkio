'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PushPermissionButton } from '@/components/PushPermissionButton';

function MenuGrupoContenido() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [reserva, setReserva] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [preorders, setPreorders] = useState<any[]>([]);
  const [nombreComensal, setNombreComensal] = useState('');
  const [isNombreGuardado, setIsNombreGuardado] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState('');
  const [estado, setEstado] = useState('cargando');
  const [comandasAbiertas, setComandasAbiertas] = useState(false);

  useEffect(() => {
    if (!id) {
      setEstado('sin-id');
      return;
    }

    async function cargarDatosIniciales() {
      try {
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select('*, restaurants(name)')
          .eq('id', id)
          .single();

        if (resError || !resData) throw new Error('Reserva no encontrada');
        setReserva(resData);
        setComandasAbiertas(resData.comandas_open === true);

        const { data: menuData } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', resData.restaurant_id)
          .eq('active', true);
        setMenuItems(menuData || []);

        const { data: preorderData } = await supabase
          .from('preorders')
          .select('*')
          .eq('reservation_id', id);
        setPreorders(preorderData || []);

        setEstado('listo');
      } catch (err) {
        setEstado('error');
      }
    }

    cargarDatosIniciales();

    // Realtime: escuchar cambios en la reserva (cuando el anfitrión confirma)
    const channelReserva = supabase
      .channel(`reserva-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reservations',
          filter: `id=eq.${id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setReserva(payload.new);
            setComandasAbiertas(payload.new.comandas_open === true);
          }
        }
      )
      .subscribe();

    // Realtime: escuchar cambios en preorders (para ver los platos de la mesa)
    const channelPreorders = supabase
      .channel(`preorders-reserva-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'preorders',
          filter: `reservation_id=eq.${id}`,
        },
        async () => {
          const { data: preorderData } = await supabase
            .from('preorders')
            .select('*')
            .eq('reservation_id', id);
          setPreorders(preorderData || []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelReserva);
      supabase.removeChannel(channelPreorders);
    };
  }, [id]);

  const handleAgregarPlato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSeleccionado || !nombreComensal) return;

    const platoElegido = menuItems.find((item) => item.id === itemSeleccionado);

    const { error } = await supabase.from('preorders').insert([
      {
        reservation_id: id,
        menu_item_id: itemSeleccionado,
        item_name: platoElegido?.name || 'Plato',
        guest_name: nombreComensal,
      },
    ]);

    if (error) {
      alert('Error al registrar tu elección');
    } else {
      setItemSeleccionado('');
    }
  };

  const eliminarMiPedido = async (preorderId: string) => {
    const { error } = await supabase.from('preorders').delete().eq('id', preorderId);
    if (error) {
      alert('No se pudo eliminar el plato');
    }
  };

  // ============================================
  // RENDER: SIN ID
  // ============================================
  if (estado === 'sin-id') {
    return (
      <main style={{ maxWidth: '520px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🍽️</div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.5rem', fontWeight: '800' }}>
            Menú Grupal
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Cada comensal elige su menú desde un link compartido
          </p>
        </div>

        <div style={{ backgroundColor: '#f8fafc', padding: '1.2rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
            <span style={{ fontSize: '1.2rem' }}>📱</span>
            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>¿Cómo llego al menú?</strong>
          </div>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem', lineHeight: '1.6' }}>
            El organizador de la reserva te comparte un link por WhatsApp. Cuando lo abras, vas a poder elegir tu menú sin registrarte.
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
      </main>
    );
  }

  if (estado === 'cargando') {
    return <div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando menú colaborativo...</div>;
  }

  if (estado === 'error') {
    return (
      <main style={{ maxWidth: '450px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
        <h2 style={{ color: '#d32f2f', marginBottom: '1rem', fontSize: '1.4rem' }}>Enlace no válido</h2>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Reserva no encontrada o link incompleto.</p>
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
  // RENDER: COMANDAS CERRADAS (esperando anfitrión)
  // ============================================
  if (!comandasAbiertas) {
    return (
      <main style={{ maxWidth: '540px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⏳</div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a', fontSize: '1.4rem', fontWeight: '800' }}>
            Esperando confirmación del anfitrión
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
            El organizador debe confirmar la reserva 15 minutos antes.
          </p>
        </div>

        <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>
            <strong>📍 Restaurante:</strong> {reserva?.restaurants?.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.4rem' }}>
            <strong>📅 Fecha:</strong> {reserva?.reservation_date}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#475569' }}>
            <strong>⏰ Hora:</strong> {reserva?.reservation_time}
          </div>
        </div>

        <div style={{ backgroundColor: '#fffbeb', padding: '1.2rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🔔</span>
            <strong style={{ fontSize: '0.95rem', color: '#78350f' }}>Activá las notificaciones</strong>
          </div>
          <p style={{ margin: '0 0 1rem 0', color: '#92400e', fontSize: '0.88rem', lineHeight: '1.6' }}>
            Te avisamos al instante cuando el anfitrión confirme y puedas elegir tu menú.
          </p>
          <PushPermissionButton reservationId={id!} role="guest" />
        </div>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem', marginTop: '1rem' }}>
          💡 Tip: Podés cerrar esta pestaña. Te avisaremos cuando sea el momento de elegir.
        </p>
      </main>
    );
  }

  // ============================================
  // RENDER: COMANDAS ABIERTAS (elegir menú)
  // ============================================
  return (
    <main style={{ maxWidth: '600px', margin: '3rem auto', padding: '2rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
        <h2 style={{ margin: '0 0 0.5rem 0' }}>¡Ya podés elegir tu menú!</h2>
        <p style={{ color: '#666', margin: 0 }}>
          Restaurante: <strong>{reserva?.restaurants?.name}</strong>
        </p>
      </div>

      {!isNombreGuardado ? (
        <div style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid #eee' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>¿Cómo te llamas?</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Ingresá tu nombre para guardar tus elecciones y ver qué pide tu mesa.
          </p>
          <input
            type="text"
            placeholder="Tu nombre (ej. Carlos)"
            value={nombreComensal}
            onChange={(e) => setNombreComensal(e.target.value)}
            style={{ padding: '0.75rem', width: '80%', maxWidth: '300px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '1rem', fontSize: '1rem' }}
          />
          <div>
            <button
              onClick={() => {
                if (nombreComensal.trim()) setIsNombreGuardado(true);
              }}
              style={{ background: '#2e7d32', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Comenzar a elegir
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ background: '#e8f5e9', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Participando como: <strong>{nombreComensal}</strong></span>
            <button
              onClick={() => setIsNombreGuardado(false)}
              style={{ background: 'none', border: 'none', color: '#2e7d32', cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold', fontSize: '0.9rem' }}
            >
              Cambiar nombre
            </button>
          </div>

          <form onSubmit={handleAgregarPlato} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <label style={{ fontWeight: 'bold', color: '#333' }}>Selecciona un plato, entrada o bebida:</label>
            <select
              value={itemSeleccionado}
              onChange={(e) => setItemSeleccionado(e.target.value)}
              required
              style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', background: '#fff' }}
            >
              <option value="">-- Elige una opción del menú --</option>
              {menuItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.category}) - ${item.price}
                </option>
              ))}
            </select>
            <button
              type="submit"
              style={{ background: '#1976d2', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Añadir a mi selección
            </button>
          </form>
        </div>
      )}

      <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '2rem 0' }} />

      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Resumen de la mesa (En Vivo)</h3>
      {preorders.length === 0 ? (
        <p style={{ color: '#888', fontStyle: 'italic', textAlign: 'center' }}>Nadie ha seleccionado platos todavía. ¡Sé el primero!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {preorders.map((order) => {
            const esMio = order.guest_name?.toLowerCase() === nombreComensal.toLowerCase();
            return (
              <div
                key={order.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  background: esMio ? '#f0f7ff' : '#f5f5f5',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${esMio ? '#1976d2' : '#999'}`,
                }}
              >
                <div>
                  <strong>{order.guest_name}</strong> {esMio && '(Tú)'} eligió:{' '}
                  <span style={{ color: '#333' }}>{order.item_name || 'Platillo'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {esMio && (
                    <button
                      onClick={() => eliminarMiPedido(order.id)}
                      style={{ background: '#d32f2f', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#fff' }}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function MenuGrupoPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando...</div>}>
      <MenuGrupoContenido />
    </Suspense>
  );
}
