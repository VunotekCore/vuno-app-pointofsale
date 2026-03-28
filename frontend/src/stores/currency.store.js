import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api.service.js'

export const useCurrencyStore = defineStore('currency', () => {
  const currency_code = ref('CLP')
  const currency_symbol = ref('$')
  const decimal_places = ref(0)
  const loading = ref(false)
  const initialized = ref(false)

  const CURRENCIES = [
    // Suramérica
    { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
    { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
    { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
    { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
    { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
    { code: 'UYU', name: 'Peso Uruguayo', symbol: '$U' },
    { code: 'PYG', name: 'Guaraní Paraguayo', symbol: '₲' },
    { code: 'GYD', name: 'Dólar Guyanés', symbol: 'G$' },
    { code: 'SRD', name: 'Dólar Surinamés', symbol: '$' },
    // Centroamérica y Caribe
    { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
    { code: 'GTQ', name: 'Quetzal Guatemalteco', symbol: 'Q' },
    { code: 'SVC', name: 'Colón Salvadoreño', symbol: '₡' },
    { code: 'HNL', name: 'Lempira Hondureña', symbol: 'L' },
    { code: 'NIO', name: 'Córdoba Nicaragüense', symbol: 'C$' },
    { code: 'CRC', name: 'Colón Costarricense', symbol: '₡' },
    { code: 'PAB', name: 'Balboa Panameño', symbol: 'B/.' },
    { code: 'DOP', name: 'Peso Dominicano', symbol: 'RD$' },
    { code: 'HTG', name: 'Gourde Haitiano', symbol: 'G' },
    { code: 'CUP', name: 'Peso Cubano', symbol: '₱' },
    // Norteamérica y Caribe
    { code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$' },
    { code: 'BZD', name: 'Dólar Beliceño', symbol: 'BZ$' },
    { code: 'JMD', name: 'Dólar Jamaicano', symbol: 'J$' },
    { code: 'TTD', name: 'Dólar Trinidadino', symbol: 'TT$' },
    { code: 'BBD', name: 'Dólar Barbadense', symbol: 'Bds$' },
    { code: 'BSD', name: 'Dólar Bahameño', symbol: 'B$' }
  ]

  const DECIMAL_OPTIONS = [
    { value: 0, label: 'Sin decimales (0)' },
    { value: 1, label: '1 decimal' },
    { value: 2, label: '2 decimales' }
  ]

  const currencyName = computed(() => {
    const curr = CURRENCIES.find(c => c.code === currency_code.value)
    return curr?.name || 'Peso'
  })

  async function loadConfig() {
    if (initialized.value) return
    
    loading.value = true
    try {
      const response = await api.get('/companies')
      if (response.data.data) {
        currency_code.value = response.data.data.currency_code || 'CLP'
        currency_symbol.value = response.data.data.currency_symbol || '$'
        decimal_places.value = response.data.data.decimal_places ?? 0
        initialized.value = true
      }
    } catch (error) {
      console.error('Error loading currency config:', error)
    } finally {
      loading.value = false
    }
  }

  function setCurrency(code, symbol, decimals) {
    currency_code.value = code
    currency_symbol.value = symbol
    decimal_places.value = decimals
  }

  function formatMoney(value) {
    const num = parseFloat(value) || 0
    const decimals = decimal_places.value
    const symbol = currency_symbol.value
    
    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    
    return `${symbol}${formatted}`
  }

  function formatNumber(value) {
    const num = parseFloat(value) || 0
    const decimals = decimal_places.value ?? 2
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  function roundMoney(value) {
    const multiplier = Math.pow(10, decimal_places.value)
    return Math.round((parseFloat(value) || 0) * multiplier) / multiplier
  }

  function getCurrencySymbol() {
    return currency_symbol.value
  }

  return {
    currency_code,
    currency_symbol,
    decimal_places,
    loading,
    CURRENCIES,
    DECIMAL_OPTIONS,
    currencyName,
    loadConfig,
    setCurrency,
    formatMoney,
    formatNumber,
    roundMoney,
    getCurrencySymbol
  }
})
