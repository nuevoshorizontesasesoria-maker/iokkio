'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function RestaurantDashboardPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [reservas, setReservas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Cargar la lista de restaurantes al iniciar
  useEffect(() => {
    async function fetchRestaurants() {
      const { data } = await supabase.from('restaurants').select('id, name');
      if (data && data.length > 0) {
        setRestaurants(data);
        setSelectedRestaurant(data[0].id); // Seleccionar el primero por defecto
      }
    }
    fetchRestaurants();
  }, []);

  // 2. Cargar las reservas y configurar Realtime cuando cambia el restaurante seleccionado
  useEffect(() => {
    if (!selectedRestaurant) return;

    async function fetchReservas() {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', selectedRestaurant)
        .order('reservation_date', { ascending: true });

      if (!error && data) {
        setReservas(data);
      }
      setLoading(false);
    }

    fetchReservas();

    // 3. Suscripción en tiempo real (Realtime de Supabase)
    const channel = supabase
      .channel(`realtime-reservations-${selectedRestaurant}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escucha INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'reservations',
          filter: `restaurant_id=eq.${selectedRestaurant}`,
        },
        (payload: any) => {
          console.log('Cambio detectado en tiempo real:', payload);

          if (payload.eventType === 'INSERT') {
            setReservas((prev) => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setReservas((prev) =>
              prev.map((r) => (r.id === payload.new.id ? payload.new : r))
            );
          } else if (payload.eventType === 'DELETE') {
            setReservas((prev) => prev.filter((r) => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Limpiar suscripción al cambiar de restaurante o desmontar el componente
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRestaurant]);

  // Colores dinámicos según el estado de la reserva
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>Confirmada</span>;
      case 'whatsapp_sent':
        return <span style={{ background: '#e3f2fd', color: '#1565c0', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>Aviso Enviado</span>;
      default:
        return <span style={{ background: '#fff3e0', color: '#e65100', padding: '0.3rem 0.6rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>Pendiente</span>;
    }
  };

  return (
    <main style={{ maxWidth: '900px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>Panel del Restaurante en Vivo</h1>
          <p style={{ color: '#666', fontSize: '0.95rem' }}>Monitorea las reservas y confirmaciones de asistencia en tiempo real.</p>
        </div>

        {restaurants.length > 0 && (
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', background: '#fff', fontWeight: 'bold' }}
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>Cargando reservas...</p>
      ) : reservas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f9f9f9', borderRadius: '8px', color: '#666' }}>
          No hay reservas registradas para este restaurante.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', color: '#555', fontSize: '0.9rem' }}>
                <th style={{ padding: '0.75rem' }}>Cliente / Teléfono</th>
                <th style={{ padding: '0.75rem' }}>Fecha</th>
                <th style={{ padding: '0.75rem' }}>Hora</th>
                <th style={{ padding: '0.75rem' }}>Comensales</th>
                <th style={{ padding: '0.75rem' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((res) => (
                <tr key={res.id} style={{ borderBottom: '1px solid #f1f1f1', fontSize: '0.95rem' }}>
                  <td style={{ padding: '1rem 0.75rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{res.organizer_name || 'Sin nombre'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{res.organizer_phone}</div>
                  </td>
                  <td style={{ padding: '1rem 0.75rem' }}>{res.reservation_date}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>{res.reservation_time}</td>
                  <td style={{ padding: '1rem 0.75rem' }}>{res.guest_count} pax</td>
                  <td style={{ padding: '1rem 0.75rem' }}>{getStatusBadge(res.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
