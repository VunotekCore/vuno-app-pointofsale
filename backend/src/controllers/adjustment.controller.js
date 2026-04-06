import { AdjustmentModel } from '../models/adjustment.model.js'
import { AdjustmentRepository } from '../repository/adjustment.repository.js'
import { InventoryRepository } from '../repository/inventory.repository.js'
import { ItemsRepository } from '../repository/items.repository.js'
import pool from '../config/database.js'

const adjustmentRepo = new AdjustmentRepository(pool)
const inventoryRepo = new InventoryRepository(pool)
const itemsRepo = new ItemsRepository(pool)
const adjustmentModel = new AdjustmentModel(adjustmentRepo, inventoryRepo, itemsRepo)

export class AdjustmentController {
  async getAll (req, res, next) {
    try {
      const companyId = req.user?.company_id
      const filters = {
        location_id: req.query.location_id,
        adjustment_type: req.query.type,
        status: req.query.status,
        company_id: companyId
      }
      const adjustments = await adjustmentModel.getAll(filters)
      res.status(200).json({ success: true, data: adjustments })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const adjustment = await adjustmentModel.getById(req.params.id)
      res.status(200).json({ success: true, data: adjustment })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const { location_id, adjustment_type, notes } = req.body
      const companyId = req.user?.company_id
      
      if (!location_id || !adjustment_type) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ubicación y tipo de ajuste son requeridos' 
        })
      }

      const id = await adjustmentModel.create({
        location_id,
        adjustment_type,
        notes
      }, req.user?.id || 1, companyId)

      res.status(201).json({ 
        success: true, 
        message: 'Ajuste creado', 
        data: { id } 
      })
    } catch (error) {
      next(error)
    }
  }

  async addItem (req, res, next) {
    try {
      const { adjustment_id, item_id, variation_id, quantity_counted, unit_cost, reason } = req.body

      if (!adjustment_id || !item_id || quantity_counted === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: 'ID de ajuste, producto y cantidad son requeridos' 
        })
      }

      if (parseFloat(quantity_counted) < 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'La cantidad no puede ser negativa' 
        })
      }

      await adjustmentModel.addItem({
        adjustment_id,
        item_id,
        variation_id,
        quantity_counted,
        unit_cost,
        reason
      }, req.user?.id || 1)

      res.status(201).json({ 
        success: true, 
        message: 'Item agregado al ajuste' 
      })
    } catch (error) {
      next(error)
    }
  }

  async removeItem (req, res, next) {
    try {
      const { id, itemId } = req.params
      
      await adjustmentModel.removeItem(id, itemId)

      res.status(200).json({ 
        success: true, 
        message: 'Item eliminado del ajuste' 
      })
    } catch (error) {
      next(error)
    }
  }

  async confirm (req, res, next) {
    try {
      await adjustmentModel.confirm(parseInt(req.params.id), req.user?.id || 1)
      
      res.status(200).json({ 
        success: true, 
        message: 'Ajuste confirmado y stock actualizado' 
      })
    } catch (error) {
      next(error)
    }
  }

  async cancel (req, res, next) {
    try {
      await adjustmentModel.cancel(parseInt(req.params.id), req.user?.id || 1)
      
      res.status(200).json({ 
        success: true, 
        message: 'Ajuste cancelado' 
      })
    } catch (error) {
      next(error)
    }
  }

  async getItemStock (req, res, next) {
    try {
      const { itemId } = req.params
      const { adjustment_id, variation_id } = req.query
      
      const stock = await adjustmentModel.getItemStock(
        itemId, 
        variation_id || null,
        adjustment_id || null
      )
      
      res.status(200).json({ 
        success: true, 
        data: { stock } 
      })
    } catch (error) {
      next(error)
    }
  }

  async createWithItem (req, res, next) {
    try {
      const { location_id, adjustment_type, notes, item_id, variation_id, quantity, movement_type, unit_cost } = req.body
      const companyId = req.user?.company_id
      
      if (!location_id || !adjustment_type || !item_id || !quantity) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ubicación, tipo, producto y cantidad son requeridos' 
        })
      }

      const result = await adjustmentModel.createWithTransaction({
        location_id,
        adjustment_type,
        notes,
        item_id,
        variation_id,
        quantity,
        movement_type,
        unit_cost,
        userId: req.user?.id || req.userId
      }, companyId)

      res.status(201).json({ 
        success: true, 
        message: 'Ajuste creado y aplicado', 
        data: result 
      })
    } catch (error) {
      next(error)
    }
  }
}
