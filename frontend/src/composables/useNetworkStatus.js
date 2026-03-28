import { ref, readonly } from 'vue'

const isOnline = ref(navigator.onLine)

window.addEventListener('online', () => {
  isOnline.value = true
})

window.addEventListener('offline', () => {
  isOnline.value = false
})

export function useNetworkStatus() {
  function setOnline(value) {
    isOnline.value = value
  }

  return {
    isOnline: readonly(isOnline),
    setOnline
  }
}

export function isNetworkOnline() {
  return isOnline.value
}
