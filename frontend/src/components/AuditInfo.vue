<template>
  <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
    <div>
      <p class="text-xs text-slate-500 uppercase">{{ createdLabel }}</p>
      <p class="font-medium text-slate-900 dark:text-white text-sm mt-1 flex items-center gap-1">
        <User class="w-3.5 h-3.5" />
        {{ createdBy || 'Sistema' }}
      </p>
      <p class="text-xs text-slate-400">
        {{ formatDate(createdAt) }}
      </p>
    </div>
    <div v-if="updatedBy">
      <p class="text-xs text-slate-500 uppercase">{{ updatedLabel }}</p>
      <p class="font-medium text-slate-900 dark:text-white text-sm mt-1 flex items-center gap-1">
        <User class="w-3.5 h-3.5" />
        {{ updatedBy }}
      </p>
      <p class="text-xs text-slate-400">
        {{ formatDate(updatedAt) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { User } from 'lucide-vue-next'

const props = defineProps({
  createdBy: {
    type: String,
    default: ''
  },
  createdAt: {
    type: [String, Date],
    default: ''
  },
  updatedBy: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: [String, Date],
    default: ''
  },
  createdLabel: {
    type: String,
    default: 'Creado por'
  },
  updatedLabel: {
    type: String,
    default: 'Última acción'
  }
})

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString()
}
</script>
