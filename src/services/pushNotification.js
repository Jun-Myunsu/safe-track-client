// 웹 푸시 알림 서비스
class PushNotificationService {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator
    this.permission = this.isSupported ? Notification.permission : 'denied'
  }

  // 알림 권한 요청
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('이 브라우저는 푸시 알림을 지원하지 않습니다')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission
      return permission === 'granted'
    } catch (error) {
      console.error('알림 권한 요청 실패:', error)
      return false
    }
  }

  // 알림 표시
  showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('알림을 표시할 수 없습니다')
      return null
    }

    const defaultOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      ...options
    }

    try {
      return new Notification(title, defaultOptions)
    } catch (error) {
      console.error('알림 표시 실패:', error)
      return null
    }
  }

  // 위치 공유 요청 알림
  showLocationShareRequest(fromUser) {
    return this.showNotification(
      '🔔 위치 공유 요청',
      {
        body: `${fromUser}님이 위치 공유를 요청했습니다`,
        tag: 'location-share-request'
      }
    )
  }

  // 위치 공유 수락 알림
  showLocationShareAccepted(targetUser) {
    return this.showNotification(
      '✅ 위치 공유 수락',
      {
        body: `${targetUser}님이 위치 공유를 수락했습니다`,
        tag: 'location-share-accepted'
      }
    )
  }

  // 새 메시지 알림
  showNewMessage(fromUser, message) {
    return this.showNotification(
      `💬 ${fromUser}`,
      {
        body: message,
        tag: 'new-message'
      }
    )
  }

  // 친구 추가 알림
  showFriendAdded(friendName) {
    return this.showNotification(
      '👥 새 친구',
      {
        body: `${friendName}님이 친구로 추가되었습니다`,
        tag: 'friend-added'
      }
    )
  }
}

export const pushNotificationService = new PushNotificationService()