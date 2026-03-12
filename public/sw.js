self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
        url: data.url || '/'
      }
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
})

self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.')
  event.notification.close()
  event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
  )
})

self.addEventListener('fetch', function(event) {
  // Handle fetch events with proper error handling
  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Return the response if successful
        return response;
      })
      .catch(function(error) {
        // Log the error and return a basic response for failed requests
        console.log('Fetch failed for:', event.request.url, error);
        
        // For navigation requests, return a basic HTML response
        if (event.request.mode === 'navigate') {
          return new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
            {
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }
        
        // For other requests, return a network error
        return new Response('Network error', {
          status: 408,
          statusText: 'Request Timeout'
        });
      })
  );
});
