import { ref, onMounted, onUnmounted } from 'vue'

export function useNetwork() {
  const isOnline = ref(navigator.onLine)
  const wasOffline = ref(false)
  const connectionType = ref(getConnectionType())

  function getConnectionType() {
    const nav = navigator
    if (!nav.connection) return 'unknown'
    return nav.connection.effectiveType || 'unknown'
  }

  function handleOnline() {
    isOnline.value = true
    connectionType.value = getConnectionType()
  }

  function handleOffline() {
    isOnline.value = false
    wasOffline.value = true
    connectionType.value = getConnectionType()
  }

  function handleConnectionChange() {
    connectionType.value = getConnectionType()
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    if (navigator.connection) {
      navigator.connection.addEventListener('change', handleConnectionChange)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    
    if (navigator.connection) {
      navigator.connection.removeEventListener('change', handleConnectionChange)
    }
  })

  function resetWasOffline() {
    wasOffline.value = false
  }

  return {
    isOnline,
    wasOffline,
    connectionType,
    resetWasOffline
  }
}

export function useIdleCallback(callback, options = {}) {
  if ('IdleDetector' in window) {
    const controller = new IdleDetector()
    controller.addEventListener('idle', callback)
    controller.start(options)
    return () => controller.stop()
  }
  
  const timeout = setTimeout(callback, options.timeout || 30000)
  return () => clearTimeout(timeout)
}
