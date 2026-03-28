import { ref, onMounted, onUnmounted } from 'vue'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'

export function useFlatpickr(inputRef, options = {}) {
  const instance = ref(null)

  const defaultOptions = {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd/m/Y',
    locale: {
      firstDayOfWeek: 1,
      weekdays: {
        shorthand: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
        longhand: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      },
      months: {
        shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      }
    },
    ...options
  }

  onMounted(() => {
    if (inputRef.value) {
      instance.value = flatpickr(inputRef.value, defaultOptions)
    }
  })

  onUnmounted(() => {
    if (instance.value) {
      instance.value.destroy()
    }
  })

  function setDate(date) {
    if (instance.value) {
      instance.value.setDate(date)
    }
  }

  function clear() {
    if (instance.value) {
      instance.value.clear()
    }
  }

  return {
    instance,
    setDate,
    clear
  }
}
