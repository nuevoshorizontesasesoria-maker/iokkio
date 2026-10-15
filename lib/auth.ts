import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from './supabase-server';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: 'iokkio_admin' | 'gerente' | 'encargado';
  restaurant_id: string | null;
  shift: 'morning' | 'afternoon' | 'evening' | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, restaurant_id, shift')
      .eq('id', authUser.id)
      .eq('active', true)
      .single();

    if (error || !userData) return null;

    return userData as CurrentUser;
  } catch (err: any) {
    console.error('[AUTH] Error:', err.message);
    return null;
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('No autenticado');
  }
  return user;
}