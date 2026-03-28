<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api.service.js'
import { useNotificationStore } from '../../stores/notification.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { DollarSign, Save, Loader2 } from 'lucide-vue-next'

const notify = useNotificationStore()
const currencyStore = useCurrencyStore()

const currencyForm = ref({
  currency_code: 'CLP',
  currency_symbol: '$',
  decimal_places: 0
})
const currencyLoading = ref(false)
const currencySaving = ref(false)

const loadCurrencyConfig = async () => {
  try {
    currencyLoading.value = true
    const response = await api.get('/companies')
    if (response.data.data) {
      currencyForm.value = {
        currency_code: response.data.data.currency_code || 'CLP',
        currency_symbol: response.data.data.currency_symbol || '$',
        decimal_places: response.data.data.decimal_places ?? 0
      }
    }
  } catch (error) {
    console.error('Error loading currency config:', error)
  } finally {
    currencyLoading.value = false
  }
}

const saveCurrencyConfig = async () => {
  try {
    currencySaving.value = true
    await api.put('/companies', {
      currency_code: currencyForm.value.currency_code,
      currency_symbol: currencyForm.value.currency_symbol,
      decimal_places: currencyForm.value.decimal_places
    })
    currencyStore.setCurrency(
      currencyForm.value.currency_code,
      currencyForm.value.currency_symbol,
      currencyForm.value.decimal_places
    )
    notify.success('Configuración de moneda guardada')
  } catch (error) {
    notify.error(error.response?.data?.message || 'Error al guardar configuración')
  } finally {
    currencySaving.value = false
  }
}

const onCurrencyChange = () => {
  const selected = currencyStore.CURRENCIES.find(c => c.code === currencyForm.value.currency_code)
  if (selected) {
    currencyForm.value.currency_symbol = selected.symbol
  }
}

onMounted(loadCurrencyConfig)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Configuración de Moneda</h1>
      <p class="text-sm text-slate-500 mt-1">Define la moneda y decimales para precios</p>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
          <DollarSign class="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 class="font-semibold text-slate-900 dark:text-white">Configuración de Moneda</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">Define la moneda y decimales para precios</p>
        </div>
      </div>

      <div v-if="currencyLoading" class="text-center py-4 text-slate-500">Cargando...</div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Moneda
          </label>
          <select
            v-model="currencyForm.currency_code"
            @change="onCurrencyChange"
            class="input-field"
          >
            <option v-for="curr in currencyStore.CURRENCIES" :key="curr.code" :value="curr.code">
              {{ curr.code }} - {{ curr.name }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Símbolo
          </label>
          <input
            v-model="currencyForm.currency_symbol"
            type="text"
            class="input-field"
            placeholder="$"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Decimales
          </label>
          <select v-model.number="currencyForm.decimal_places" class="input-field">
            <option v-for="opt in currencyStore.DECIMAL_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
        <h4 class="font-medium text-slate-900 dark:text-white mb-3">Vista Previa</h4>
        <div class="flex items-center gap-4">
          <div class="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <span class="text-sm text-slate-500 dark:text-slate-400">Ejemplo:</span>
            <span class="ml-2 font-semibold text-slate-900 dark:text-white">
              {{ currencyStore.formatMoney(12345.67) }}
            </span>
          </div>
          <div class="text-sm text-slate-500 dark:text-slate-400">
            Con {{ currencyForm.decimal_places }} decimal(es)
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          @click="saveCurrencyConfig"
          :disabled="currencySaving"
          class="btn-primary flex items-center gap-2"
        >
          <Save v-if="!currencySaving" class="w-4 h-4" />
          <Loader2 v-else class="w-4 h-4 animate-spin" />
          {{ currencySaving ? 'Guardando...' : 'Guardar Configuración' }}
        </button>
      </div>
    </div>
  </div>
</template>
