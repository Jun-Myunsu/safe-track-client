// Service Worker for push notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치됨')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화됨')
  event.waitUntil(self.clients.claim())
})

self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭됨:', event.notification.tag)
  
  event.notification.close()
  
  // 앱 창 열기 또는 포커스
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // 이미 열린 창이 있으면 포커스
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // 새 창 열기
      if (self.clients.openWindow) {
        return self.clients.openWindow('/')
      }
    })
  )
})