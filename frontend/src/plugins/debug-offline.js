import { db, getDatabaseSize, getAllMeta, clearAllData } from '../lib/offline-db.js'
import { cacheService } from '../services/cache.service.js'
import { syncManager } from '../lib/sync-manager.js'
import { useOfflineStore } from '../stores/offline.store.js'
import { useNetworkStatus } from '../composables/useNetworkStatus.js'

const { setOnline } = useNetworkStatus()

window.debugOffline = {
  async getStats() {
    const stats = await getDatabaseSize()
    console.table(stats)
    return stats
  },

  async getMeta() {
    const meta = await getAllMeta()
    console.table(meta)
    return meta
  },

  async syncItems() {
    console.log('🔄 Sincronizando productos...')
    const result = await cacheService.syncItems()
    console.log('✅ Resultado:', result)
    return result
  },

  async syncCategories() {
    console.log('🔄 Sincronizando categorías...')
    const result = await cacheService.syncCategories()
    console.log('✅ Resultado:', result)
    return result
  },

  async syncAll(locationId = null) {
    console.log('🔄 Sincronizando TODO...')
    const offlineStore = useOfflineStore()
    const result = await offlineStore.syncAll(locationId)
    console.log('✅ Resultado:', result)
    return result
  },

  async syncPendingSales() {
    console.log('🔄 Sincronizando ventas pendientes...')
    const result = await syncManager.processQueue()
    console.log('✅ Resultado:', result)
    return result
  },

  async simulateOffline() {
    console.log('🔌 Simulando OFFLINE...')
    setOnline(false)
    const offlineStore = useOfflineStore()
    console.log('✅ Estado:', offlineStore.isOnline)
  },

  async simulateOnline() {
    console.log('🌐 Simulando ONLINE...')
    setOnline(true)
    const offlineStore = useOfflineStore()
    console.log('✅ Estado:', offlineStore.isOnline)
  },

  async clearData() {
    if (confirm('¿Eliminar TODOS los datos offline?')) {
      await clearAllData()
      console.log('🗑️ Datos eliminados')
    }
  },

  async getQueue() {
    const pending = await cacheService.getPendingSync()
    console.log(`📤 Cola de sincronización (${pending.length} pendientes):`)
    console.table(pending.map(p => ({
      id: p.id,
      tipo: p.type,
      estado: p.status,
      offline_id: p.offline_id?.substring(0, 20) + '...',
      creado: new Date(p.created_at).toLocaleString()
    })))
    return pending
  },

  async getSyncStats() {
    const stats = await cacheService.getSyncStats()
    console.log('📊 Estadísticas de sincronización:')
    console.table(stats)
    
    const history = await cacheService.getSyncHistory(10)
    console.log('📋 Últimas 10 sincronizaciones:')
    console.table(history.map(h => ({
      id: h.id,
      offline_id: h.offline_id?.substring(0, 15) + '...',
      estado: h.status,
      sale_number: h.sale_number || '-',
      synced_at: h.synced_at ? new Date(h.synced_at).toLocaleString() : '-'
    })))
    return stats
  },

  async help() {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║          COMANDOS DEBUG MODO OFFLINE                     ║
╠════════════════════════════════════════════════════════════╣
║  debugOffline.getStats()       - Ver estadísticas BD       ║
║  debugOffline.getMeta()        - Ver timestamps sync       ║
║  debugOffline.syncItems()      - Sincronizar productos    ║
║  debugOffline.syncCategories() - Sincronizar categorías    ║
║  debugOffline.syncAll()        - Sincronizar TODO        ║
║  debugOffline.syncPendingSales()- Sincronizar ventas       ║
║  debugOffline.getSyncStats()   - Ver estadísticas sync     ║
║  debugOffline.simulateOffline()- Simular OFFLINE          ║
║  debugOffline.simulateOnline() - Simular ONLINE          ║
║  debugOffline.getQueue()      - Ver cola de sync         ║
║  debugOffline.clearData()     - Limpiar datos            ║
╚════════════════════════════════════════════════════════════╝
    `)
  }
}

console.log('%c🔧 Modo Debug Offline cargado', 'color: #2563eb; font-weight: bold')
console.log('Usa: debugOffline.help() para ver comandos')
