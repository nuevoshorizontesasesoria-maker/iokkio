import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, name, role, restaurant_id, shift, password } = await request.json();

    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { error: 'Email, nombre, rol y password son requeridos' },
        { status: 400 }
      );
    }

    if (!['gerente', 'encargado'].includes(role)) {
      return NextResponse.json(
        { error: 'Rol inválido. Debe ser gerente o encargado' },
        { status: 400 }
      );
    }

    if (!restaurant_id) {
      return NextResponse.json(
        { error: 'El restaurante es requerido' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario en Auth');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        restaurant_id,
        shift: role === 'encargado' ? shift : null,
        active: true,
      })
      .select()
      .single();

    if (userError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw userError;
    }

    return NextResponse.json({
      success: true,
      usuario: userData,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
