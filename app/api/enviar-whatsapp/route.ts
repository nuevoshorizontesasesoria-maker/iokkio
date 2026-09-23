import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ✅ FIX: fallback apunta a tu dominio real, no a hostingersite
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.iokkio.com';

// Definición de tipo para evitar 'implicit any' en TypeScript
interface Guest {
  id: string;
  name: string;
  phone?: string;
  reservation_id: string;
  is_organizer: boolean;
}

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

    // 3. Generar enlace, mensaje y deep link de WhatsApp por cada acompañante
    const envios = (guests as Guest[]).map(async (guest: Guest) => {
      const inviteUrl = `${BASE_URL}/eleccion-menu?reservation_id=${reservation_id}&guest_id=${guest.id}`;
      const mensaje = `¡Hola ${guest.name}! 👋\n\nHas sido invitado/a a una reserva en *${restaurantName}*.\nPor favor, ingresa al siguiente enlace para elegir tu bebida y entrada:\n\n👉 ${inviteUrl}`;

      // ✅ FIX: Deep link a WhatsApp (wa.me) sin API paga
      // Limpiamos el teléfono: solo dígitos (sin +, espacios, guiones)
      const phoneClean = (guest.phone || '').replace(/\D/g, '');
      const whatsappDeepLink = phoneClean
        ? `https://wa.me/${phoneClean}?text=${encodeURIComponent(mensaje)}`
        : null;

      // Log para debug en el servidor
      console.log(
        `[WhatsApp MOCK para ${guest.phone || 'sin teléfono'}]:\n${mensaje}\n`
      );

      return {
        guest_id: guest.id,
        guest_name: guest.name,
        phone: guest.phone,
        invite_url: inviteUrl,             // ← abrir vos en la demo
        whatsapp_deep_link: whatsappDeepLink, // ← abrir WhatsApp con mensaje listo
        status: whatsappDeepLink ? 'link_ready' : 'no_phone',
      };
    });

    const resultados = await Promise.all(envios);

    return NextResponse.json({
      success: true,
      total: resultados.length,
      resultados,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}