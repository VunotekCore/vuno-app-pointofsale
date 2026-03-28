import { SupplierModel } from '../models/supplier.model.js'
import { SupplierRepository } from '../repository/supplier.repository.js'

const db = new SupplierRepository()
const supplierModel = new SupplierModel(db)

export class SupplierController {
  async getAll (req, res, next) {
    try {
      const { search, is_active, limit, offset } = req.query
      const filters = { search, is_active, limit, offset }
      const result = await supplierModel.getAll(filters)
      res.status(200).json({ success: true, data: result.data, total: result.total })
    } catch (error) {
      next(error)
    }
  }

  async getById (req, res, next) {
    try {
      const { id } = req.params
      const supplier = await supplierModel.getById(id)
      res.status(200).json({ success: true, data: supplier })
    } catch (error) {
      next(error)
    }
  }

  async create (req, res, next) {
    try {
      const data = req.body
      const id = await supplierModel.create(data)
      const newSupplier = await supplierModel.getById(id)
      res.status(201).json({ success: true, message: 'Proveedor creado', data: newSupplier })
    } catch (error) {
      next(error)
    }
  }

  async update (req, res, next) {
    try {
      const { id } = req.params
      const data = req.body
      await supplierModel.update(id, data)
      const updatedSupplier = await supplierModel.getById(id)
      res.status(200).json({ success: true, message: 'Proveedor actualizado', data: updatedSupplier })
    } catch (error) {
      next(error)
    }
  }

  async delete (req, res, next) {
    try {
      const { id } = req.params
      await supplierModel.delete(id)
      res.status(200).json({ success: true, message: 'Proveedor eliminado' })
    } catch (error) {
      next(error)
    }
  }

  async getActive (req, res, next) {
    try {
      const suppliers = await supplierModel.getActive()
      res.status(200).json({ success: true, data: suppliers, total: suppliers.length })
    } catch (error) {
      next(error)
    }
  }

  async getHistory (req, res, next) {
    try {
      const { id } = req.params
      const history = await supplierModel.getHistory(id)
      res.status(200).json({ success: true, data: history })
    } catch (error) {
      next(error)
    }
  }
}
