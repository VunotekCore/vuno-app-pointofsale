export class PurchaseOrderController {
  constructor(poModel) {
    this.poModel = poModel
  }

  async getAll (req, res, next) {
    try {
      const { status, supplier_id, location_id, search, limit, offset } = req.query
      const filters = { status, supplier_id, location_id, search, limit, offset }
      const result = await this.poModel.getAll(filters)
      res.status(200).json({ success: true, data: result.data, total: result.total })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const { id } = req.params
      const order = await this.poModel.getById(id)
      res.status(200).json({ success: true, data: order })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const data = req.body
      const userId = req.user?.id || req.user?.user_id || null
      const id = await this.poModel.create(data, userId)
      const newOrder = await this.poModel.getById(id)
      res.status(201).json({ success: true, message: 'Orden de compra creada', data: newOrder })
    } catch (error) {
      next(error)
    }
  }

  async update (req, res, next) {
    try {
      const { id } = req.params
      const data = req.body
      await this.poModel.update(id, data)
      const updatedOrder = await this.poModel.getById(id)
      res.status(200).json({ success: true, message: 'Orden de compra actualizada', data: updatedOrder })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      const { id } = req.params
      await this.poModel.delete(id)
      res.status(200).json({ success: true, message: 'Orden de compra eliminada' })
    } catch (error) {
      next(error)
    }
  }

  async generateAuto (req, res, next) {
    try {
      const { location_id } = req.body

      const items = await this.poModel.getPendingReorderItems(location_id)

      if (items.length === 0) {
        return res.status(200).json({ 
          success: true, 
          message: 'No hay items con stock bajo para generar órdenes',
          data: [],
          total: 0
        })
      }

      const itemsBySupplier = {}
      for (const item of items) {
        const supplierId = item.preferred_supplier_id || item.supplier_id
        if (!supplierId) continue
        
        if (!itemsBySupplier[supplierId]) {
          itemsBySupplier[supplierId] = {
            supplier_id: supplierId,
            supplier_name: item.supplier_name,
            items: []
          }
        }
        
        itemsBySupplier[supplierId].items.push({
          item_id: item.item_id,
          quantity_ordered: item.reorder_quantity || 1,
          cost_price: item.cost_price
        })
      }

      const createdOrders = []
      const userId = req.user?.id || req.user?.user_id || null

      for (const supplierKey in itemsBySupplier) {
        const group = itemsBySupplier[supplierKey]
        const orderId = await this.poModel.create({
          supplier_id: group.supplier_id,
          location_id: location_id,
          notes: 'Orden generada automáticamente por nivel de reorder',
          items: group.items
        }, userId)

        const newOrder = await this.poModel.getById(orderId)
        createdOrders.push(newOrder)
      }

      res.status(201).json({ 
        success: true, 
        message: `${createdOrders.length} órdenes de compra generadas`,
        data: createdOrders,
        total: createdOrders.length
      })
    } catch (error) {
      next(error)
    }
  }
}
