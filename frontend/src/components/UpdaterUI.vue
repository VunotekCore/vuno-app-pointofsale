<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '../stores/notification.store.js'
import { Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-vue-next'

const notify = useNotificationStore()

const isElectron = typeof window !== 'undefined' && window.electronAPI
const updateState = ref(null)
const downloadProgress = ref(0)
const currentVersion = ref(null)

const clearUpdateState = () => {
  setTimeout(() => {
    updateState.value = null
    downloadProgress.value = 0
  }, 4000)
}

const handleCheckForUpdatesManual = () => {
  if (!isElectron) return
  updateState.value = 'checking'
  notify.info('Buscando actualizaciones...')
}

const handleUpdateAvailable = (info) => {
  if (!isElectron) return
  updateState.value = 'downloading'
  downloadProgress.value = 0
  notify.info(`Nueva versión ${info.version} disponible, descargando...`)
}

const handleUpdateProgress = (progress) => {
  if (!isElectron) return
  downloadProgress.value = Math.round(progress.percent)
  if (updateState.value === 'downloading') {
    notify.info(`Descargando actualización... ${downloadProgress.value}%`)
  }
}

const handleUpdateNotAvailable = () => {
  if (!isElectron) return
  updateState.value = 'up-to-date'
  notify.success('Ya tienes la última versión')
  clearUpdateState()
}

const handleUpdateDownloaded = (info) => {
  if (!isElectron) return
  updateState.value = 'ready'
  notify.success(`Actualización ${info.version} descargada`)

  window.$confirm(
    `La versión ${info.version} está lista para instalar. ¿Deseas reiniciar ahora para aplicar la actualización?`,
    (confirm) => {
      if (confirm && window.electronAPI?.installUpdate) {
        window.electronAPI.installUpdate()
      } else {
        updateState.value = null
      }
    },
    {
      type: 'info',
      title: 'Actualización Lista',
      confirmLabel: 'Reiniciar Ahora',
      cancelLabel: 'Más Tarde'
    }
  )
}

const handleUpdateError = (err) => {
  if (!isElectron) return
  updateState.value = 'error'
  notify.error('Error al buscar actualizaciones')
  clearUpdateState()
}

let unsubscribers = []

onMounted(() => {
  if (!isElectron) return

  if (window.electronAPI?.getAppVersion) {
    window.electronAPI.getAppVersion().then(v => {
      currentVersion.value = v
    })
  }

  if (window.electronAPI?.onCheckForUpdatesManual) {
    unsubscribers.push(window.electronAPI.onCheckForUpdatesManual(handleCheckForUpdatesManual))
  }
  if (window.electronAPI?.onUpdateAvailable) {
    unsubscribers.push(window.electronAPI.onUpdateAvailable(handleUpdateAvailable))
  }
  if (window.electronAPI?.onUpdateProgress) {
    unsubscribers.push(window.electronAPI.onUpdateProgress(handleUpdateProgress))
  }
  if (window.electronAPI?.onUpdateNotAvailable) {
    unsubscribers.push(window.electronAPI.onUpdateNotAvailable(handleUpdateNotAvailable))
  }
  if (window.electronAPI?.onUpdateDownloaded) {
    unsubscribers.push(window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded))
  }
})

onUnmounted(() => {
  unsubscribers.forEach(unsub => unsub?.())
})
</script>

<template>
  <div v-if="isElectron && updateState === 'downloading'" class="fixed bottom-4 right-4 z-[100] bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 w-72">
    <div class="flex items-center gap-3 mb-2">
      <RefreshCw class="w-5 h-5 text-brand-500 animate-spin" />
      <span class="text-sm font-medium text-slate-800 dark:text-white">Descargando actualización</span>
    </div>
    <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
      <div 
        class="bg-brand-500 h-2 rounded-full transition-all duration-300" 
        :style="{ width: `${downloadProgress}%` }"
      ></div>
    </div>
    <p class="text-xs text-slate-500 mt-2 text-center">{{ downloadProgress }}%</p>
  </div>
</template>