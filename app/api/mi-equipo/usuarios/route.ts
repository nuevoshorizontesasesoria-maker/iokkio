import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { email, name, shift, password } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, nombre y password son requeridos' },
        { status: 400 }
      );
    }

    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: currentUser } = await supabase
      .from('users')
      .select('id, role, restaurant_id')
      .eq('id', authUser.id)
      .single();

    if (!currentUser || currentUser.role !== 'gerente') {
      return NextResponse.json(
        { error: 'Solo los gerentes pueden crear usuarios' },
        { status: 403 }
      );
    }

    if (!currentUser.restaurant_id) {
      return NextResponse.json(
        { error: 'No tenés un restaurante asignado' },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: 'encargado',
        restaurant_id: currentUser.restaurant_id,
        shift: shift || 'evening',
        active: true,
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (userError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw userError;
    }

    return NextResponse.json({ success: true, usuario: userData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}