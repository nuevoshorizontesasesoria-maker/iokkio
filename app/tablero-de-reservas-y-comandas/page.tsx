'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PreorderItem {
  id?: string;
  reservation_id: string;
  guest_name: string;
  guest_phone?: string;
  menu_item_id?: string;
  item_name?: string;
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
  
  // Filtros de Fecha
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');

  const [reservas, setReservas] = useState<ReservaDetalle[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // 1. Obtener lista de sucursales
  useEffect(() => {
    async function obtenerSucursales() {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, city');

        if (error) {
          console.error('Error al obtener restaurantes:', error);
          return;
        }

        if (data && data.length > 0) {
          setSucursales(data);
          setSelectedBranchId(data[0].id);
        }
      } catch (err) {
        console.error('Error de red al cargar sucursales:', err);
      }
    }
    obtenerSucursales();
  }, []);

  // 2. Cargar Reservas con opción de filtro por Rango de Fechas
  const cargarReservasPorSucursal = async () => {
    if (!selectedBranchId) return;
    setCargando(true);

    try {
      // Construimos la consulta base
      let query = supabase
        .from('reservations')
        .select('*')
        .eq('restaurant_id', selectedBranchId);

      // Si el usuario ingresó 'Fecha Desde'
      if (fechaDesde) {
        query = query.gte('reservation_date', fechaDesde);
      }

      // Si el usuario ingresó 'Fecha Hasta'
      if (fechaHasta) {
        query = query.lte('reservation_date', fechaHasta);
      }

      // Ordenar por fecha y hora ascendente
      query = query.order('reservation_date', { ascending: true });

      const { data: dataReservas, error: errorRes } = await query;

      if (errorRes) {
        console.error('Error devuelto por Supabase al buscar reservas:', errorRes);
        throw errorRes;
      }

      if (!dataReservas || dataReservas.length === 0) {
        setReservas([]);
        setCargando(false);
        return;
      }

      // Obtener IDs para buscar preorders
      const resIds = dataReservas.map((r) => r.id);

      // Traemos las preorders asociadas
      const { data: dataPreorders, error: errorPre } = await supabase
        .from('preorders')
        .select('*')
        .in('reservation_id', resIds);

      if (errorPre) {
        console.warn('Advertencia en preorders:', errorPre);
      }

      // Unir preorders con cada reserva
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
      console.error('Error en consulta de reservas:', err.message || err);
    } finally {
      setCargando(false);
    }
  };

  // 3. Efecto al cambiar de Sucursal o al aplicar filtro
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

  // Manejar búsqueda por filtro
  const handleFiltrarFechas = (e: React.FormEvent) => {
    e.preventDefault();
    cargarReservasPorSucursal();
  };

  // Limpiar rango de fechas
  const handleLimpiarFiltro = () => {
    setFechaDesde('');
    setFechaHasta('');
    // Al limpiar vuelve a cargar sin filtro
    setTimeout(() => {
      cargarReservasPorSucursal();
    }, 50);
  };

  // Auxiliar para agrupar platillos por comensal
  const agruparPedidosPorComensal = (preorders: PreorderItem[]) => {
    const comensalesMap: { [key: string]: string[] } = {};

    preorders?.forEach((p) => {
      const nombre = p.guest_name || 'Comensal';
      if (!comensalesMap[nombre]) comensalesMap[nombre] = [];

      const plato = p.item_name || 'Platillo seleccionado';
      comensalesMap[nombre].push(plato);
    });

    return comensalesMap;
  };

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      
      {/* Contenedor de Filtros */}
      <section style={{ backgroundColor: '#fff', padding: '1.5rem', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 1.2rem 0', fontSize: '1.5rem', color: '#1a202c' }}>📋 Tablero de Reservas y Comandas</h1>
        
        <form onSubmit={handleFiltrarFechas} style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
          
          {/* Desplegable de Sucursal */}
          <div style={{ flex: '1 1 250px', minWidth: '220px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', color: '#4a5568', fontSize: '0.9rem' }}>
              📍 Seleccionar Sucursal:
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.95rem', fontWeight: 'bold', color: '#2d3748', backgroundColor: '#f7fafc' }}
            >
              {sucursales.map((sucursal, index) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.name} — {sucursal.city ? sucursal.city : `Sucursal ${index + 1}`} (ID: {sucursal.id.substring(0, 6)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Desde */}
          <div style={{ flex: '1 1 150px', minWidth: '140px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', color: '#4a5568', fontSize: '0.9rem' }}>
              📅 Desde:
            </label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.95rem', color: '#2d3748', backgroundColor: '#f7fafc' }}
            />
          </div>

          {/* Fecha Hasta */}
          <div style={{ flex: '1 1 150px', minWidth: '140px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', color: '#4a5568', fontSize: '0.9rem' }}>
              📅 Hasta:
            </label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '0.95rem', color: '#2d3748', backgroundColor: '#f7fafc' }}
            />
          </div>

          {/* Botones de Acción */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              style={{ padding: '0.65rem 1.2rem', borderRadius: '6px', backgroundColor: '#3182ce', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
            >
              🔍 Buscar
            </button>
            {(fechaDesde || fechaHasta) && (
              <button
                type="button"
                onClick={handleLimpiarFiltro}
                style={{ padding: '0.65rem 1rem', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#4a5568', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem' }}
              >
                ✖ Limpiar
              </button>
            )}
          </div>

        </form>
      </section>

      {/* Renders de Reservas */}
      {cargando ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>Cargando reservas...</div>
      ) : reservas.length === 0 ? (
        <div style={{ textAlign: 'center', background: '#fff', padding: '3rem', borderRadius: '10px', color: '#718096' }}>
          No se encontraron reservas para el rango seleccionado.
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
                {/* Cabecera Tarjeta */}
                <div style={{ backgroundColor: '#2d3748', color: '#fff', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>
                    📅 {res.reservation_date || 'Sin fecha'} {res.reservation_time ? `— ⏰ ${res.reservation_time} hs` : ''}
                  </div>
                  <span style={{ fontSize: '0.75rem', backgroundColor: res.status === 'confirmed' ? '#38a169' : '#d69e2e', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {res.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                  </span>
                </div>

                {/* Responsable */}
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #edf2f7', backgroundColor: '#f7fafc' }}>
                  <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Responsable Mesa</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2d3748' }}>👤 {res.organizer_name}</div>
                  <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>📱 WhatsApp: {res.organizer_phone}</div>
                  <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '0.2rem' }}>👥 Personas: {res.guest_count}</div>
                </div>

                {/* Comandas */}
                <div style={{ padding: '1.25rem', flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Comandas</div>

                  {nombresComensales.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#a0aec0', fontSize: '0.9rem' }}>Sin elecciones de platos aún...</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {nombresComensales.map((nombre, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            padding: '0.75rem', 
                            borderRadius: '8px', 
                            backgroundColor: '#edf2f7',
                            borderLeft: '4px solid #cbd5e0'
                          }}
                        >
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#2d3748' }}>
                            Comensal {index + 1}: {nombre}
                          </div>
                          <ul style={{ margin: '0.3rem 0 0 0', paddingLeft: '1.2rem', fontSize: '0.88rem', color: '#4a5568' }}>
                            {comensalesMap[nombre].map((pedido, pIndex) => (
                              <li key={pIndex}>{pedido}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pie Tarjeta */}
                <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#edf2f7', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#4a5568', textAlign: 'right', fontWeight: 'bold' }}>
                  Comensales en la reserva: {res.guest_count}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}