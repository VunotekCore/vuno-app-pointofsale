import { cacheService } from '../services/cache.service.js'
import api from '../services/api.service.js'
import { isNetworkOnline } from '../composables/useNetworkStatus.js'

class SyncManager {
  constructor() {
    this.isSyncing = false
    this.listeners = []
    this.syncInterval = null
    this.isInitialized = false
  }

  initialize() {
    if (this.isInitialized) return
    this.isInitialized = true

    window.addEventListener('online', () => this.handleOnline())
    
    this.syncInterval = setInterval(() => {
      if (isNetworkOnline() && !this.isSyncing) {
        this.processQueue()
      }
    }, 30000)
  }

  destroy() {
    window.removeEventListener('online', () => this.handleOnline())
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    this.isInitialized = false
  }

  handleOnline() {
    setTimeout(() => this.processQueue(), 1000)
  }

  onSyncProgress(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  emitProgress(event) {
    this.listeners.forEach(callback => callback(event))
  }

  async processQueue() {
    if (this.isSyncing || !isNetworkOnline()) return

    const pending = await cacheService.getPendingSync()
    if (pending.length === 0) return

    this.isSyncing = true
    this.emitProgress({ type: 'start', count: pending.length })

    console.log(`🔄 Iniciando sincronización de ${pending.length} ventas`)

    try {
      const result = await this.syncBatch(pending)
      console.log(`✅ Batch sync completado: ${result.synced} sincronizadas, ${result.failed} fallidas`)
      this.emitProgress({
        type: 'complete',
        synced: result.synced,
        failed: result.failed,
        total: result.total
      })
      return result
    } catch (error) {
      console.warn('⚠️ Batch sync falló, intentando método individual...')
      const result = await this.syncIndividually(pending)
      this.emitProgress({
        type: 'complete',
        synced: result.synced,
        failed: result.failed,
        total: result.total,
        fallback: true
      })
      return result
    } finally {
      this.isSyncing = false
    }
  }

  async syncBatch(pending) {
    const salesToSync = pending.map(item => ({
      offline_id: item.offline_id,
      sale: item.payload.sale,
      items: item.payload.items,
      payments: item.payload.payments
    }))

    const deviceId = await this.getDeviceId()

    console.log(`📤 Enviando ${salesToSync.length} ventas al servidor...`)

    const response = await api.post('/sync/sales', {
      sales: salesToSync,
      device_id: deviceId
    })

    const result = response.data.data

    for (const synced of result.results.synced) {
      const pendingItem = pending.find(p => p.offline_id === synced.offline_id)
      if (pendingItem) {
        await cacheService.markSynced(pendingItem.id, {
          server_id: synced.server_id,
          sale_number: synced.sale_number
        })
      }
    }

    for (const failed of result.results.failed) {
      const pendingItem = pending.find(p => p.offline_id === failed.offline_id)
      if (pendingItem) {
        await cacheService.markSyncFailed(pendingItem.id, failed.error)
        console.error(`❌ Venta ${failed.offline_id} falló:`, failed.error)
      }
    }

    return result
  }

  async syncIndividually(pending) {
    let synced = 0
    let failed = 0

    for (const item of pending) {
      try {
        await this.syncSaleItem(item)
        await cacheService.markSynced(item.id, { synced: true })
        synced++
        this.emitProgress({ type: 'progress', synced, failed, total: pending.length })
      } catch (error) {
        console.error('Sync error for item:', item.id, error)
        await cacheService.markSyncFailed(item.id, error.message)
        failed++
        this.emitProgress({ type: 'error', item, error: error.message })
      }
    }

    return { synced, failed, total: pending.length }
  }

  async syncSaleItem(item) {
    const { sale, items, payments } = item.payload

    const createResponse = await api.post('/sales', {
      location_id: sale.location_id,
      customer_id: sale.customer_id,
      subtotal: sale.subtotal,
      tax_amount: sale.tax_amount,
      discount_amount: sale.discount_amount,
      total: sale.total,
      items: items,
      notes: sale.notes || '',
      created_at: item.created_at
    })

    const saleId = createResponse.data.data.id

    if (payments && payments.length > 0) {
      await api.post(`/sales/${saleId}/complete`, { payments })
    }

    return { saleId, success: true }
  }

  async getDeviceId() {
    const stored = localStorage.getItem('device_id')
    if (stored) return stored
    
    const newId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('device_id', newId)
    return newId
  }

  async retryFailed() {
    const history = await cacheService.getSyncHistory()
    const failed = history.filter(h => h.status === 'failed')

    for (const item of failed) {
      await cacheService.retrySync(item.id)
    }

    if (failed.length > 0) {
      await this.processQueue()
    }

    return { retried: failed.length }
  }
}

export const syncManager = new SyncManager()
