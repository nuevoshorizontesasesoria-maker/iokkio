'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PreorderItem {
  id?: string;
  reservation_id: string;
  guest_name: string;
  guest_phone?: string;
  menu_item_id?: string;
  item_name?: string; // Por si guardas el nombre directo
  menu_items?: {
    name?: string;
  };
}

interface ReservaDetalle {
  id: string;
  restaurant_id: string;
  reservation_date: string;
  reservation_time: string;
  organizer_name: string;
  organizer_phone: string;
  guest_count: number;
  status: string;
  preorders: PreorderItem[];
}

interface SucursalRestaurante {
  id: string;
  name: string;
  city?: string;
}

export default function TableroReservasComandasPage() {
  const [sucursales, setSucursales] = useState<SucursalRestaurante[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [reservas, setReservas] = useState<ReservaDetalle[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // 1. Obtener lista de restaurantes / sucursales
  useEffect(() => {
    async function obtenerSucursales() {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, city');

        if (error) throw error;

        if (data && data.length > 0) {
          setSucursales(data);
          setSelectedBranchId(data[0].id);
        }
      } catch (err) {
        console.error('Error al cargar sucursales:', err);
      }
    }
    obtenerSucursales();
  }, []);

  // 2. Cargar Reservas y Comandas en 2 pasos ultra seguros
  const cargarReservasPorSucursal = async () => {
    if (!selectedBranchId) return;
    setCargando(true);

    try {
      // Paso A: Obtener las reservas del restaurante seleccionado
      const { data: dataReservas, error: errorRes } = await supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', selectedBranchId)
        .order('reservation_time', { ascending: true });

      if (errorRes) throw errorRes;

      if (!dataReservas || dataReservas.length === 0) {
        setReservas([]);
        setCargando(false);
        return;
      }

      // Obtener los IDs de las reservas encontradas
      const resIds = dataReservas.map((r) => r.id);

      // Paso B: Obtener todas las preórdenes vinculadas a estas reservas
      const { data: dataPreorders, error: errorPre } = await supabase
        .from('preorders')
        .select(`
          *,
          menu_items ( name )
        `)
        .in('reservation_id', resIds);

      if (errorPre) {
        console.warn('Aviso cargando preorders con join, intentando sin join:', errorPre);
      }

      // Paso C: Mapear y unir las preórdenes con sus respectivas reservas
      const reservasCompletas: ReservaDetalle[] = dataReservas.map((res) => {
        const misPreorders = (dataPreorders || []).filter(
          (p) => p.reservation_id === res.id
        );

        return {
          ...res,
          preorders: misPreorders,
        };
      });

      setReservas(reservasCompletas);
    } catch (err: any) {
      console.error('Error cargando reservas:', err.message || err);
    } finally {
      setCargando(false);
    }
  };

  // 3. Efecto Realtime
  useEffect(() => {
    cargarReservasPorSucursal();

    if (!selectedBranchId) return;

    const canalLive = supabase
      .channel(`live-sucursal-${selectedBranchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'preorders' },
        () => cargarReservasPorSucursal()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => cargarReservasPorSucursal()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalLive);
    };
  }, [selectedBranchId]);

  // Agrupar platillos por comensal
  const agruparPedidosPorComensal = (preorders: PreorderItem[]) => {
    const comensalesMap: { [key: string]: string[] } = {};

    preorders?.forEach((p) => {
      const nombre = p.guest_name || 'Comensal';
      if (!comensalesMap[nombre]) comensalesMap[nombre] = [];
      
      // Busca el nombre del plato en menu_items o en item_name
      const nombrePlato = p.menu_items?.name || p.item_name || 'Platillo seleccionado';
      comensalesMap[nombre].push(nombrePlato);
    });

    return comensalesMap;
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* Encabezado */}
      <section style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', color: '#1a202c' }}>📋 Tablero de Reservas y Comandas</h1>
        
        <div style={{ maxWidth: '450px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', color: '#4a5568', fontSize: '0.9rem' }}>
            📍 Seleccionar Sucursal:
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '1rem', fontWeight: 'bold', color: '#2d3748', backgroundColor: '#f7fafc' }}
          >
            {sucursales.map((sucursal, index) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.name} — {sucursal.city ? sucursal.city : `Sucursal ${index + 1}`} (ID: {sucursal.id.substring(0, 5)}...)
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Renderizado */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>Cargando comandas de la sucursal...</div>
      ) : reservas.length === 0 ? (
        <div style={{ textAlign: 'center', background: '#fff', padding: '3rem', borderRadius: '10px', color: '#718096' }}>
          No hay reservas registradas para esta sucursal.
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
                {/* Cabecera */}
                <div style={{ backgroundColor: '#2d3748', color: '#fff', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    ⏰ {res.reservation_time || 'Sin hora'} hs
                  </div>
                  <span style={{ fontSize: '0.8rem', backgroundColor: res.status === 'confirmed' ? '#38a169' : '#d69e2e', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {res.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>

                {/* Datos Responsable */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #edf2f7', backgroundColor: '#f7fafc' }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Responsable Mesa</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2d3748' }}>👤 {res.organizer_name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>📱 WhatsApp: {res.organizer_phone}</div>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.2rem' }}>👥 Personas: {res.guest_count}</div>
                </div>

                {/* Comandas */}
                <div style={{ padding: '1.25rem', flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Comandas por Comensal</div>

                  {nombresComensales.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#a0aec0', fontSize: '0.9rem' }}>Esperando elecciones de los comensales...</p>
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

                {/* Footer */}
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