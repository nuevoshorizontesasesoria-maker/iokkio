importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAjrsLfQTBkpnZRZPylYf5vc9LYZ03FieA",
  authDomain: "iokkio-push.firebaseapp.com",
  projectId: "iokkio-push",
  storageBucket: "iokkio-push.firebasestorage.app",
  messagingSenderId: "96284325636",
  appId: "1:96284325636:web:d9e16cf4f8ac2d3246c251"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Push recibido:', payload);
  const notificationTitle = payload.notification?.title || 'IOKKIO';
  const notificationBody = payload.notification?.body || 'Nueva notificación';
  const url = payload.data?.url || '/';
  self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    data: { url },
    requireInteraction: true,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
