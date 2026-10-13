import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminModule = await import('firebase-admin');
    const admin: any = adminModule.default || adminModule;

    if (!admin.apps || !admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          JSON.parse(process.env.FCM_SERVICE_ACCOUNT || '{}')
        ),
      });
    }

    const { reservation_id, reminder_number } = await request.json();

    if (!reservation_id) {
      return NextResponse.json({ error: 'Falta reservation_id' }, { status: 400 });
    }

    const { data: reserva, error: resError } = await supabase
      .from('reservations')
      .select('*, restaurants(name)')
      .eq('id', reservation_id)
      .single();

    if (resError || !reserva) throw new Error('Reserva no encontrada');

    const { data: tokenData, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('reservation_id', reservation_id)
      .eq('role', 'organizer')
      .single();

    if (tokenError || !tokenData?.token) {
      console.log(`[Push] No hay token para ${reservation_id}`);
      return NextResponse.json({
        success: false,
        message: 'No hay token registrado para el anfitrión',
      });
    }

    const esSegundo = reminder_number === 2;
    const titulo = esSegundo ? '⏰ ¡Último aviso!' : '🍽️ ¿Confirmás tu reserva?';
    const cuerpo = esSegundo
      ? `Tu reserva en ${reserva.restaurants?.name} es en 10 minutos. ¡Confirmá YA!`
      : `Tu mesa es a las ${reserva.reservation_time}. Confirmá para abrir la comanda.`;

    const response = await admin.messaging().send({
      token: tokenData.token,
      notification: { title: titulo, body: cuerpo },
      data: {
        reservation_id,
        url: `https://app.iokkio.com/confirmar-asistencia/${reservation_id}`,
        type: 'ask_organizer',
      },
    });

    console.log(`[Push] Enviado a ${reserva.organizer_name}:`, response);

    return NextResponse.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error('Error enviando push al anfitrión:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}