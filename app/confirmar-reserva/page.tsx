'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ComensalContacto {
  nombre: string;
  telefono: string;
}

function ConfirmacionContenido() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || searchParams.get('token');

  const [reserva, setReserva] = useState<any>(null);
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
        const { data: resData, error: resError } = await supabase
          .from('reservations')
          .select('*, restaurants(name)')
          .eq('id', id)
          .single();

        if (resError || !resData) throw new Error('No se encontró la reserva.');
        setReserva(resData);

        const totalPersonas = resData.guest_count || 1;

        // Generamos la lista de comensales basada en guest_count
        const comensalesIniciales: ComensalContacto[] = Array.from({ length: totalPersonas }, (_, index) => {
          if (index === 0) {
            return {
              nombre: resData.organizer_name || '',
              telefono: resData.organizer_phone || '',
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

    // Validar que todos tengan nombre y número de teléfono
    for (let i = 0; i < comensales.length; i++) {
      const c = comensales[i];
      if (!c.nombre.trim()) {
        alert(`Por favor, ingresa el nombre de pila para el Comensal ${i + 1}.`);
        return;
      }
      if (!c.telefono.trim()) {
        alert(`Por favor, ingresa el WhatsApp/Móvil de ${c.nombre || `Comensal ${i + 1}`}.`);
        return;
      }
    }

    try {
      // 1. Confirmar estado de la reserva
      const { error: updateError } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (updateError) throw updateError;

      // 2. Guardar o actualizar la lista de invitados para el bot/proceso externo
      const invitadosAInsertar = comensales.map((c, index) => ({
        reservation_id: id,
        name: c.nombre.trim(),
        phone: c.telefono.trim(),
        is_organizer: index === 0,
      }));

      // Guardamos en la tabla 'guests' (o 'reservation_guests' según tu BD)
      const { error: guestsError } = await supabase
        .from('guests')
        .insert(invitadosAInsertar);

      if (guestsError) throw guestsError;

      setEstado('exito');
    } catch (err: any) {
      alert(`Hubo un error al procesar la confirmación: ${err.message}`);
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
          Hemos registrado los datos de los <strong>{comensales.length} asistentes</strong>. En breve les enviaremos un mensaje por WhatsApp a cada uno para que elijan sus opciones de menú.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '550px', margin: '3rem auto', padding: '2.5rem', fontFamily: 'sans-serif', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Confirmar Asistencia</h2>
      <p style={{ color: '#555', textAlign: 'center', marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.5' }}>
        Reserva en <strong>{reserva?.restaurants?.name}</strong> para <strong>{comensales.length} {comensales.length === 1 ? 'persona' : 'personas'}</strong>.<br />
        Ingresa el nombre y WhatsApp de cada comensal para enviarles su invitación individual.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {comensales.map((comensal, index) => (
          <div 
            key={index} 
            style={{ 
              padding: '1.25rem', 
              borderRadius: '8px', 
              border: '1px solid #e0e0e0', 
              backgroundColor: '#f9f9f9',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem'
            }}
          >
            <h3 style={{ margin: 0, color: '#2e7d32', fontSize: '1rem' }}>
              {index === 0 ? 'Tus Datos (Organizador/a)' : `Acompañante ${index + 1}`}
            </h3>

            <div style={{ display: 'flex', gap: '0.8rem', flexDirection: 'row' }}>
              {/* Nombre de pila */}
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

              {/* WhatsApp */}
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
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s',
            width: '100%',
            boxSizing: 'border-box',
            marginTop: '0.5rem'
          }}
        >
          Confirmar Reserva
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
