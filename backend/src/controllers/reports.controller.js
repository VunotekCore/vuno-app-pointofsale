export class ReportsController {
  constructor(reportsModel) {
    this.reportsModel = reportsModel
  }

  async getSalesReport(req, res, next) {
    try {
      const { location_id, start_date, end_date, user_id, status, limit, offset } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const result = await this.reportsModel.getSalesReport({
        location_id,
        start_date,
        end_date,
        user_id,
        status,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        isAdmin,
        userLocations
      })

      res.status(200).json({ success: true, data: result.data, total: result.total, summary: result.summary })
    } catch (error) {
      next(error)
    }
  }

  async getSalesReportDetails(req, res, next) {
    try {
      const { id } = req.params

      const result = await this.reportsModel.getSalesReportDetails(id)

      if (!result) {
        return res.status(404).json({ success: false, message: 'Venta no encontrada' })
      }

      res.status(200).json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  async getInventoryReport(req, res, next) {
    try {
      const { location_id, start_date, end_date, user_id, movement_type, limit, offset } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const result = await this.reportsModel.getInventoryReport({
        location_id,
        start_date,
        end_date,
        user_id,
        movement_type,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        isAdmin,
        userLocations
      })

      res.status(200).json({ success: true, data: result.data, total: result.total, summary: result.summary })
    } catch (error) {
      next(error)
    }
  }

  async getPurchasesReport(req, res, next) {
    try {
      const { location_id, start_date, end_date, supplier_id, status, limit, offset } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const result = await this.reportsModel.getPurchasesReport({
        location_id,
        start_date,
        end_date,
        supplier_id,
        status,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        isAdmin,
        userLocations
      })

      res.status(200).json({ success: true, data: result.data, total: result.total, summary: result.summary })
    } catch (error) {
      next(error)
    }
  }

  async getCashReport(req, res, next) {
    try {
      const { location_id, start_date, end_date, user_id, limit, offset } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const result = await this.reportsModel.getCashReport({
        location_id,
        start_date,
        end_date,
        user_id,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        isAdmin,
        userLocations
      })

      res.status(200).json({ success: true, data: result.data, total: result.total, summary: result.summary })
    } catch (error) {
      next(error)
    }
  }

  async exportSalesReport(req, res, next) {
    try {
      const { location_id, start_date, end_date, user_id, status, format } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const data = await this.reportsModel.exportSalesReport({
        location_id,
        start_date,
        end_date,
        user_id,
        status,
        isAdmin,
        userLocations
      })

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_ventas.csv')
        const headers = ['Número', 'Fecha', 'Cliente', 'Empleado', 'Ubicación', 'Subtotal', 'Descuento', 'Impuesto', 'Total', 'Estado']
        const rows = data.map(row => [
          row.sale_number,
          new Date(row.sale_date).toLocaleDateString(),
          row.customer_name || '',
          row.employee_name,
          row.location_name,
          row.subtotal,
          row.discount_amount,
          row.tax_amount,
          row.total,
          row.status
        ])
        return res.send([headers.join(','), ...rows.map(r => r.join(','))].join('\n'))
      }

      res.status(200).json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  async exportInventoryReport(req, res, next) {
    try {
      const { location_id, start_date, end_date, user_id, movement_type, format } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const data = await this.reportsModel.exportInventoryReport({
        location_id,
        start_date,
        end_date,
        user_id,
        movement_type,
        isAdmin,
        userLocations
      })

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_inventario.csv')
        const headers = ['Fecha', 'Producto', 'Código', 'Tipo', 'Cantidad', 'Cant. Anterior', 'Cant. Nueva', 'Costo Unit.', 'Costo Total', 'Ubicación', 'Usuario', 'Notas']
        const rows = data.map(row => [
          new Date(row.created_at).toLocaleDateString(),
          row.item_name,
          row.item_number,
          row.movement_type,
          row.quantity_change,
          row.quantity_before,
          row.quantity_after,
          row.unit_cost,
          row.total_cost,
          row.location_name,
          row.created_by_name,
          row.notes || ''
        ])
        return res.send([headers.join(','), ...rows.map(r => r.join(','))].join('\n'))
      }

      res.status(200).json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  async exportPurchasesReport(req, res, next) {
    try {
      const { location_id, start_date, end_date, supplier_id, status, format } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const data = await this.reportsModel.exportPurchasesReport({
        location_id,
        start_date,
        end_date,
        supplier_id,
        status,
        isAdmin,
        userLocations
      })

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_compras.csv')
        const headers = ['Fecha', 'Tipo', 'Número', 'Proveedor', 'Ubicación', 'Total', 'Estado', 'Usuario']
        const rows = data.map(row => [
          new Date(row.document_date).toLocaleDateString(),
          row.document_type,
          row.document_number,
          row.supplier_name || '',
          row.location_name,
          row.total_amount,
          row.status,
          row.created_by_name || ''
        ])
        return res.send([headers.join(','), ...rows.map(r => r.join(','))].join('\n'))
      }

      res.status(200).json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  async exportCashReport(req, res, next) {
    try {
      const { location_id, start_date, end_date, user_id, format } = req.query
      const isAdmin = req.user?.is_admin == 1
      const userLocations = req.userLocations || []

      const data = await this.reportsModel.exportCashReport({
        location_id,
        start_date,
        end_date,
        user_id,
        isAdmin,
        userLocations
      })

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=reporte_caja.csv')
        const headers = ['Fecha', 'Tipo', 'Detalle', 'Monto', 'Entrada', 'Salida', 'Diferencia', 'Estado', 'Ubicación', 'Usuario']
        const rows = data.map(row => [
          new Date(row.created_at).toLocaleDateString(),
          row.transaction_type,
          row.type || '',
          row.amount || '',
          row.amount_in || '',
          row.amount_out || '',
          row.difference || '',
          row.status || row.adjustment_status || '',
          row.location_name,
          row.user_name || ''
        ])
        return res.send([headers.join(','), ...rows.map(r => r.join(','))].join('\n'))
      }

      res.status(200).json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }
}
