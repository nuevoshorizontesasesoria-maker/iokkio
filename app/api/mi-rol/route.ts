import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const { data: { user: authUser } } = await supabaseAuth.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ role: null });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: userData } = await supabase
      .from('users')
      .select('role, restaurant_id')
      .eq('id', authUser.id)
      .single();

    return NextResponse.json({
      role: userData?.role || null,
      restaurant_id: userData?.restaurant_id || null,
    });
  } catch (error: any) {
    return NextResponse.json({ role: null, error: error.message });
  }
}