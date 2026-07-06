self.addEventListener('notificationclick', (event) => {
  // Close the OS system notification banner
  event.notification.close();

  // Extract the target deep-link URL passed from your C# backend payload object
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 🚀 Strategy A: If the dashboard tab is already open in the background, focus it!
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // 🚀 Strategy B: If the app is completely closed, open a brand new window instance
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});