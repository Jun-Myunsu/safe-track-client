export const saveAppState = {
  isTracking: (value) => localStorage.setItem('safetrack_isTracking', value),
  isSimulating: (value) => localStorage.setItem('safetrack_isSimulating', value),
  currentLocation: (value) => localStorage.setItem('safetrack_currentLocation', JSON.stringify(value)),
  sharedUsers: (value) => localStorage.setItem('safetrack_sharedUsers', JSON.stringify(value)),
  receivedShares: (value) => localStorage.setItem('safetrack_receivedShares', JSON.stringify(value)),
  chatMessages: (value) => localStorage.setItem('safetrack_chatMessages', JSON.stringify(value))
}

export const clearAppState = () => {
  localStorage.removeItem('safetrack_isTracking')
  localStorage.removeItem('safetrack_isSimulating')
  localStorage.removeItem('safetrack_currentLocation')
  localStorage.removeItem('safetrack_sharedUsers')
  localStorage.removeItem('safetrack_receivedShares')
  localStorage.removeItem('safetrack_chatMessages')
}