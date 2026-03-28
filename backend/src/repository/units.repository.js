import pool from '../config/database.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'

export class UnitsRepository {
  constructor (db = pool) {
    this.db = db
  }

  async getAll (activeOnly = true) {
    let query = `
      SELECT 
        BIN_TO_UUID(id) as id,
        name,
        abbreviation,
        type,
        conversion_factor,
        is_active
      FROM units_of_measure
    `
    
    if (activeOnly) {
      query += ' WHERE is_active = 1'
    }
    
    query += ' ORDER BY type, name'
    
    return await this.db.query(query)
  }

  async getById (id) {
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(id) as id,
        name,
        abbreviation,
        type,
        conversion_factor,
        is_active
      FROM units_of_measure
      WHERE id = UUID_TO_BIN(?)
    `, [id])
    
    if (!rows || rows.length === 0) {
      throw new NotFoundError(`Unidad con id ${id} no encontrada`)
    }
    
    return rows[0]
  }

  async getItemUnits (itemId) {
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(iu.id) as id,
        BIN_TO_UUID(iu.item_id) as item_id,
        BIN_TO_UUID(iu.unit_id) as unit_id,
        iu.is_default,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation,
        u.type as unit_type,
        u.conversion_factor
      FROM item_units iu
      JOIN units_of_measure u ON iu.unit_id = u.id
      WHERE iu.item_id = UUID_TO_BIN(?) AND iu.is_active = 1
      ORDER BY iu.is_default DESC, u.name
    `, [itemId])
    
    return rows
  }

  async getItemUnitById (itemUnitId) {
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(iu.id) as id,
        BIN_TO_UUID(iu.item_id) as item_id,
        BIN_TO_UUID(iu.unit_id) as unit_id,
        iu.is_default,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation,
        u.conversion_factor
      FROM item_units iu
      JOIN units_of_measure u ON iu.unit_id = u.id
      WHERE iu.id = UUID_TO_BIN(?)
    `, [itemUnitId])
    
    if (!rows || rows.length === 0) {
      throw new NotFoundError(`Unidad de producto no encontrada`)
    }
    
    return rows[0]
  }

  async getDefaultUnit (itemId) {
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(iu.id) as id,
        BIN_TO_UUID(iu.item_id) as item_id,
        BIN_TO_UUID(iu.unit_id) as unit_id,
        iu.is_default,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation,
        u.conversion_factor
      FROM item_units iu
      JOIN units_of_measure u ON iu.unit_id = u.id
      WHERE iu.item_id = UUID_TO_BIN(?) AND iu.is_default = 1 AND iu.is_active = 1
    `, [itemId])
    
    if (rows.length === 0) {
      const allUnits = await this.getItemUnits(itemId)
      return allUnits[0] || null
    }
    
    return rows[0]
  }

  async createItemUnit (data) {
    const { item_id, unit_id, is_default } = data
    
    if (is_default) {
      await this.db.query(`
        UPDATE item_units SET is_default = 0 WHERE item_id = UUID_TO_BIN(?)
      `, [item_id])
    }
    
    const result = await this.db.query(`
      INSERT INTO item_units (id, item_id, unit_id, is_default)
      VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), ?)
    `, [item_id, unit_id, is_default ? 1 : 0])
    
    return result.insertId
  }

  async updateItemUnit (id, data) {
    const existing = await this.getItemUnitById(id)
    
    const { is_default } = data
    
    if (is_default && !existing.is_default) {
      await this.db.query(`
        UPDATE item_units SET is_default = 0 WHERE item_id = UUID_TO_BIN(?)
      `, [existing.item_id])
    }
    
    if (is_default !== undefined) {
      await this.db.query(
        'UPDATE item_units SET is_default = ? WHERE id = UUID_TO_BIN(?)',
        [is_default ? 1 : 0, id]
      )
    }
    
    return 1
  }

  async deleteItemUnit (id) {
    const existing = await this.getItemUnitById(id)
    
    if (existing.is_default) {
      const remaining = await this.getItemUnits(existing.item_id)
      const otherUnits = remaining.filter(u => u.id !== existing.id)
      
      if (otherUnits.length > 0) {
        await this.updateItemUnit(otherUnits[0].id, { is_default: true })
      }
    }
    
    await this.db.query(`
      UPDATE item_units SET is_active = 0 WHERE id = UUID_TO_BIN(?)
    `, [id])
    
    return 1
  }
}
