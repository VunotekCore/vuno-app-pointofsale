import { useAuthStore } from '../stores/auth.store.js'

export const vPermission = {
  mounted(el, binding) {
    const authStore = useAuthStore()
    const permission = binding.value

    const checkPermission = () => {
      if (!authStore.hasPermission(permission)) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
      }
    }

    checkPermission()
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      const authStore = useAuthStore()
      if (!authStore.hasPermission(binding.value)) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
      }
    }
  }
}
