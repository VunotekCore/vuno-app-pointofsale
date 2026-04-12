<script setup>
import { ref, computed, watch } from 'vue'
import { Image, Upload, X, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: ''
  },
  previewUrl: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Imagen del producto'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  aspectRatio: {
    type: String,
    default: '1:1' // 1:1 square for products
  },
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  },
  acceptedTypes: {
    type: Array,
    default: () => ['image/jpeg', 'image/png', 'image/webp']
  },
  size: {
    type: String,
    default: 'md' // sm, md, lg, full
  },
  maxHeight: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'update:previewUrl', 'upload-start', 'upload-end'])

const isDragging = ref(false)
const isUploading = ref(false)
const fileInput = ref(null)
const currentPreview = ref('')
const error = ref('')

// Initialize preview from previewUrl prop
watch(() => props.previewUrl, (newVal) => {
  currentPreview.value = newVal || ''
}, { immediate: true })

const aspectRatioClass = computed(() => {
  if (props.maxHeight) return '' // Remove aspect ratio when maxHeight is set
  return props.aspectRatio === '1:1' ? 'pb-[100%]' : 'pb-[56.25%]'
})

const sizeClass = computed(() => {
  const sizes = {
    sm: 'w-[180px]',
    avatar: 'w-[140px]',
    logo: 'w-[200px]',
    md: 'w-[250px]',
    lg: 'w-[400px]',
    full: 'w-full'
  }
  return sizes[props.size] || sizes.md
})

const maxHeightClass = computed(() => {
  if (!props.maxHeight) return ''
  return `max-h-[${props.maxHeight}px]`
})

const handleDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  
  const files = e.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

const handleClick = () => {
  if (!props.disabled) {
    fileInput.value?.click()
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

const processFile = async (file) => {
  error.value = ''
  
  // Validate type
  if (!props.acceptedTypes.includes(file.type)) {
    error.value = 'Tipo de archivo no permitido. Usa JPG, PNG o WebP'
    return
  }
  
  // Validate size
  if (file.size > props.maxSize) {
    error.value = `El archivo es muy grande. Máximo ${Math.round(props.maxSize / 1024 / 1024)}MB`
    return
  }
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    currentPreview.value = e.target.result
    emit('update:previewUrl', e.target.result)
  }
  reader.readAsDataURL(file)
  
  emit('upload-start')
  isUploading.value = true
  emit('update:modelValue', file)
  emit('upload-end')
  isUploading.value = false
}

const clearImage = () => {
  currentPreview.value = ''
  emit('update:previewUrl', '')
  emit('update:modelValue', '')
  error.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {{ label }}
    </label>
    
    <div
      class="relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden mx-auto"
      :class="[
        sizeClass,
        aspectRatioClass,
        disabled 
          ? 'border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60' 
          : isDragging 
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
            : 'border-slate-300 dark:border-slate-600 hover:border-brand-400 dark:hover:border-brand-500'
      ]"
      :style="maxHeight ? { maxHeight: maxHeight + 'px', height: maxHeight + 'px' } : {}"
      @click="handleClick"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="acceptedTypes.join(',')"
        class="hidden"
        :disabled="disabled"
        @change="handleFileSelect"
      />
      
      <!-- Preview / Placeholder -->
      <div 
        class="absolute inset-0 flex items-center justify-center"
      >
        <!-- Loading State -->
        <div 
          v-if="isUploading"
          class="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex flex-col items-center justify-center z-10"
        >
          <Loader2 class="w-8 h-8 text-brand-500 animate-spin mb-2" />
          <span class="text-sm text-slate-600 dark:text-slate-400">Procesando...</span>
        </div>
        
        <!-- Image Preview -->
        <img
          v-if="currentPreview && !isDragging"
          :src="currentPreview"
          alt="Preview"
          class="absolute inset-0 w-full h-full object-cover"
        />
        
        <!-- Empty State -->
        <div 
          v-if="!currentPreview || isDragging"
          class="absolute inset-2 flex flex-col items-center justify-center text-center"
        >
          <div class="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <Image v-if="!isDragging" class="w-8 h-8 text-slate-400" />
            <Upload v-else class="w-8 h-8 text-brand-500" />
          </div>
          <p class="text-sm text-slate-600 dark:text-slate-400 font-medium">
            {{ isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic' }}
          </p>
          <p class="text-xs text-slate-500 mt-1">
            JPG, PNG o WebP. Máximo {{ Math.round(maxSize / 1024 / 1024) }}MB
          </p>
        </div>
        
        <!-- Remove Button -->
        <button
          v-if="currentPreview && !disabled && !isUploading"
          type="button"
          class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-20"
          @click.stop="clearImage"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <!-- Error Message -->
    <p v-if="error" class="text-red-500 text-xs mt-1">{{ error }}</p>
  </div>
</template>
