import { TransferModel } from '../models/transfer.model.js'
import { TransferRepository } from '../repository/transfer.repository.js'
import { InventoryRepository } from '../repository/inventory.repository.js'
import { ItemsRepository } from '../repository/items.repository.js'
import pool from '../config/database.js'

const transferRepo = new TransferRepository(pool)
const inventoryRepo = new InventoryRepository(pool)
const itemsRepo = new ItemsRepository(pool)
const transferModel = new TransferModel(transferRepo, inventoryRepo, itemsRepo)

const getUserContext = (req) => {
  const isAdmin = req.user?.is_admin == 1
  const userLocations = req.userLocations || []
  return { isAdmin, userLocations }
}

export class TransferController {
  async getAll(req, res, next) {
    try {
      const { isAdmin, userLocations } = getUserContext(req)
      const companyId = req.user?.company_id
      const filters = {
        from_location_id: req.query.from_location_id,
        to_location_id: req.query.to_location_id,
        status: req.query.status,
        search: req.query.search,
        company_id: companyId,
        limit: req.query.limit ? parseInt(req.query.limit) : 20,
        offset: req.query.offset ? parseInt(req.query.offset) : 0
      }
      // console.log('[Transfers] getAll filters:', filters)
      const result = await transferModel.getAll(filters, userLocations, isAdmin)
      // console.log('[Transfers] getAll result:', { dataCount: result.data.length, total: result.total })
      res.status(200).json({ success: true, data: result.data, total: result.total })
    } catch (error) {
      next(error)
    }
  }

  async getPendingReceipt(req, res, next) {
    try {
      const { isAdmin, userLocations } = getUserContext(req)
      const companyId = req.user?.company_id
      const transfers = await transferModel.getPendingReceipt(userLocations, isAdmin, companyId)
      res.status(200).json({ success: true, data: transfers, total: transfers.length })
    } catch (error) {
      next(error)
    }
  }

  async getById(req, res, next) {
    try {
      const { isAdmin, userLocations } = getUserContext(req)
      const companyId = req.user?.company_id
      const transfer = await transferModel.getById(req.params.id, userLocations, isAdmin, companyId)
      res.status(200).json({ success: true, data: transfer })
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const { from_location_id, to_location_id, notes } = req.body

      if (!from_location_id || !to_location_id) {
        return res.status(400).json({
          success: false,
          message: 'Ubicación de origen y destino son requeridas'
        })
      }

      const { isAdmin, userLocations } = getUserContext(req)
      const companyId = req.user?.company_id

      const result = await transferModel.create(
        {
          from_location_id,
          to_location_id,
          notes
        },
        req.user?.id,
        userLocations,
        isAdmin,
        companyId
      )

      res.status(201).json({
        success: true,
        message: 'Transferencia creada',
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async addItem(req, res, next) {
    try {
      const { item_id, variation_id, quantity } = req.body
      const transferId = req.params.id

      if (!transferId || !item_id || quantity === undefined) {
        return res.status(400).json({
          success: false,
          message: 'ID de transferencia, producto y cantidad son requeridos'
        })
      }

      if (parseFloat(quantity) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a 0'
        })
      }

      const { isAdmin, userLocations } = getUserContext(req)
      const companyId = req.user?.company_id

      await transferModel.addItem(
        {
          transfer_id: transferId,
          item_id,
          variation_id,
          quantity
        },
        req.user?.id,
        userLocations,
        isAdmin,
        companyId
      )

      res.status(201).json({
        success: true,
        message: 'Item agregado a la transferencia'
      })
    } catch (error) {
      next(error)
    }
  }

  async removeItem(req, res, next) {
    try {
      const { id, itemId } = req.params
      const { isAdmin, userLocations } = getUserContext(req)
      const companyId = req.user?.company_id

      await transferModel.removeItem(id, itemId, userLocations, isAdmin, companyId)

      res.status(200).json({
        success: true,
        message: 'Item eliminado de la transferencia'
      })
    } catch (error) {
      next(error)
    }
  }

  async ship(req, res, next) {
    try {
      const { isAdmin, userLocations } = getUserContext(req)
      const companyId = req.user?.company_id
      await transferModel.ship(req.params.id, req.user?.id, userLocations, isAdmin, companyId)

      res.status(200).json({
        success: true,
        message: 'Transferencia enviada. Stock en tránsito en origen'
      })
    } catch (error) {
      next(error)
    }
  }

  async receive(req, res, next) {
    try {
      const { items } = req.body
      const { isAdmin, userLocations } = getUserContext(req)
      const companyId = req.user?.company_id

      await transferModel.receive(req.params.id, req.user?.id, items || [], userLocations, isAdmin, companyId)

      res.status(200).json({
        success: true,
        message: 'Transferencia recibida. Stock actualizado en destino'
      })
    } catch (error) {
      next(error)
    }
  }

  async cancel(req, res, next) {
    try {
      const { isAdmin, userLocations } = getUserContext(req)
      const companyId = req.user?.company_id
      await transferModel.cancel(req.params.id, req.user?.id, userLocations, isAdmin, companyId)

      res.status(200).json({
        success: true,
        message: 'Transferencia cancelada'
      })
    } catch (error) {
      next(error)
    }
  }
}
