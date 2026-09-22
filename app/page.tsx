import Link from 'next/link'
import { supabase } from '@/lib/supabase'

// Definimos la interfaz para la sucursal para evitar el 'implicit any'
interface Sucursal {
  id: string;
  name: string;
  [key: string]: any;
}

export default async function HomePage() {
  // 1. Consultamos la base de datos para traer las sucursales
  const { data: sucursales, error } = await supabase.from('restaurants').select('*')

  if (error) {
    return (
      <main className='max-w-md mx-auto p-6 mt-10 text-center'>
        <p className='text-red-500'>Error al cargar las sucursales: {error.message}</p>
      </main>
    )
  }

  return (
    <main className='max-w-md mx-auto p-6 mt-10 border rounded-xl shadow-sm bg-white'>
      <h1 className='text-3xl font-bold mb-6 text-gray-800'>Elige una sucursal</h1>
      
      <div className='flex flex-col gap-4'>
        {/* 2. Mostramos cada sucursal con tipado explicito Sucursal */}
        {(sucursales as Sucursal[])?.map((sucursal: Sucursal) => (
          <Link 
            key={sucursal.id} 
            href={`/reservar?restaurant_id=${sucursal.id}`}
            className='block p-4 border rounded-lg hover:border-black hover:shadow-md transition-all cursor-pointer'
          >
            <h2 className='text-xl font-semibold text-gray-900'>{sucursal.name}</h2>
            <p className='text-gray-500 text-sm mt-1'>Haz clic aquí para reservar en esta ubicación</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
