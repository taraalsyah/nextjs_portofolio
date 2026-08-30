// TaskTuntas Web Push Service Worker

self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'TaskTuntas Notification';
    const options = {
      body: data.message || '',
      icon: data.icon || '/favicon.png',
      badge: data.badge || '/favicon.png',
      data: {
        url: data.url || '/dashboard/notifications',
        notificationId: data.notificationId || null,
        taskId: data.taskId || null,
        projectId: data.projectId || null,
      },
      vibrate: [100, 50, 100],
      tag: data.notificationId ? `tasktuntas-notif-${data.notificationId}` : undefined,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[Service Worker] Push event processing error:', err);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If a tab with TaskTuntas origin is already open, navigate and focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});