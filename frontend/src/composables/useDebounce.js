import { ref } from 'vue'

export function useDebounce(fn, delay = 300) {
  const timeout = ref(null)

  function debounced(...args) {
    if (timeout.value) {
      clearTimeout(timeout.value)
    }
    timeout.value = setTimeout(() => {
      fn(...args)
    }, delay)
  }

  function cancel() {
    if (timeout.value) {
      clearTimeout(timeout.value)
      timeout.value = null
    }
  }

  return { debounced, cancel }
}

export function useDebouncedRef(initialValue = '', delay = 300) {
  const value = ref(initialValue)
  const debouncedValue = ref(initialValue)
  let timeout = null

  function update(newValue) {
    value.value = newValue
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      debouncedValue.value = newValue
    }, delay)
  }

  return { value, debouncedValue, update }
}
