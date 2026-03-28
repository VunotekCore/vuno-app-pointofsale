import { randomUUID } from 'crypto'
import database from '../config/database.js'

export class SyncRepository {
  constructor(db = database) {
    this.db = db
  }

  async createSyncLog(deviceId, userId, locationId, totalSales) {
    const id = randomUUID()
    await this.db.query(
      `INSERT INTO sync_logs (id, device_id, user_id, location_id, total_sales) 
       VALUES (UUID_TO_BIN(?), ?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?)`,
      [id, deviceId, userId, locationId, totalSales]
    )
    return id
  }

  async updateSyncLog(id, successful, failed, status) {
    await this.db.query(
      `UPDATE sync_logs SET successful_sales = ?, failed_sales = ?, status = ? WHERE id = UUID_TO_BIN(?)`,
      [successful, failed, status, id]
    )
  }

  async saveSaleDetail(syncLogId, offlineId, saleData, itemsData, paymentsData) {
    const [result] = await this.db.query(
      `INSERT INTO sync_sales_details (sync_log_id, offline_id, sale_data, items_data, payments_data)
       VALUES (UUID_TO_BIN(?), ?, ?, ?, ?)`,
      [syncLogId, offlineId, JSON.stringify(saleData), JSON.stringify(itemsData), JSON.stringify(paymentsData)]
    )
    return result.insertId
  }

  async updateSaleDetail(id, status, serverSaleId = null, serverSaleNumber = null, errorMessage = null) {
    const syncTime = status === 'synced' ? 'NOW()' : 'NULL'
    await this.db.query(
      `UPDATE sync_sales_details 
       SET status = ?, server_sale_id = UUID_TO_BIN(?), server_sale_number = ?, 
           error_message = ?, synced_at = ${syncTime}
       WHERE id = ?`,
      [status, serverSaleId, serverSaleNumber, errorMessage, id]
    )
  }

  async saveOfflineIdMapping(offlineId, serverId, saleNumber, deviceId) {
    await this.db.query(
      `INSERT INTO offline_id_mapping (offline_id, server_id, sale_number, device_id)
       VALUES (?, UUID_TO_BIN(?), ?, ?)
       ON DUPLICATE KEY UPDATE server_id = UUID_TO_BIN(?), sale_number = ?, synced_at = NOW()`,
      [offlineId, serverId, saleNumber, deviceId, serverId, saleNumber]
    )
  }

  async checkOfflineIdExists(offlineId) {
    const rows = await this.db.query(
      `SELECT server_id, sale_number FROM offline_id_mapping WHERE offline_id = ?`,
      [offlineId]
    )
    return rows[0] || null
  }

  async saveConflict(syncLogId, offlineId, conflictType, details) {
    await this.db.query(
      `INSERT INTO sync_conflicts (sync_log_id, offline_id, conflict_type, details)
       VALUES (UUID_TO_BIN(?), ?, ?, ?)`,
      [syncLogId, offlineId, conflictType, JSON.stringify(details)]
    )
  }

  async getSyncHistory(userId, limit = 20) {
    return await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, device_id, BIN_TO_UUID(user_id) as user_id, 
              BIN_TO_UUID(location_id) as location_id, synced_at, total_sales, 
              successful_sales, failed_sales, status, metadata
       FROM sync_logs 
       WHERE user_id = UUID_TO_BIN(?)
       ORDER BY synced_at DESC
       LIMIT ?`,
      [userId, limit]
    )
  }

  async getSyncDetails(syncLogId) {
    const details = await this.db.query(
      `SELECT id, offline_id, sale_data, items_data, payments_data, status, 
              error_message, BIN_TO_UUID(server_sale_id) as server_sale_id, 
              server_sale_number, synced_at
       FROM sync_sales_details
       WHERE sync_log_id = UUID_TO_BIN(?)`,
      [syncLogId]
    )
    
    const conflicts = await this.db.query(
      `SELECT id, offline_id, conflict_type, details, resolution, resolved_at, 
              BIN_TO_UUID(resolved_by) as resolved_by
       FROM sync_conflicts
       WHERE sync_log_id = UUID_TO_BIN(?)`,
      [syncLogId]
    )
    
    return { details, conflicts }
  }

  async resolveConflict(conflictId, resolvedBy, resolution = 'resolved') {
    await this.db.query(
      `UPDATE sync_conflicts SET resolution = ?, resolved_at = NOW(), resolved_by = UUID_TO_BIN(?) WHERE id = ?`,
      [resolution, resolvedBy, conflictId]
    )
  }
}
