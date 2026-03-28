import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([])

  const addNotification = (message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random()
    notifications.value.push({ id, message, type })
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }

  const removeNotification = (id) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const success = (message, duration = 4000) => {
    return addNotification(message, 'success', duration)
  }

  const error = (message, duration = 5000) => {
    return addNotification(message, 'error', duration)
  }

  const warning = (message, duration = 4500) => {
    return addNotification(message, 'warning', duration)
  }

  const info = (message, duration = 4000) => {
    return addNotification(message, 'info', duration)
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  }
})
