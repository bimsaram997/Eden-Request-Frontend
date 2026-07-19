// ===================================================
// 📬 RECEIVE: Listen for incoming push notification signals
// ===================================================
self.addEventListener('push', (event) => {
  console.log('📬 RAW PUSH SIGNAL ARRIVED FROM BACKEND!');
  
  if (!event.data) {
    console.log('❌ Payload data is completely empty.');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📦 PARSED BACKEND DATA LAYOUT:', data);

    // Dynamic extraction helper to support both nested and flat payload shapes
    const payload = data.notification || data;
    const targetUrl = data.data?.url || data.url || '/';

    if (payload && payload.title) {
      event.waitUntil(
        self.registration.showNotification(payload.title, {
          body: payload.body || '',
          dir: payload.dir || 'ltr',
          lang: payload.lang || 'en',
          renotify: payload.renotify ?? true,
          tag: payload.tag || 'request-alert',
          data: { url: targetUrl }, // Pass target URL down into the click interaction storage context
          icon: '/assets/icons/icon-192x192.png', // Optional: Adjust path matching your asset bundle profile
          badge: '/assets/icons/icon-72x72.png'
        })
      );
    }
  } catch (err) {
    console.log('⚠️ Could not parse JSON data. Fallback to raw text:', event.data.text());
  }
});

// ===================================================
// 🖱️ INTERACT: Handle banner click routing behaviors smoothly
// ===================================================
self.addEventListener('notificationclick', (event) => {
  // 1. Dismiss the visual alert banner instantly
  event.notification.close();

  // 2. Safely extract the target routing URL we saved inside the data block
  const targetUrl = event.notification.data?.url || '/';
  
  // 3. Regex Match: Extract the numeric ID from routes like /workspace/requests-component/51 or parameter ?id=51
  const idMatch = targetUrl.match(/\/(\d+)$/) || targetUrl.match(/[?&]id=(\d+)/);
  const requestId = idMatch ? parseInt(idMatch[1], 10) : null;

  console.log('🎯 Clicking notification banner. Target URL:', targetUrl, 'ID:', requestId);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      
      // Strategy A: If your Angular app tab is ALREADY open, bring it to focus and redirect it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        
        if (client.url.includes(self.location.origin)) {
          if ('focus' in client) client.focus();
          
          // Force the active browser tab to navigate instantly to your details page route
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          
          // Send an internal window message bridge alert in case your Angular components are listening
          if (requestId) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              requestId: requestId
            });
          }
          return;
        }
      }
      
      // Strategy B: If the app tab was completely closed, open a brand new window instance
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});