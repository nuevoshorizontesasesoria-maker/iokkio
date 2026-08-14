'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ComensalData {
  nombre: string;
  telefono: string;
  bebidaSeleccionada: string;
  entradaSeleccionada: string;
}

function ConfirmacionContenido() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || searchParams.get('token');

  const [reserva, setReserva] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [comensales, setComensales] = useState<ComensalData[]>([]);
  const [estado, setEstado] = useState<string>('cargando');
  const [mensajeError, setMensajeError] = useState<string>('');

  useEffect(() => {
    if (!id) {
      setEstado('error');
      setMensajeError('Enlace de confirmación no válido.');
      return;
    }

    async function cargarDatos() {
      try {
        // 1. BÚSQUEDA DE LA RESERVA
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select('*, restaurants(name)')
          .eq('id', id)
          .single();

        if (resError || !resData) throw new Error('No se encontró la reserva.');
        setReserva(resData);

        // 2. LECTURA DEL NÚMERO DE COMENSALES (guest_count)
        const totalPersonas = resData.guest_count || 1;

        // Generar lista de formularios inicializando el primero con los datos del organizador si existen
        const comensalesIniciales: ComensalData[] = Array.from({ length: totalPersonas }, (_, index) => {
          if (index === 0) {
            return {
              nombre: resData.organizer_name || '',
              telefono: resData.organizer_phone || '',
              bebidaSeleccionada: '',
              entradaSeleccionada: '',
            };
          }
          return {
            nombre: '',
            telefono: '',
            bebidaSeleccionada: '',
            entradaSeleccionada: '',
          };
        });

        setComensales(comensalesIniciales);

        // Cargar carta de menú del restaurante
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', resData.restaurant_id);

        if (menuError) throw new Error('Error al cargar la carta del restaurante.');
        setMenuItems(menuData || []);

        setEstado('pendiente_eleccion');
      } catch (err: any) {
        setEstado('error');
        setMensajeError(err.message);
      }
    }

    cargarDatos();
  }, [id]);

  // Manejador para actualizar el estado de cada comensal individual
  const handleComensalChange = (index: number, field: keyof ComensalData, value: string) => {
    setComensales((prev) => {
      const actualizados = [...prev];
      actualizados[index] = { ...actualizados[index], [field]: value };
      return actualizados;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 3. VALIDACIÓN COMPLETA DE CAMPOS
    for (let i = 0; i < comensales.length; i++) {
      const c = comensales[i];
      if (!c.nombre.trim()) {
        alert(`Por favor, ingresa el nombre para el Comensal ${i + 1}.`);
        return;
      }
      if (!c.telefono.trim()) {
        alert(`Por favor, ingresa el teléfono/WhatsApp para el Comensal ${i + 1} (${c.nombre}).`);
        return;
      }
      if (!c.bebidaSeleccionada || !c.entradaSeleccionada) {
        alert(`Por favor, selecciona bebida y entrada para el Comensal ${i + 1} (${c.nombre}).`);
        return;
      }
    }

    try {
      // 4. CONFIRMACIÓN DE LA RESERVA EN SUPABASE
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (updateError) throw updateError;

      // 5. REGISTRO DE MENÚS Y DATOS DE CADA COMENSAL
      const ordenesAInsertar: any[] = [];

      comensales.forEach((c) => {
        // Bebida del comensal
        ordenesAInsertar.push({
          reservation_id: id,
          menu_item_id: c.bebidaSeleccionada,
          guest_name: c.nombre.trim(),
          guest_phone: c.telefono.trim(),
          quantity: 1,
        });

        // Entrada del comensal
        ordenesAInsertar.push({
          reservation_id: id,
          menu_item_id: c.entradaSeleccionada,
          guest_name: c.nombre.trim(),
          guest_phone: c.telefono.trim(),
          quantity: 1,
        });
      });

      const { error: preorderError } = await supabase
        .from('preorders')
        .insert(ordenesAInsertar);

      if (preorderError) throw preorderError;

      setEstado('exito');
    } catch (err: any) {
      alert(`Hubo un error al procesar la solicitud: ${err.message}`);
    }
  };

  if (estado === 'cargando') {
    return <div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando datos de la reserva...</div>;
  }

  if (estado === 'error') {
    return (
      <main style={{ maxWidth: '500px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#d32f2f', marginBottom: '1rem' }}>Atención</h2>
        <p style={{ color: '#666' }}>{mensajeError}</p>
      </main>
    );
  }

  if (estado === 'exito') {
    return (
      <main style={{ maxWidth: '500px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#2e7d32', marginBottom: '1rem' }}>¡Reserva Confirmada!</h2>
        <p style={{ color: '#444', lineHeight: '1.6' }}>
          Se ha registrado la asistencia y menú de los <strong>{comensales.length} comensales</strong>. ¡Nos vemos pronto en <strong>{reserva?.restaurants?.name}</strong>!
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '600px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Confirmar Asistencia</h2>
      <p style={{ color: '#555', textAlign: 'center', marginBottom: '2rem', fontSize: '1.05rem' }}>
        Reserva en <strong>{reserva?.restaurants?.name}</strong> para <strong>{comensales.length} {comensales.length === 1 ? 'persona' : 'personas'}</strong>. Ingresa los datos de cada comensal:
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {comensales.map((comensal, index) => (
          <div 
            key={index} 
            style={{ 
              padding: '1.5rem', 
              borderRadius: '8px', 
              border: '1px solid #e0e0e0', 
              backgroundColor: '#f9f9f9',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <h3 style={{ margin: 0, color: '#2e7d32', fontSize: '1.1rem' }}>
              Comensal {index + 1} {index === 0 ? '(Organizador/a)' : ''}
            </h3>

            {/* Nombre */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' }}>
                Nombre completo:
              </label>
              <input
                type="text"
                placeholder="Ej: María García"
                value={comensal.nombre}
                onChange={(e) => handleComensalChange(index, 'nombre', e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* Móvil / WhatsApp */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' }}>
                Móvil / WhatsApp:
              </label>
              <input
                type="tel"
                placeholder="Ej: +34612345678"
                value={comensal.telefono}
                onChange={(e) => handleComensalChange(index, 'telefono', e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* Elección Bebida */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' }}>
                Bebida:
              </label>
              <select
                value={comensal.bebidaSeleccionada}
                onChange={(e) => handleComensalChange(index, 'bebidaSeleccionada', e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="">-- Selecciona una bebida --</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.price ? `- $${item.price}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Elección Entrada */}
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333', fontSize: '0.9rem' }}>
                Entrada:
              </label>
              <select
                value={comensal.entradaSeleccionada}
                onChange={(e) => handleComensalChange(index, 'entradaSeleccionada', e.target.value)}
                required
                style={{ width: '100%', padding: '0.65rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem', background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="">-- Selecciona una entrada --</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} {item.price ? `- $${item.price}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        <button
          type="submit"
          style={{
            background: '#2e7d32',
            color: '#fff',
            padding: '0.9rem',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1.05rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          Confirmar Reserva y Menús
        </button>
      </form>
    </main>
  );
}

export default function ConfirmarReservaPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando...</div>}>
      <ConfirmacionContenido />
    </Suspense>
  );
}
