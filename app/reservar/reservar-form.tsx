'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ReservarForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // 1. Capturamos los parámetros de la URL
  const searchParams = useSearchParams()
  const restaurantId = searchParams.get('restaurant_id')

  async function handleSubmit(formData: FormData) {
    // Validación de seguridad por si alguien entra directo sin elegir sucursal
    if (!restaurantId) {
      alert('Error: No se ha seleccionado ninguna sucursal.')
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        organizer_name: formData.get('name'),
        organizer_phone: formData.get('phone'),
        reservation_date: formData.get('date'),
        reservation_time: formData.get('time'),
        guest_count: Number(formData.get('guests')),
        restaurant_id: restaurantId // 👈 ¡Ahora es dinámico! Usa el ID que viene de la pantalla anterior
      })
      .select()
      .single()

    setLoading(false)

    if (error) {
      alert('Error al crear reserva: ' + error.message)
      return
    }

    // Redirige a la pantalla de éxito usando el ID de la reserva
    router.push(`/reserva-confirmada/${data.id}`)
  }

  return (
    <main className='max-w-md mx-auto p-6 mt-10 border rounded-xl shadow-sm bg-white'>
      <h1 className='text-3xl font-bold mb-6 text-gray-800'>Reservar mesa</h1>

      <form action={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Tu Nombre</label>
          <input name='name' placeholder='Ej. Juan Pérez' className='w-full border p-3 rounded-lg focus:ring-2 focus:ring-black outline-none' required />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>WhatsApp</label>
          <input name='phone' placeholder='Ej. +34600123456' className='w-full border p-3 rounded-lg focus:ring-2 focus:ring-black outline-none' required />
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Fecha</label>
            <input name='date' type='date' className='w-full border p-3 rounded-lg focus:ring-2 focus:ring-black outline-none' required />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>Hora</label>
            <input name='time' type='time' className='w-full border p-3 rounded-lg focus:ring-2 focus:ring-black outline-none' required />
          </div>
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>Acompañantes totales</label>
          <input name='guests' type='number' min='1' placeholder='¿Cuántos son en total?' className='w-full border p-3 rounded-lg focus:ring-2 focus:ring-black outline-none' required />
        </div>

        <button type='submit' disabled={loading} className='w-full bg-black text-white p-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition-colors'>
          {loading ? 'Procesando...' : 'Confirmar Reserva'}
        </button>
      </form>
    </main>
  )
}