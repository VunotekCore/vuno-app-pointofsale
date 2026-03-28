import Dexie from 'dexie'

export const db = new Dexie('VunoPOS_Offline')

db.version(1).stores({
  items: 'id, code, name, category_id, price, cost, is_active, updated_at',
  categories: 'id, name, parent_id, is_active',
  customers: 'id, name, phone, email, is_active',
  stock: '[item_id+location_id], item_id, location_id, quantity',
  syncQueue: '++id, type, status, created_at, synced_at',
  metadata: 'key'
})

export const DB_TABLES = {
  ITEMS: 'items',
  CATEGORIES: 'categories',
  CUSTOMERS: 'customers',
  STOCK: 'stock',
  SYNC_QUEUE: 'syncQueue',
  METADATA: 'metadata'
}

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED: 'synced',
  FAILED: 'failed'
}

export const SYNC_TYPES = {
  SALE: 'sale',
  SALE_RETURN: 'sale_return'
}

export const META_KEYS = {
  LAST_ITEMS_SYNC: 'last_items_sync',
  LAST_CATEGORIES_SYNC: 'last_categories_sync',
  LAST_CUSTOMERS_SYNC: 'last_customers_sync',
  LAST_STOCK_SYNC: 'last_stock_sync',
  DEVICE_ID: 'device_id'
}

export async function getMeta(key) {
  const record = await db.metadata.get(key)
  return record?.value
}

export async function setMeta(key, value) {
  await db.metadata.put({ key, value })
}

export async function getAllMeta() {
  return await db.metadata.toArray()
}

export async function clearAllData() {
  await db.items.clear()
  await db.categories.clear()
  await db.customers.clear()
  await db.stock.clear()
  await db.syncQueue.clear()
}

export async function getDatabaseSize() {
  const items = await db.items.count()
  const categories = await db.categories.count()
  const customers = await db.customers.count()
  const stock = await db.stock.count()
  const queue = await db.syncQueue.where('status').equals(SYNC_STATUS.PENDING).count()
  
  return { items, categories, customers, stock, pendingSync: queue }
}
