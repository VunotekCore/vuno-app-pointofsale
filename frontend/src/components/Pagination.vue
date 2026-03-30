<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalRecords: {
    type: Number,
    default: 0
  },
  label: {
    type: String,
    default: 'registros'
  }
})

const emit = defineEmits(['page-change'])

const visiblePages = computed(() => {
  const pages = []
  const total = props.totalPages
  const current = props.currentPage
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      pages.push(1, 2, 3, 4, '...', total)
    } else if (current >= total - 2) {
      pages.push(1, '...', total - 3, total - 2, total - 1, total)
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total)
    }
  }
  return pages
})

const goToPage = (page) => {
  if (page === '...') return
  if (page < 1 || page > props.totalPages) return
  emit('page-change', page)
}
</script>

<template>
  <div v-if="totalPages > 0" class="pagination-container bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
    <div class="text-xs md:text-sm order-2 md:order-1">
      {{ totalRecords }} {{ label }}{{ totalRecords !== 1 ? 's' : '' }} | Página {{ currentPage }} de {{ totalPages }}
    </div>
    
    <div v-if="totalPages > 1" class="flex items-center gap-1 order-1 md:order-2">
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="p-1.5 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ChevronLeft class="w-4 h-4 md:w-4 md:h-4" />
      </button>
      
      <button
        v-for="(page, index) in visiblePages"
        :key="index"
        @click="goToPage(page)"
        class="hidden md:inline-flex px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors"
        :class="page === '...' 
          ? 'border-transparent cursor-default' 
          : page === currentPage
            ? 'bg-brand-500 text-white border-brand-500' 
            : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'"
        :disabled="page === '...'"
      >
        {{ page }}
      </button>

      <button
        v-if="totalPages > 1"
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="p-1.5 md:px-3 md:py-1.5 text-xs md:text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <ChevronRight class="w-4 h-4 md:w-4 md:h-4" />
      </button>
    </div>
    
    <div v-else class="text-xs md:text-sm text-slate-400 order-1 md:order-2">
      (sin paginación)
    </div>
  </div>
</template>
