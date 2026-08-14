import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { reservation_id, guest_name, guest_phone } = await request.json();

    if (!reservation_id) {
      return NextResponse.json({ error: 'Falta el reservation_id' }, { status: 400 });
    }

    // 1. Obtener detalles de la reserva y restaurante
    const { data: reservation, error: resError } = await supabase
      .from('reservations')
      .select('*, restaurants(name, phone, email)')
      .eq('id', reservation_id)
      .single();

    if (resError || !reservation) throw new Error('Reserva no encontrada.');

    // 2. Obtener los platillos que ACABA de pedir este comensal específico
    const { data: ultimosPedidos, error: preordersError } = await supabase
      .from('preorders')
      .select('quantity, menu_items(name, category)')
      .eq('reservation_id', reservation_id)
      .eq('guest_name', guest_name);

    if (preordersError) throw preordersError;

    // 3. Obtener el conteo total de personas que YA han pedido para esta reserva
    const { data: todosLosPedidos } = await supabase
      .from('preorders')
      .select('guest_name')
      .eq('reservation_id', reservation_id);

    // Contar comensales únicos que ya hicieron pedido
    const comensalesQuePidieron = new Set(todosLosPedidos?.map((p: any) => p.guest_name)).size;
    const totalComensales = reservation.guest_count || 1;

    // 4. Formatear la lista de selecciones de este comensal
    const desgloseEleccion = ultimosPedidos && ultimosPedidos.length > 0
      ? ultimosPedidos.map((p: any) => `  • ${p.menu_items?.name || 'Ítem'}`).join('\n')
      : '  • Sin consumición seleccionada';

    // 5. Crear el mensaje de notificación en tiempo real
    const mensajeNegocio = `
🔔 *NUEVA SELECCIÓN DE MENÚ RECIBIDA*
----------------------------------
🏢 *Restaurante:* ${reservation.restaurants?.name || 'Tu Restaurante'}
📅 *Reserva:* ${reservation.reservation_date || ''} a las ${reservation.reservation_time || ''}
👤 *Comensal:* ${guest_name} (${guest_phone || 'Sin teléfono'})
📊 *Progreso Grupo:* ${comensalesQuePidieron} de ${totalComensales} comensales confirmados

🍷 *ELECCIÓN DE ${guest_name.toUpperCase()}:*
${desgloseEleccion}
----------------------------------
    `.trim();

    console.log(`\n================ AVISO INSTANTÁNEO AL NEGOCIO ================`);
    console.log(mensajeNegocio);
    console.log(`==============================================================\n`);

    return NextResponse.json({
      success: true,
      mensaje: mensajeNegocio,
      progreso: `${comensalesQuePidieron}/${totalComensales}`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
