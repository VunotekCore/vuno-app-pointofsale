<script setup>
import { onMounted, onUnmounted, computed } from 'vue'
import { useSocketStore } from '../../stores/socket.store.js'
import { useCurrencyStore } from '../../stores/currency.store.js'
import { Wifi, WifiOff, ShoppingCart, User, Tag, Minus, Plus } from 'lucide-vue-next'

const socketStore = useSocketStore()
const currencyStore = useCurrencyStore()

onMounted(() => {
  socketStore.connect()
})

onUnmounted(() => {
  socketStore.disconnect()
})

function formatMoney(amount) {
  return currencyStore.formatMoney(amount)
}

const connectionStatus = computed(() => socketStore.isConnected)

const customerName = computed(() => {
  if (socketStore.customer) {
    return `${socketStore.customer.first_name} ${socketStore.customer.last_name}`
  }
  return null
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
    <!-- Header -->
    <header class="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-8 py-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
          <ShoppingCart class="w-8 h-8 text-brand-400" />
          Punto de Venta<span v-if="customerName"> - {{ customerName }}</span>
        </h1>
        <div class="flex items-center gap-2 px-4 py-2 rounded-full"
          :class="connectionStatus ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'">
          <Wifi v-if="connectionStatus" class="w-5 h-5" />
          <WifiOff v-else class="w-5 h-5" />
          <span class="text-sm font-medium">{{ connectionStatus ? 'Conectado' : 'Desconectado' }}</span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex overflow-hidden">
      <!-- Products List -->
      <div class="flex-1 p-8 overflow-y-auto">
        <div v-if="socketStore.cartItems.length === 0" class="h-full flex items-center justify-center">
          <div class="text-center">
            <ShoppingCart class="w-24 h-24 text-slate-600 mx-auto mb-4" />
            <p class="text-2xl text-slate-500 font-medium">Esperando productos...</p>
            <p class="text-slate-600 mt-2">Agregue productos desde el POS</p>
          </div>
        </div>
        <div v-else class="space-y-4">
          <div v-for="(item, index) in socketStore.cartItems" :key="index"
            class="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center">
                <Tag class="w-8 h-8 text-slate-500" />
              </div>
              <div>
                <h3 class="text-xl font-semibold text-white">{{ item.item_name }}</h3>
                <p class="text-slate-400">{{ item.item_number }}</p>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-3 bg-slate-700/50 rounded-xl px-4 py-2">
                <span class="text-lg text-slate-300">{{ item.quantity }}</span>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-brand-400">{{ formatMoney(item.line_total) }}</p>
                <p v-if="item.discount_amount > 0" class="text-sm text-green-400">
                  Desc: -{{ formatMoney(item.discount_amount) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Sidebar -->
      <aside class="w-96 bg-slate-800/80 backdrop-blur-sm border-l border-slate-700/50 p-8 flex flex-col">
        <!-- Customer Info -->
        <div v-if="socketStore.customer" class="mb-8 p-4 bg-brand-500/20 rounded-2xl border border-brand-500/30">
          <div class="flex items-center gap-3 mb-2">
            <User class="w-6 h-6 text-brand-400" />
            <span class="text-brand-300 font-medium">Cliente</span>
          </div>
          <h3 class="text-xl font-bold text-white">
            {{ socketStore.customer.first_name }} {{ socketStore.customer.last_name }}
          </h3>
          <p class="text-brand-300/70 text-sm">{{ socketStore.customer.email }}</p>
        </div>
        <div v-else class="mb-8 p-4 bg-slate-700/30 rounded-2xl border border-slate-700/50">
          <div class="flex items-center gap-3">
            <User class="w-6 h-6 text-slate-500" />
            <span class="text-slate-500">Sin cliente</span>
          </div>
        </div>

        <!-- Totals -->
        <div class="flex-1 space-y-4">
          <div class="flex justify-between items-center py-3 border-b border-slate-700/50">
            <span class="text-slate-400 text-lg">Subtotal</span>
            <span class="text-white text-lg font-medium">{{ formatMoney(socketStore.subtotal) }}</span>
          </div>
          <div v-if="socketStore.discount > 0" class="flex justify-between items-center py-3 border-b border-slate-700/50">
            <span class="text-slate-400 text-lg">Descuento</span>
            <span class="text-green-400 text-lg font-medium">-{{ formatMoney(socketStore.discount) }}</span>
          </div>
        </div>

        <!-- Total -->
        <div class="mt-4 p-6 bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl shadow-lg shadow-brand-500/30">
          <div class="flex justify-between items-center">
            <span class="text-white/80 text-xl font-medium">Total</span>
            <span class="text-white text-4xl font-bold">{{ formatMoney(socketStore.total) }}</span>
          </div>
        </div>
      </aside>
    </main>
  </div>
</template>
