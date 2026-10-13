'use client';

import { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface Props {
  reservationId: string;
  role: 'organizer' | 'guest';
  guestId?: string;
  onSubscribed?: () => void;
}

export function PushPermissionButton({ reservationId, role, guestId, onSubscribed }: Props) {
  const [status, setStatus] = useState<
    'idle' | 'granted' | 'denied' | 'unsupported' | 'subscribing' | 'subscribed' | 'error'
  >('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'granted') setStatus('granted');
    if (Notification.permission === 'denied') setStatus('denied');
  }, []);

  async function subscribe() {
    try {
      setStatus('subscribing');

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Este dispositivo no soporta notificaciones push');
        setStatus('unsupported');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }

      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      const messaging = getMessaging(app);

      const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (!token) throw new Error('No se pudo obtener el token');

      const response = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_id: reservationId, role, guest_id: guestId, token }),
      });

      if (!response.ok) throw new Error('Error guardando token');

      setStatus('subscribed');
      onSubscribed?.();
    } catch (error: any) {
      console.error('Error suscribiendo push:', error);
      setStatus('error');
      alert(`Error: ${error.message}`);
    }
  }

  if (status === 'unsupported') {
    return <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Tu navegador no soporta notificaciones.</p>;
  }

  if (status === 'subscribed') {
    return <p style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.95rem' }}>✅ Notificaciones activadas</p>;
  }

  if (status === 'denied') {
    return (
      <p style={{ color: '#dc2626', fontSize: '0.85rem' }}>
        ⚠️ Bloqueaste las notificaciones. Activalas desde la configuración del navegador.
      </p>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === 'subscribing'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        backgroundColor: status === 'subscribing' ? '#94a3b8' : '#2563eb',
        color: '#fff',
        padding: '0.75rem 1.5rem',
        borderRadius: '10px',
        border: 'none',
        fontSize: '0.95rem',
        fontWeight: 700,
        cursor: status === 'subscribing' ? 'wait' : 'pointer',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
      }}
    >
      {status === 'subscribing' ? '⏳ Activando...' : '🔔 Activar notificaciones'}
    </button>
  );
}