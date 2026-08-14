'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PreorderItem {
  id?: string;
  reservation_id: string;
  guest_name: string;
  guest_phone?: string;
  item_name?: string;
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
  address?: string;
}

export default function LandingDemoInteractivaPage() {
  const [sucursales, setSucursales] = useState<SucursalRestaurante[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [reservas, setReservas] = useState<ReservaDetalle[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Estado para el modal de Simular Nueva Reserva
  const [modalAbierto, setModalAbierto] = useState<boolean>(false);
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevoPhone, setNuevoPhone] = useState<string>('');
  const [nuevoPax, setNuevoPax] = useState<number>(2);
  const [nuevaSucursalId, setNuevaSucursalId] = useState<string>('');

  // 1. Cargar Sucursales
  useEffect(() => {
    async function obtenerSucursales() {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('id, name, city');

        if (error) throw error;

        if (data && data.length > 0) {
          setSucursales(data);
          setNuevaSucursalId(data[0].id);
        }
      } catch (err) {
        console.error('Error cargando sucursales:', err);
      }
    }
    obtenerSucursales();
  }, []);

  // 2. Cargar Reservas según Pestaña Selección
  const cargarReservas = async () => {
    setCargando(true);
    try {
      let query = supabase.from('reservations').select('*').order('reservation_date', { ascending: true });

      if (activeTabId !== 'TODAS') {
        query = query.eq('restaurant_id', activeTabId);
      }

      const { data: dataReservas, error: errorRes } = await query;

      if (errorRes) throw errorRes;

      if (!dataReservas || dataReservas.length === 0) {
        setReservas([]);
        setCargando(false);
        return;
      }

      const resIds = dataReservas.map((r) => r.id);

      const { data: dataPreorders } = await supabase
        .from('preorders')
        .select('*')
        .in('reservation_id', resIds);

      const reservasCompletas: ReservaDetalle[] = dataReservas.map((res) => ({
        ...res,
        preorders: (dataPreorders || []).filter((p) => p.reservation_id === res.id),
      }));

      setReservas(reservasCompletas);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, [activeTabId]);

  // Cambiar estado en vivo para la demo
  const cambiarEstadoReserva = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: nuevoEstado })
        .eq('id', id);

      if (error) throw error;

      setReservas((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: nuevoEstado } : r))
      );
    } catch (err) {
      alert('Error al actualizar estado');
    }
  };

  // Crear Reserva Demo en Vivo
  const crearReservaDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevaSucursalId) return;

    try {
      const hoy = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            restaurant_id: nuevaSucursalId,
            organizer_name: nuevoNombre,
            organizer_phone: nuevoPhone || '+541100000000',
            guest_count: nuevoPax,
            reservation_date: hoy,
            reservation_time: '21:30',
            status: 'confirmed',
          },
        ])
        .select();

      if (error) throw error;

      alert('✨ ¡Reserva creada con éxito para la demostración!');
      setModalAbierto(false);
      setNuevoNombre('');
      cargarReservas();
    } catch (err) {
      console.error('Error al crear reserva demo:', err);
    }
  };

  // Filtrado
  const reservasFiltradas = reservas.filter((r) => {
    if (filtroEstado === 'TODOS') return true;
    return r.status === filtroEstado;
  });

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

  const totalPax = reservasFiltradas.reduce((acc, r) => acc + (r.guest_count || 0), 0);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh', paddingBottom: '4rem' }}>
      
      {/* HEADER PRINCIPAL TIPO LANDING DEMO */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '2rem 1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ backgroundColor: '#22c55e', color: '#fff', fontSize: '0.75rem', fontWeight: '800', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                DEMO EN VIVO
              </span>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Plataforma Multi-Dirección</span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.4rem 0 0 0' }}>
              Tablero de Control de Reservas & Comandas
            </h1>
          </div>

          {/* Botón Acción Principal Demo */}
          <button
            onClick={() => setModalAbierto(true)}
            style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1.4rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' }}
          >
            ➕ Simular Nueva Reserva en Vivo
          </button>
        </div>
      </header>

      {/* BARRA DE BOTONES Y NAVEGACIÓN MULTI-SUCURSAL */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', stickyTop: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.8rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Pestañas de Sucursales */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
            <button
              onClick={() => setActiveTabId('TODAS')}
              style={{
                padding: '0.6rem 1.1rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
                backgroundColor: activeTabId === 'TODAS' ? '#0f172a' : '#f1f5f9',
                color: activeTabId === 'TODAS' ? '#ffffff' : '#475569'
              }}
            >
              🏢 Todas las Direcciones ({sucursales.length})
            </button>

            {sucursales.map((suc, idx) => (
              <button
                key={suc.id}
                onClick={() => setActiveTabId(suc.id)}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  backgroundColor: activeTabId === suc.id ? '#2563eb' : '#f1f5f9',
                  color: activeTabId === suc.id ? '#ffffff' : '#475569',
                  whiteSpace: 'nowrap'
                }}
              >
                📍 Local {idx + 1}: {suc.city || suc.name}
              </button>
            ))}
          </div>

          {/* Filtro por Estado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>FILTRAR:</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', backgroundColor: '#f8fafc' }}
            >
              <option value="TODOS">Todas las Reservas</option>
              <option value="confirmed">Solo Confirmadas</option>
              <option value="pending">Solo Pendientes</option>
            </select>
          </div>

        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        
        {/* PANEL METRICAS RESUMEN */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Reservas Visibles</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>{reservasFiltradas.length}</div>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Comensales Esperados</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2563eb', marginTop: '0.2rem' }}>{totalPax} Personas</div>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Estado del Sistema</span>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#16a34a', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span> Sincronizado en Vivo
            </div>
          </div>
        </div>

        {/* LISTA DE RESERVAS / TARJETAS INTERACTIVAS */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b', fontSize: '1.1rem' }}>
            ⏳ Actualizando comandas y direcciones...
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            No hay reservas registradas para esta selección.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {reservasFiltradas.map((res) => {
              const miSucursal = sucursales.find((s) => s.id === res.restaurant_id);
              const comensalesMap = agruparPedidosPorComensal(res.preorders);
              const nombresComensales = Object.keys(comensalesMap);

              return (
                <div
                  key={res.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* HEADER TARJETA CON UBICACIÓN */}
                  <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700' }}>
                        📍 {miSucursal?.city || miSucursal?.name || 'Sucursal'}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '0.1rem' }}>
                        📅 {res.reservation_date} — ⏰ {res.reservation_time || '20:00'} hs
                      </div>
                    </div>

                    {/* Selector interactivo de estado */}
                    <button
                      onClick={() => cambiarEstadoReserva(res.id, res.status === 'confirmed' ? 'pending' : 'confirmed')}
                      title="Haz clic para cambiar el estado en vivo"
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: res.status === 'confirmed' ? '#16a34a' : '#d97706',
                        color: '#fff',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: '800',
                        cursor: 'pointer'
                      }}
                    >
                      {res.status === 'confirmed' ? '✓ CONFIRMADA' : '⏳ PENDIENTE'}
                    </button>
                  </div>

                  {/* RESPONSABLE Y ACCIONES DIRECTAS */}
                  <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Cliente / Titular</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>👤 {res.organizer_name}</div>

                    {/* BOTONES DE ACCIÓN DIRECTA */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <a
                        href={`https://wa.me/${res.organizer_phone?.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(res.organizer_name)},%20te%20contactamos%20de%20nuestro%20restaurante.`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.3rem',
                          backgroundColor: '#25d366',
                          color: '#fff',
                          padding: '0.45rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          textDecoration: 'none'
                        }}
                      >
                        💬 WhatsApp
                      </a>

                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(miSucursal?.name || 'Restaurante')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#e2e8f0',
                          color: '#334155',
                          padding: '0.45rem 0.8rem',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          textDecoration: 'none'
                        }}
                      >
                        🗺️ Ver Mapa
                      </a>
                    </div>
                  </div>

                  {/* DESGLOSE COMANDAS */}
                  <div style={{ padding: '1rem', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      🍽️ Comandas por Comensal
                    </div>

                    {nombresComensales.length === 0 ? (
                      <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.85rem' }}>Aún no se asignaron platos...</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {nombresComensales.map((nombre, cIdx) => (
                          <div key={cIdx} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: '#f1f5f9', borderLeft: '3px solid #2563eb' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                              Comensal {cIdx + 1}: {nombre}
                            </div>
                            <ul style={{ margin: '0.2rem 0 0 0', paddingLeft: '1.1rem', fontSize: '0.8rem', color: '#334155' }}>
                              {comensalesMap[nombre].map((ped, pIdx) => (
                                <li key={pIdx}>{ped}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FOOTER DETALLES */}
                  <div style={{ padding: '0.6rem 1rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569', display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                    <span>👥 {res.guest_count} Personas</span>
                    <span style={{ color: '#2563eb', cursor: 'pointer' }} onClick={() => alert(`ID Reserva: ${res.id}`)}>
                      🔍 Ver detalles
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL SIMULAR NUEVA RESERVA EN VIVO */}
      {modalAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '450px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: '0 0 1rem 0', color: '#0f172a' }}>
              ⚡ Crear Reserva para la Demo
            </h2>

            <form onSubmit={crearReservaDemo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Seleccionar Local:</label>
                <select
                  value={nuevaSucursalId}
                  onChange={(e) => setNuevaSucursalId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>📍 {s.city || s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Nombre Titular:</label>
                <input
                  type="text"
                  placeholder="Ej: Marcelo Gallardo"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Teléfono / WhatsApp:</label>
                <input
                  type="text"
                  placeholder="+54 11 1234 5678"
                  value={nuevoPhone}
                  onChange={(e) => setNuevoPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.3rem' }}>Comensales (Pax):</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={nuevoPax}
                  onChange={(e) => setNuevoPax(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: '700', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}