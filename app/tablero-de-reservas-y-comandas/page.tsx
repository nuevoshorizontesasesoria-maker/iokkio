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
}

export default function DemoTotalmenteFuncionalPage() {
  const [sucursales, setSucursales] = useState<SucursalRestaurante[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('TODAS');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [reservas, setReservas] = useState<ReservaDetalle[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Modales interactivos
  const [modalReservaAbierto, setModalReservaAbierto] = useState<boolean>(false);
  const [modalComandaAbierto, setModalComandaAbierto] = useState<boolean>(false);
  
  // Datos Modal Reserva
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevoPhone, setNuevoPhone] = useState<string>('');
  const [nuevoPax, setNuevoPax] = useState<number>(2);
  const [nuevaSucursalId, setNuevaSucursalId] = useState<string>('');

  // Datos Modal Comanda
  const [reservaSeleccionadaId, setReservaSeleccionadaId] = useState<string>('');
  const [nuevoComensalNombre, setNuevoComensalNombre] = useState<string>('');
  const [nuevoPlatoNombre, setNuevoPlatoNombre] = useState<string>('');

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

  // 2. Cargar Reservas y Comandas
  const cargarDatos = async () => {
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
    cargarDatos();
  }, [activeTabId]);

  // Cambiar estado en vivo
  const cambiarEstadoReserva = async (id: string, estadoActual: string) => {
    const estados = ['confirmed', 'pending', 'completed', 'cancelled'];
    const siguienteIndex = (estados.indexOf(estadoActual) + 1) % estados.length;
    const nuevoEstado = estados[siguienteIndex];

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
      alert('Error cambiando estado');
    }
  };

  // Crear Reserva Demo
  const crearReservaDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevaSucursalId) return;

    try {
      const hoy = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('reservations').insert([
        {
          restaurant_id: nuevaSucursalId,
          organizer_name: nuevoNombre,
          organizer_phone: nuevoPhone || '+541199998888',
          guest_count: nuevoPax,
          reservation_date: hoy,
          reservation_time: '21:00',
          status: 'confirmed',
        },
      ]);

      if (error) throw error;

      alert('✨ ¡Reserva agregada en tiempo real!');
      setModalReservaAbierto(false);
      setNuevoNombre('');
      cargarDatos();
    } catch (err) {
      console.error('Error agregando reserva:', err);
    }
  };

  // Agregar Comanda Demo
  const agregarComandaDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaSeleccionadaId || !nuevoComensalNombre || !nuevoPlatoNombre) return;

    try {
      const { error } = await supabase.from('preorders').insert([
        {
          reservation_id: reservaSeleccionadaId,
          guest_name: nuevoComensalNombre,
          item_name: nuevoPlatoNombre,
        },
      ]);

      if (error) throw error;

      alert('🍽️ ¡Comanda agregada con éxito!');
      setModalComandaAbierto(false);
      setNuevoComensalNombre('');
      setNuevoPlatoNombre('');
      cargarDatos();
    } catch (err) {
      console.error('Error agregando comanda:', err);
    }
  };

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
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* HEADER PRINCIPAL CON LOGO DE BOCAPP */}
      <header style={{ backgroundColor: '#0f172a', color: '#fff', padding: '1.2rem 1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* LOGO + TITULO */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img 
              src="/logo.png" 
              alt="BocAPP Logo" 
              style={{ width: '55px', height: '55px', borderRadius: '12px', backgroundColor: '#ffffff', padding: '4px', objectFit: 'contain' }} 
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0, color: '#ffffff' }}>
                  Boc<span style={{ color: '#f97316' }}>APP</span>
                </h1>
                <span style={{ backgroundColor: '#38bdf8', color: '#0f172a', fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '12px' }}>
                  DEMO EN VIVO
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
                Gestión Integral de Reservas & Comandas Multi-Sucursal
              </p>
            </div>
          </div>

          {/* ACCIONES DEL HEADER */}
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setModalReservaAbierto(true)}
              style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '0.65rem 1.1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' }}
            >
              ➕ Probar Nueva Reserva
            </button>
            <button
              onClick={() => cargarDatos()}
              style={{ backgroundColor: '#334155', color: '#fff', border: 'none', padding: '0.65rem 1.1rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer' }}
            >
              🔄 Recargar Tablero
            </button>
          </div>

        </div>
      </header>

      {/* BARRA DE NAVEGACIÓN Y FILTROS */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.8rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          
          {/* Pestañas Sucursales */}
          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto' }}>
            <button
              onClick={() => setActiveTabId('TODAS')}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '0.85rem',
                cursor: 'pointer',
                backgroundColor: activeTabId === 'TODAS' ? '#0f172a' : '#f1f5f9',
                color: activeTabId === 'TODAS' ? '#ffffff' : '#475569'
              }}
            >
              🏢 Todas ({sucursales.length})
            </button>

            {sucursales.map((suc, idx) => (
              <button
                key={suc.id}
                onClick={() => setActiveTabId(suc.id)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.85rem',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>Filtrar:</span>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              style={{ padding: '0.45rem 0.7rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: '600', backgroundColor: '#f8fafc' }}
            >
              <option value="TODOS">Todos los estados</option>
              <option value="confirmed">Confirmadas</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

        </div>
      </div>

      {/* MÉTRICAS EN TIEMPO REAL */}
      <main style={{ maxWidth: '1200px', margin: '2rem auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Reservas Visibles</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem' }}>{reservasFiltradas.length}</div>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Comensales Esperados</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2563eb', marginTop: '0.2rem' }}>{totalPax} pers.</div>
          </div>

          <div style={{ backgroundColor: '#fff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>Locales Activos</span>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#16a34a', marginTop: '0.2rem' }}>{sucursales.length}</div>
          </div>
        </div>

        {/* LISTADO DE TARJETAS */}
        {cargando ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
            ⏳ Actualizando datos...
          </div>
        ) : reservasFiltradas.length === 0 ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            No hay reservas para los filtros seleccionados.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {reservasFiltradas.map((res) => {
              const miSucursal = sucursales.find((s) => s.id === res.restaurant_id);
              const comensalesMap = agruparPedidosPorComensal(res.preorders);
              const nombresComensales = Object.keys(comensalesMap);

              const colorEstado = 
                res.status === 'confirmed' ? '#16a34a' :
                res.status === 'pending' ? '#d97706' :
                res.status === 'completed' ? '#2563eb' : '#dc2626';

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
                  {/* HEADER TARJETA */}
                  <div style={{ backgroundColor: '#1e293b', color: '#fff', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700' }}>
                        📍 {miSucursal?.city || miSucursal?.name || 'Local'}
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '700', marginTop: '0.1rem' }}>
                        📅 {res.reservation_date} — ⏰ {res.reservation_time || '20:00'} hs
                      </div>
                    </div>

                    <button
                      onClick={() => cambiarEstadoReserva(res.id, res.status)}
                      title="Haz clic para alternar estado"
                      style={{
                        fontSize: '0.7rem',
                        backgroundColor: colorEstado,
                        color: '#fff',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: '800',
                        cursor: 'pointer',
                        textTransform: 'uppercase'
                      }}
                    >
                      {res.status} 🔄
                    </button>
                  </div>

                  {/* DATOS CLIENTE Y ACCIONES */}
                  <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>Titular Mesa</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>👤 {res.organizer_name}</div>

                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
                      <a
                        href={`https://wa.me/${res.organizer_phone?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#25d366',
                          color: '#fff',
                          padding: '0.4rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          textDecoration: 'none'
                        }}
                      >
                        💬 WhatsApp
                      </a>

                      <a
                        href={`tel:${res.organizer_phone}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#e2e8f0',
                          color: '#334155',
                          padding: '0.4rem 0.7rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          textDecoration: 'none'
                        }}
                      >
                        📞 Llamar
                      </a>
                    </div>
                  </div>

                  {/* COMANDAS */}
                  <div style={{ padding: '1rem', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase' }}>
                        🍽️ Comandas
                      </div>
                      <button
                        onClick={() => {
                          setReservaSeleccionadaId(res.id);
                          setModalComandaAbierto(true);
                        }}
                        style={{ fontSize: '0.7rem', backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        ➕ Agregar Plato
                      </button>
                    </div>

                    {nombresComensales.length === 0 ? (
                      <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '0.85rem' }}>Sin elecciones registradas...</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {nombresComensales.map((nombre, cIdx) => (
                          <div key={cIdx} style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: '#f1f5f9', borderLeft: '3px solid #2563eb' }}>
                            <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>
                              Comensal: {nombre}
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

                  {/* FOOTER TARJETA */}
                  <div style={{ padding: '0.6rem 1rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '0.8rem', color: '#475569', display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                    <span>👥 {res.guest_count} Personas</span>
                    <span style={{ color: '#2563eb' }}>ID: {res.id.substring(0, 6)}...</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL 1: NUEVA RESERVA */}
      {modalReservaAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 1rem 0' }}>➕ Simular Nueva Reserva</h2>
            <form onSubmit={crearReservaDemo} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.2rem' }}>Local / Dirección:</label>
                <select value={nuevaSucursalId} onChange={(e) => setNuevaSucursalId(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>📍 {s.city || s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.2rem' }}>Nombre Titular:</label>
                <input type="text" placeholder="Ej: Lionel Messi" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} required style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.2rem' }}>Teléfono / WhatsApp:</label>
                <input type="text" placeholder="+541199998888" value={nuevoPhone} onChange={(e) => setNuevoPhone(e.target.value)} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.2rem' }}>Comensales (Pax):</label>
                <input type="number" min="1" max="20" value={nuevoPax} onChange={(e) => setNuevoPax(Number(e.target.value))} style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                <button type="button" onClick={() => setModalReservaAbierto(false)} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AGREGAR COMANDA */}
      {modalComandaAbierto && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '2rem', maxWidth: '420px', width: '100%' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: '0 0 1rem 0' }}>🍽️ Agregar Platillo a Comanda</h2>
            <form onSubmit={agregarComandaDemo} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.2rem' }}>Nombre del Comensal:</label>
                <input type="text" placeholder="Ej: Maria Lopez" value={nuevoComensalNombre} onChange={(e) => setNuevoComensalNombre(e.target.value)} required style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.2rem' }}>Plato / Menú seleccionado:</label>
                <input type="text" placeholder="Ej: Bife de Chorizo con Papas" value={nuevoPlatoNombre} onChange={(e) => setNuevoPlatoNombre(e.target.value)} required style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                <button type="button" onClick={() => setModalComandaAbierto(false)} style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', fontWeight: '700', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: 'none', backgroundColor: '#16a34a', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>Guardar Plato</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}