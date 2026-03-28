import { db, DB_TABLES, SYNC_STATUS, SYNC_TYPES, META_KEYS, getMeta, setMeta } from '../lib/offline-db.js'
import { itemsService, coreService } from './inventory.service.js'
import { customersService } from './sales.service.js'
import api from './api.service.js'

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

async function getDeviceId() {
  let deviceId = await getMeta(META_KEYS.DEVICE_ID)
  if (!deviceId) {
    deviceId = generateUUID()
    await setMeta(META_KEYS.DEVICE_ID, deviceId)
  }
  return deviceId
}

export const cacheService = {
  async syncItems(locationId = null) {
    try {
      const response = await itemsService.getItems({ 
        is_active: 1,
        ...(locationId && { location_id: locationId })
      })
      const items = response.data.data || []
      
      await db.transaction('rw', db.items, async () => {
        await db.items.clear()
        for (const item of items) {
          await db.items.put({
            id: item.id,
            code: item.code,
            name: item.name,
            category_id: item.category_id,
            price: parseFloat(item.price),
            cost: parseFloat(item.cost || 0),
            image_url: item.image_url,
            is_active: item.is_active,
            has_variations: item.has_variations || false,
            variations: item.variations || [],
            updated_at: new Date().toISOString()
          })
        }
      })
      
      await setMeta(META_KEYS.LAST_ITEMS_SYNC, new Date().toISOString())
      return { success: true, count: items.length }
    } catch (error) {
      console.error('Error syncing items:', error)
      return { success: false, error: error.message }
    }
  },

  async syncCategories() {
    try {
      const response = await coreService.getCategories()
      const categories = response.data.data || []
      
      await db.transaction('rw', db.categories, async () => {
        await db.categories.clear()
        for (const cat of categories) {
          await db.categories.put({
            id: cat.id,
            name: cat.name,
            parent_id: cat.parent_id,
            is_active: cat.is_active,
            updated_at: new Date().toISOString()
          })
        }
      })
      
      await setMeta(META_KEYS.LAST_CATEGORIES_SYNC, new Date().toISOString())
      return { success: true, count: categories.length }
    } catch (error) {
      console.error('Error syncing categories:', error)
      return { success: false, error: error.message }
    }
  },

  async syncCustomers() {
    try {
      const response = await customersService.getCustomers({ is_active: 1, limit: 1000 })
      const customers = response.data.data || []
      
      await db.transaction('rw', db.customers, async () => {
        await db.customers.clear()
        for (const customer of customers) {
          await db.customers.put({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            points: customer.points || 0,
            is_active: customer.is_active,
            updated_at: new Date().toISOString()
          })
        }
      })
      
      await setMeta(META_KEYS.LAST_CUSTOMERS_SYNC, new Date().toISOString())
      return { success: true, count: customers.length }
    } catch (error) {
      console.error('Error syncing customers:', error)
      return { success: false, error: error.message }
    }
  },

  async syncStock(locationId) {
    try {
      const response = await api.get('/inventory/stock', { 
        params: { location_id: locationId } 
      })
      const stockItems = response.data.data || []
      
      await db.transaction('rw', db.stock, async () => {
        await db.stock.where('location_id').equals(locationId).delete()
        for (const stock of stockItems) {
          await db.stock.put({
            id: stock.id,
            item_id: stock.item_id,
            location_id: locationId,
            quantity: stock.quantity,
            min_quantity: stock.min_quantity || 0
          })
        }
      })
      
      await setMeta(META_KEYS.LAST_STOCK_SYNC, new Date().toISOString())
      return { success: true, count: stockItems.length }
    } catch (error) {
      console.error('Error syncing stock:', error)
      return { success: false, error: error.message }
    }
  },

  async syncAll(locationId) {
    const results = {
      items: await this.syncItems(locationId),
      categories: await this.syncCategories(),
      customers: await this.syncCustomers(),
      stock: locationId ? await this.syncStock(locationId) : { success: true, count: 0 }
    }
    return results
  },

  async getItems(search = '', categoryId = null) {
    let query = db.items.where('is_active').equals(1)
    
    if (categoryId) {
      return await db.items
        .where('category_id').equals(categoryId)
        .filter(item => item.is_active === 1)
        .toArray()
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      return await db.items
        .filter(item => 
          item.is_active === 1 && (
            item.name.toLowerCase().includes(searchLower) ||
            (item.code && item.code.toLowerCase().includes(searchLower))
          )
        )
        .toArray()
    }
    
    return await db.items.where('is_active').equals(1).toArray()
  },

  async getCategories() {
    return await db.categories.filter(cat => cat.is_active === 1).toArray()
  },

  async getCustomers(search = '') {
    if (search) {
      const searchLower = search.toLowerCase()
      return await db.customers
        .filter(c => 
          c.is_active === 1 && (
            c.name.toLowerCase().includes(searchLower) ||
            (c.phone && c.phone.includes(search))
          )
        )
        .toArray()
    }
    return await db.customers.filter(c => c.is_active === 1).toArray()
  },

  async getStock(itemId, locationId) {
    const stock = await db.stock
      .where('[item_id+location_id]')
      .equals([itemId, locationId])
      .first()
    return stock?.quantity || 0
  },

  async updateLocalStock(itemId, locationId, quantityChange) {
    const key = [itemId, locationId]
    const stock = await db.stock.where('[item_id+location_id]').equals(key).first()
    if (stock) {
      await db.stock.update(stock.id, { 
        quantity: Math.max(0, stock.quantity + quantityChange) 
      })
    }
  },

  async queueSaleOffline(saleData, items, payments) {
    const offlineId = `OFFLINE_${generateUUID()}`
    await db.syncQueue.add({
      type: SYNC_TYPES.SALE,
      status: SYNC_STATUS.PENDING,
      offline_id: offlineId,
      payload: {
        sale: saleData,
        items: items,
        payments: payments
      },
      device_id: await getDeviceId(),
      created_at: new Date().toISOString(),
      synced_at: null,
      error: null,
      server_id: null,
      sale_number: null
    })
    return offlineId
  },

  async getPendingSync() {
    return await db.syncQueue
      .where('status').equals(SYNC_STATUS.PENDING)
      .toArray()
  },

  async markSynced(id, serverResponse) {
    const record = await db.syncQueue.get(id)
    if (!record) return

    await db.syncQueue.update(id, {
      status: SYNC_STATUS.SYNCED,
      synced_at: new Date().toISOString(),
      server_id: serverResponse?.server_id || serverResponse?.id,
      sale_number: serverResponse?.sale_number
    })
    
    console.log(`✅ Sale synced: ${record.offline_id} → ${serverResponse?.sale_number || serverResponse?.id}`)
  },

  async markSyncFailed(id, error) {
    await db.syncQueue.update(id, {
      status: SYNC_STATUS.FAILED,
      error: error
    })
  },

  async isAlreadySynced(offlineId) {
    const record = await db.syncQueue
      .where('offline_id').equals(offlineId)
      .first()
    return record?.status === SYNC_STATUS.SYNCED
  },

  async getSyncHistory(limit = 50) {
    return await db.syncQueue
      .orderBy('synced_at')
      .reverse()
      .limit(limit)
      .toArray()
  },

  async getSyncStats() {
    const pending = await db.syncQueue.where('status').equals(SYNC_STATUS.PENDING).count()
    const synced = await db.syncQueue.where('status').equals(SYNC_STATUS.SYNCED).count()
    const failed = await db.syncQueue.where('status').equals(SYNC_STATUS.FAILED).count()
    return { pending, synced, failed }
  },

  async retrySync(id) {
    await db.syncQueue.update(id, {
      status: SYNC_STATUS.PENDING
    })
  },

  async clearSynced() {
    await db.syncQueue.where('status').equals(SYNC_STATUS.SYNCED).delete()
  },

  async getSyncHistory() {
    return await db.syncQueue
      .orderBy('created_at')
      .reverse()
      .limit(50)
      .toArray()
  },

  async getLastSyncInfo() {
    return {
      items: await getMeta(META_KEYS.LAST_ITEMS_SYNC),
      categories: await getMeta(META_KEYS.LAST_CATEGORIES_SYNC),
      customers: await getMeta(META_KEYS.LAST_CUSTOMERS_SYNC),
      stock: await getMeta(META_KEYS.LAST_STOCK_SYNC)
    }
  },

  async clearItemsCache() {
    await db.items.clear()
  }
}
