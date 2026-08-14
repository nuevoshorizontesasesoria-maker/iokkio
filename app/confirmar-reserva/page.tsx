'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ComensalContacto {
  nombre: string;
  telefono: string;
  bebidaSeleccionada?: string;
  entradaSeleccionada?: string;
}

function ConfirmacionContenido({ searchParamsProps }: { searchParamsProps?: { id?: string; token?: string } }) {
  const searchParams = useSearchParams();

  // Lee el ID desde params o URL
  const id = searchParamsProps?.id || searchParamsProps?.token || searchParams?.get('id') || searchParams?.get('token');

  const [reserva, setReserva] = useState<any>(null);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [comensales, setComensales] = useState<ComensalContacto[]>([]);
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
        // 1. Obtener datos de la reserva
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select('*, restaurants(name)')
          .eq('id', id)
          .single();

        if (resError || !resData) throw new Error('No se encontró la reserva.');
        setReserva(resData);

        // 2. Cargar menú desde menu_items filtrando por restaurant_id
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', resData.restaurant_id);

        if (menuError) throw new Error('Error al cargar la carta.');
        setMenuItems(menuData || []);

        // 3. Crear lista de comensales según guest_count
        const totalPersonas = resData.guest_count || 1;

        const comensalesIniciales: ComensalContacto[] = Array.from({ length: totalPersonas }, (_, index) => {
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
          };
        });

        setComensales(comensalesIniciales);
        setEstado('pendiente');
      } catch (err: any) {
        setEstado('error');
        setMensajeError(err.message);
      }
    }

    cargarDatos();
  }, [id]);

  const handleComensalChange = (index: number, field: keyof ComensalContacto, value: string) => {
    setComensales((prev) => {
      const actualizados = [...prev];
      actualizados[index] = { ...actualizados[index], [field]: value };
      return actualizados;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar nombre y teléfono de todos
    for (let i = 0; i < comensales.length; i++) {
      const c = comensales[i];
      if (!c.nombre.trim()) {
        alert(`Por favor, ingresa el nombre para el Comensal ${i + 1}.`);
        return;
      }
      if (!c.telefono.trim()) {
        alert(`Por favor, ingresa el WhatsApp para ${c.nombre || `Comensal ${i + 1}`}.`);
        return;
      }
    }

    // Validar que el Comensal 1 seleccionó comida
    const organizador = comensales[0];
    if (!organizador.bebidaSeleccionada || !organizador.entradaSeleccionada) {
      alert('Por favor, selecciona una bebida y una entrada.');
      return;
    }

    try {
      // 1. Cambiar estado de la reserva
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Guardar lista de invitados en la tabla guests
      const invitadosAInsertar = comensales.map((c, index) => ({
        reservation_id: id,
        name: c.nombre.trim(),
        phone: c.telefono.trim(),
        is_organizer: index === 0,
      }));

      const { error: guestsError } = await supabase
        .from('guests')
        .insert(invitadosAInsertar);

      if (guestsError) throw guestsError;

      // 3. Guardar menú del organizador en preorders
      const { error: preorderError } = await supabase
        .from('preorders')
        .insert([
          {
            reservation_id: id,
            menu_item_id: organizador.bebidaSeleccionada,
            guest_name: organizador.nombre.trim() || 'Invitado',
            quantity: 1
          },
          {
            reservation_id: id,
            menu_item_id: organizador.entradaSeleccionada,
            guest_name: organizador.nombre.trim() || 'Invitado',
            quantity: 1
          }
        ]);

      if (preorderError) throw preorderError;

      setEstado('exito');
    } catch (err: any) {
      alert(`Hubo un error al procesar tu selección: ${err.message}`);
    }
  };

  if (estado === 'cargando') {
    return <div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando tu reserva y menú...</div>;
  }

  if (estado === 'error') {
    return (
      <main style={{ maxWidth: '450px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#d32f2f', marginBottom: '1rem' }}>Atención</h2>
        <p style={{ color: '#666' }}>{mensajeError}</p>
      </main>
    );
  }

  if (estado === 'exito') {
    return (
      <main style={{ maxWidth: '450px', margin: '6rem auto', padding: '2.5rem', textAlign: 'center', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ color: '#2e7d32', marginBottom: '1rem' }}>¡Todo Listo!</h2>
        <p style={{ color: '#444', lineHeight: '1.6' }}>
          Hemos confirmado tu asistencia, <strong>{comensales[0]?.nombre}</strong>, y guardado tus elecciones de menú. ¡Te esperamos en <strong>{reserva?.restaurants?.name}</strong>!
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '550px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Confirma tu Asistencia</h2>
      <p style={{ color: '#555', textAlign: 'center', marginBottom: '2rem', fontSize: '1.05rem' }}>
        Reserva en <strong>{reserva?.restaurants?.name}</strong> para <strong>{comensales.length} {comensales.length === 1 ? 'persona' : 'personas'}</strong>.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {comensales.map((comensal, index) => (
          <div 
            key={index} 
            style={{ 
              padding: '1.25rem', 
              borderRadius: '8px', 
              border: index === 0 ? '2px solid #2e7d32' : '1px solid #e0e0e0', 
              backgroundColor: index === 0 ? '#f0fdf4' : '#f9f9f9',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}
          >
            <h3 style={{ margin: 0, color: '#2e7d32', fontSize: '1rem' }}>
              {index === 0 ? 'Tus Datos y Tu Selección de Menú' : `Acompañante ${index + 1}`}
            </h3>

            {/* Nombre y WhatsApp */}
            <div style={{ display: 'flex', gap: '0.8rem', flexDirection: 'row' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333', fontSize: '0.85rem' }}>
                  Nombre de pila:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Laura"
                  value={comensal.nombre}
                  onChange={(e) => handleComensalChange(index, 'nombre', e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.3rem', color: '#333', fontSize: '0.85rem' }}>
                  Número de WhatsApp:
                </label>
                <input
                  type="tel"
                  placeholder="Ej: +34612345678"
                  value={comensal.telefono}
                  onChange={(e) => handleComensalChange(index, 'telefono', e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.9rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Opciones de Comida ÚNICAMENTE para el Comensal 1 (Organizador) */}
            {index === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem', borderTop: '1px dashed #ccc', paddingTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
                    Elige tu Bebida:
                  </label>
                  <select
                    value={comensal.bebidaSeleccionada || ''}
                    onChange={(e) => handleComensalChange(index, 'bebidaSeleccionada', e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="">-- Selecciona una bebida --</option>
                    {menuItems.map((item) => (
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
                    value={comensal.entradaSeleccionada || ''}
                    onChange={(e) => handleComensalChange(index, 'entradaSeleccionada', e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem', background: '#fff', boxSizing: 'border-box' }}
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
            )}
          </div>
        ))}

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
            transition: 'background 0.2s',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          Confirmar Asistencia y Menú
        </button>
      </form>
    </main>
  );
}

export default function ConfirmarReservaPage({ searchParams }: { searchParams?: { id?: string; token?: string } }) {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', marginTop: '6rem', fontFamily: 'sans-serif' }}>Cargando...</div>}>
      <ConfirmacionContenido searchParamsProps={searchParams} />
    </Suspense>
  );
}
