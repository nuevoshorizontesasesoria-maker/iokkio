'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PreorderItem {
  guest_name: string;
  guest_phone?: string;
  menu_items: {
    name: string;
    category?: string;
  };
}

interface ReservaDetalle {
  id: string;
  restaurant_id: string;
  branch_id?: string;
  reservation_date: string;
  reservation_time: string;
  organizer_name: string;
  organizer_phone: string;
  guest_count: number;
  status: string;
  preorders: PreorderItem[];
}

interface Restaurante {
  id: string;
  name: string;
}

interface Sucursal {
  id: string;
  restaurant_id: string;
  name: string;
}

export default function TableroReservasComandasPage() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  
  // Selección de Control de Acceso por Negocio y Sucursal
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [branchId, setBranchId] = useState<string>('');

  const [reservas, setReservas] = useState<ReservaDetalle[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // 1. Cargar lista de negocios y sucursales
  useEffect(() => {
    async function obtenerNegocios() {
      try {
        const { data: restData } = await supabase.from('restaurants').select('id, name');
        if (restData && restData.length > 0) {
          setRestaurantes(restData);
          setRestaurantId(restData[0].id); // Selecciona el primero automáticamente
        }

        const { data: branchData } = await supabase.from('branches').select('id, restaurant_id, name');
        if (branchData) {
          setSucursales(branchData);
        }
      } catch (err) {
        console.error('Error cargando los negocios:', err);
      }
    }
    obtenerNegocios();
  }, []);

  // 2. Cargar reservas filtradas estrictamente por negocio y sucursal
  const cargarReservasFiltradas = async () => {
    if (!restaurantId) return;
    setCargando(true);

    try {
      let query = supabase
        .from('reservations')
        .select(`
          id,
          restaurant_id,
          branch_id,
          reservation_date,
          reservation_time,
          organizer_name,
          organizer_phone,
          guest_count,
          status,
          preorders (
            guest_name,
            guest_phone,
            menu_items (
              name,
              category
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('reservation_time', { ascending: true });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setReservas((data as unknown as ReservaDetalle[]) || []);
    } catch (err: any) {
      console.error('Error cargando reservas:', err.message);
    } finally {
      setCargando(false);
    }
  };

  // 3. Suscripción en tiempo real por canal aislado
  useEffect(() => {
    cargarReservasFiltradas();

    if (!restaurantId) return;

    const canalLive = supabase
      .channel(`live-${restaurantId}-${branchId || 'todas'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'preorders' },
        () => cargarReservasFiltradas()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => cargarReservasFiltradas()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalLive);
    };
  }, [restaurantId, branchId]);

  // Función para agrupar platillos por comensal
  const agruparPedidosPorComensal = (preorders: PreorderItem[]) => {
    const comensalesMap: { [key: string]: string[] } = {};

    preorders?.forEach((p) => {
      const nombre = p.guest_name || 'Comensal';
      if (!comensalesMap[nombre]) comensalesMap[nombre] = [];
      if (p.menu_items?.name) comensalesMap[nombre].push(p.menu_items.name);
    });

    return comensalesMap;
  };

  const sucursalesFiltradas = sucursales.filter((s) => s.restaurant_id === restaurantId);

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* Selector de Acceso (Restaurante y Sucursal) */}
      <section style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#2d3748' }}>📋 Tablero de Reservas y Comandas — Filtro por Local</h2>
        
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Selector de Restaurante */}
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', color: '#4a5568', fontSize: '0.9rem' }}>
              Negocio / Restaurante:
            </label>
            <select
              value={restaurantId}
              onChange={(e) => {
                setRestaurantId(e.target.value);
                setBranchId('');
              }}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.95rem' }}
            >
              <option value="">-- Seleccionar Negocio --</option>
              {restaurantes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* Selector de Sucursal */}
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', color: '#4a5568', fontSize: '0.9rem' }}>
              Sucursal:
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={!restaurantId || sucursalesFiltradas.length === 0}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.95rem', backgroundColor: sucursalesFiltradas.length === 0 ? '#edf2f7' : '#fff' }}
            >
              <option value="">{sucursalesFiltradas.length === 0 ? 'Todas / Sin sucursales' : 'Todas las sucursales'}</option>
              {sucursalesFiltradas.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Renderizado de Mesas */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>Cargando información del tablero...</div>
      ) : reservas.length === 0 ? (
        <div style={{ textAlign: 'center', background: '#fff', padding: '3rem', borderRadius: '10px', color: '#718096' }}>
          No hay reservas para la sucursal seleccionada.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {reservas.map((res) => {
            const comensalesMap = agruparPedidosPorComensal(res.preorders);
            const nombresComensales = Object.keys(comensalesMap);

            return (
              <div 
                key={res.id} 
                style={{ 
                  backgroundColor: '#fff', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Cabecera: Hora y Estado */}
                <div style={{ backgroundColor: '#2d3748', color: '#fff', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    ⏰ {res.reservation_time || 'Sin hora'} hs
                  </div>
                  <span style={{ fontSize: '0.8rem', backgroundColor: res.status === 'confirmed' ? '#38a169' : '#d69e2e', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {res.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>

                {/* Responsable de Reserva */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #edf2f7', backgroundColor: '#f7fafc' }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Responsable de Mesa</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2d3748' }}>👤 {res.organizer_name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>📱 WhatsApp: {res.organizer_phone}</div>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.2rem' }}>👥 Capacidad Mesa: {res.guest_count} personas</div>
                </div>

                {/* Comandas Desglosadas por Comensal */}
                <div style={{ padding: '1.25rem', flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Comandas</div>

                  {nombresComensales.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#a0aec0', fontSize: '0.9rem' }}>Esperando selecciones de la mesa...</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {nombresComensales.map((nombre, index) => {
                        const esResp = nombre.toLowerCase().trim() === res.organizer_name?.toLowerCase().trim();
                        return (
                          <div 
                            key={index} 
                            style={{ 
                              padding: '0.75rem', 
                              borderRadius: '8px', 
                              backgroundColor: esResp ? '#f0fdf4' : '#edf2f7',
                              borderLeft: esResp ? '4px solid #38a169' : '4px solid #cbd5e0'
                            }}
                          >
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#2d3748' }}>
                              Comensal {index + 1}: {nombre} {esResp ? '(Responsable)' : ''}
                            </div>
                            <ul style={{ margin: '0.3rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.88rem', color: '#4a5568' }}>
                              {comensalesMap[nombre].map((pedido, pIndex) => (
                                <li key={pIndex}>{pedido}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pie con Contador */}
                <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#edf2f7', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#4a5568', textAlign: 'right', fontWeight: 'bold' }}>
                  Completados: {nombresComensales.length} de {res.guest_count} personas
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
