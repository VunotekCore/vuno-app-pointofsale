<script setup>
import { RouterView } from 'vue-router'
import ToastNotification from './components/ToastNotification.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import SyncProgressModal from './components/SyncProgressModal.vue'
import { ref } from 'vue'

const confirmRef = ref(null)
const showSyncModal = ref(false)

window.$confirm = (message, callback, options) => {
  confirmRef.value?.show(message, callback, options)
}
</script>

<template>
  <RouterView />
  <ToastNotification />
  <ConfirmDialog ref="confirmRef" />
  <SyncProgressModal 
    :show="showSyncModal" 
    @close="showSyncModal = false" 
    @retry="() => {}"
  />
</template>
