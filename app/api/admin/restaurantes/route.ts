import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { client_id, name, city } = await request.json();

    if (!client_id || !name) {
      return NextResponse.json(
        { error: 'Cliente y nombre son requeridos' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('restaurants')
      .insert({ client_id, name, city, active: true })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, restaurante: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
