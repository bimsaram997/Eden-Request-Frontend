self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  
  // Safely extract the ID from the URL string (e.g., matching "id=51")
  const urlMatch = targetUrl.match(/[?&]id=(\d+)/);
  const requestId = urlMatch ? parseInt(urlMatch[1], 10) : null;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      
      // Strategy A: If the app tab is already open, focus it and broadcast a message
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          
          if (requestId) {
            // Send the ID straight to the running app instance
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              requestId: requestId
            });
          }
          return;
        }
      }
      
      // Strategy B: If the app is fully closed, open a fresh window instance
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});