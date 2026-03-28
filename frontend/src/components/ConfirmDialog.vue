<script setup>
import { ref, computed } from 'vue'
import { AlertTriangle, Send, CheckCircle, XCircle, PackageCheck } from 'lucide-vue-next'

const visible = ref(false)
const message = ref('')
const title = ref('Confirmar')
const type = ref('danger')
const buttonLabel = ref('Confirmar')
const onConfirm = ref(null)

const show = (msg, callback, options = {}) => {
  message.value = msg
  title.value = options.title || 'Confirmar'
  type.value = options.type || 'danger'
  buttonLabel.value = options.buttonLabel || (options.type === 'danger' ? 'Eliminar' : options.type === 'warning' ? 'Enviar' : options.type === 'info' ? 'Confirmar' : 'Confirmar')
  onConfirm.value = callback
  visible.value = true
}

const handleConfirm = () => {
  if (onConfirm.value) {
    onConfirm.value()
  }
  visible.value = false
}

const handleCancel = () => {
  visible.value = false
  onConfirm.value = null
}

const getIcon = () => {
  if (type.value === 'success') return CheckCircle
  if (type.value === 'warning') return PackageCheck
  if (type.value === 'info') return Send
  return AlertTriangle
}

defineExpose({ show })
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="handleCancel"></div>
      <div class="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700">
        <div class="flex items-start gap-4">
        <div :class="['w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', 
            type === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 
            type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' : 
            type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' : 
            'bg-red-100 dark:bg-red-900/30']">
          <component :is="getIcon()" :class="['w-6 h-6', 
              type === 'success' ? 'text-green-600 dark:text-green-400' : 
              type === 'warning' ? 'text-amber-600 dark:text-amber-400' : 
              type === 'info' ? 'text-blue-600 dark:text-blue-400' : 
              'text-red-600 dark:text-red-400']" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">{{ title }}</h3>
            <p class="text-slate-600 dark:text-slate-300">{{ message }}</p>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="handleCancel" class="flex-1 px-4 py-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
          <button 
            @click="handleConfirm" 
            :class="[
              'flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors',
              type === 'success' ? 'bg-green-500 hover:bg-green-600' : 
              type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 
              type === 'info' ? 'bg-blue-500 hover:bg-blue-600' : 
              'bg-red-500 hover:bg-red-600'
            ]"
          >
            {{ buttonLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
