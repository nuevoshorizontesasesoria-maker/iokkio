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
  console.log('[AUTH] === Iniciando getCurrentUser ===');

  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    console.log('[AUTH] authUser:', authUser?.id || 'NULL', 'error:', authError?.message || 'ninguno');

    if (!authUser) {
      console.log('[AUTH] No hay authUser → devolviendo null');
      return null;
    }

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

    console.log('[AUTH] userData:', userData);
    console.log('[AUTH] error:', error);

    if (error || !userData) {
      console.log('[AUTH] No se encontró userData → devolviendo null');
      return null;
    }

    console.log('[AUTH] ¡Éxito! Devolviendo user:', userData.email, userData.role);
    return userData as CurrentUser;
  } catch (err: any) {
    console.log('[AUTH] EXCEPCIÓN:', err.message);
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
