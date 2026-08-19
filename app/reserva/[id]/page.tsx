import { supabase } from "@/lib/supabase"; 
import { notFound } from "next/navigation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export default async function DetalleReservaPage({ params }: RouteParams) {
  // 1. Obtenemos el 'id' de la URL
  const { id } = await params;

  // 2. Apuntamos a 'reservations', que es la tabla real donde guarda el formulario
  const { data: reserva, error } = await supabase
    .from("reservations") 
    .select("*")
    .eq("id", id)
    .single();

  // 3. Si no existe en Supabase, dará 404 de forma controlada
  if (error || !reserva) {
    notFound();
  }

  // 4. Pintamos los datos mapeando las columnas correctas
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Detalle de la Reserva
      </h1>
      
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">ID de Reserva:</span> {reserva.id}
        </p>
        
        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">Cliente:</span> {reserva.organizer_name || "No especificado"}
        </p>

        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">WhatsApp:</span> {reserva.organizer_phone || "No especificado"}
        </p>

        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">Fecha de Llegada:</span> {reserva.reservation_date} a las {reserva.reservation_time}
        </p>

        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">Acompañantes:</span> {reserva.guest_count} personas
        </p>

        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">Estado:</span> 
          <span className="ml-2 px-2 py-1 text-sm bg-green-100 text-green-800 rounded-full">
            {reserva.status || "Confirmada"}
          </span>
        </p>
      </div>
    </div>
  );
}
// app/reserva/[id]/page.tsx

// Esta función le dice a Next.js qué páginas pre-renderizar
export async function generateStaticParams() {
  // Puedes retornar un array de ejemplo con IDs hipotéticos o conocidos
  return [
    { id: '1' },
    { id: '2' },
    { id: 'demo' },
  ];
}

export default function ReservaPage({ params }: { params: { id: string } }) {
  // Tu código actual del componente...
}