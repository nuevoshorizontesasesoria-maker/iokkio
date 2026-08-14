import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://darkorange-manatee-747277.hostingersite.com';

export async function POST(request: Request) {
  try {
    const { reservation_id } = await request.json();

    if (!reservation_id) {
      return NextResponse.json({ error: 'Falta el reservation_id' }, { status: 400 });
    }

    // 1. Obtener acompañantes (excluyendo al organizador)
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select('*')
      .eq('reservation_id', reservation_id)
      .eq('is_organizer', false);

    if (guestsError) throw guestsError;

    if (!guests || guests.length === 0) {
      return NextResponse.json({ message: 'No hay acompañantes para notificar.' });
    }

    // 2. Obtener el nombre del restaurante
    const { data: reservation } = await supabase
      .from('reservations')
      .select('restaurants(name)')
      .eq('id', reservation_id)
      .single();

    const restaurantName = (reservation as any)?.restaurants?.name || 'el restaurante';

    // 3. Generar enlace y mensaje para cada acompañante
    const envios = guests.map(async (guest) => {
      const inviteUrl = `${BASE_URL}/eleccion-menu?reservation_id=${reservation_id}&guest_id=${guest.id}`;
      const mensaje = `¡Hola ${guest.name}! 👋\n\nHas sido invitado/a a una reserva en *${restaurantName}*.\nPor favor, ingresa al siguiente enlace para elegir tu bebida y entrada:\n\n👉 ${inviteUrl}`;

      // AQUÍ se conecta tu proveedor de API de WhatsApp (Twilio, Meta, Evolution, etc.)
      console.log(`[WhatsApp listo para ${guest.phone}]:\n${mensaje}`);

      return { guest_id: guest.id, phone: guest.phone, status: 'sent' };
    });

    const resultados = await Promise.all(envios);

    return NextResponse.json({ success: true, total: resultados.length, resultados });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
