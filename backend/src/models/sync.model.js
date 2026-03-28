export class SyncModel {
  constructor (syncRepository, salesModel) {
    this.syncRepo = syncRepository
    this.salesModel = salesModel
  }

  async syncSalesBatch (sales, deviceId, userId, userLocations = [], isAdmin = false) {
    const results = {
      synced: [],
      failed: [],
      conflicts: []
    }

    const locationId = sales[0]?.sale?.location_id || null
    const syncLogId = await this.syncRepo.createSyncLog(
      deviceId,
      userId,
      locationId,
      sales.length
    )

    for (const sale of sales) {
      const { offline_id, sale: saleData, items, payments } = sale

      try {
        const existingMapping = await this.syncRepo.checkOfflineIdExists(offline_id)
        if (existingMapping) {
          results.synced.push({
            offline_id,
            server_id: existingMapping.server_id,
            sale_number: existingMapping.sale_number,
            status: 'already_synced'
          })
          continue
        }

        const fullSaleData = {
          ...saleData,
          items
        }

        const createdSale = await this.salesModel.createSale(
          fullSaleData,
          userId,
          userLocations,
          isAdmin
        )

        if (payments && payments.length > 0) {
          await this.salesModel.completeSale(
            createdSale.id,
            payments,
            userId,
            userLocations,
            isAdmin
          )
        }

        await this.syncRepo.saveOfflineIdMapping(
          offline_id,
          createdSale.id,
          createdSale.sale_number,
          deviceId
        )

        results.synced.push({
          offline_id,
          server_id: createdSale.id,
          sale_number: createdSale.sale_number,
          status: 'synced'
        })
      } catch (error) {
        console.error(`Error syncing sale ${offline_id}:`, error)

        let conflictType = 'invalid_data'
        const details = { error: error.message }

        if (error.message && error.message.includes('Stock')) {
          conflictType = 'insufficient_stock'
        }

        await this.syncRepo.saveConflict(syncLogId, offline_id, conflictType, details)

        results.failed.push({
          offline_id,
          error: error.message,
          conflict_type: conflictType
        })
      }
    }

    const status = results.failed.length === 0
      ? 'completed'
      : results.synced.length > 0 ? 'partial' : 'failed'

    await this.syncRepo.updateSyncLog(
      syncLogId,
      results.synced.length,
      results.failed.length,
      status
    )

    return {
      sync_log_id: syncLogId,
      total: sales.length,
      synced: results.synced.length,
      failed: results.failed.length,
      status,
      results
    }
  }

  async getSyncHistory (userId) {
    return await this.syncRepo.getSyncHistory(userId)
  }

  async getSyncDetails (syncLogId) {
    return await this.syncRepo.getSyncDetails(syncLogId)
  }

  async resolveConflict (conflictId, userId, resolution = 'resolved') {
    await this.syncRepo.resolveConflict(conflictId, userId, resolution)
    return { success: true }
  }
}
