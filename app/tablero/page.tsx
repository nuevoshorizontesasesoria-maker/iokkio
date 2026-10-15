import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function TableroPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'iokkio_admin') {
    redirect('/admin');
  }

  redirect('/tablero-de-reservas-y-comandas');
}
