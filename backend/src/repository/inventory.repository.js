import pool from '../config/database.js'
import { NotFoundError } from '../errors/NotFoundError.js'

export class InventoryRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getStockByLocation(filters = {}) {
    const { locationId, userLocations, isAdmin, search, limit, offset, companyId } = filters
    const params = []
    const countParams = []

    let query = `
      SELECT
        BIN_TO_UUID(iq.id) as id,
        BIN_TO_UUID(iq.item_id) as item_id,
        BIN_TO_UUID(iq.variation_id) as variation_id,
        BIN_TO_UUID(iq.location_id) as location_id,
        iq.quantity,
        iq.quantity_reserved,
        iq.quantity_in_transit,
        iq.updated_at,
        BIN_TO_UUID(iq.created_by) as created_by,
        i.name as item_name,
        i.item_number,
        i.is_serialized,
        l.name as location_name,
        l.code as location_code,
        iv.attributes,
        iv.sku as variation_sku
      FROM item_quantities iq
      JOIN items i ON iq.item_id = i.id
      JOIN locations l ON iq.location_id = l.id
      LEFT JOIN item_variations iv ON iq.variation_id = iv.id
      WHERE 1=1
    `

    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
      countParams.push(companyId)
    }

    if (locationId) {
      query += ' AND iq.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
      countParams.push(locationId)
    } else if (!isAdmin && userLocations && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND iq.location_id IN (${placeholders})`
      params.push(...userLocations)
      countParams.push(...userLocations)
    }

    if (search) {
      query += ' AND (i.name LIKE ? OR i.item_number LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
      countParams.push(searchTerm, searchTerm)
    }

    const countQuery = `SELECT COUNT(*) as total FROM item_quantities iq
      JOIN items i ON iq.item_id = i.id
      JOIN locations l ON iq.location_id = l.id
      WHERE 1=1`
    
    let countWhere = ''
    
    if (companyId) {
      countWhere += ' AND i.company_id = UUID_TO_BIN(?)'
    }
    
    if (locationId) {
      countWhere += ' AND iq.location_id = UUID_TO_BIN(?)'
    } else if (!isAdmin && userLocations && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      countWhere += ` AND iq.location_id IN (${placeholders})`
    }
    
    if (search) {
      countWhere += ' AND (i.name LIKE ? OR i.item_number LIKE ?)'
    }

    const totalResult = await this.db.query(countQuery + countWhere, countParams)
    const total = totalResult[0]?.total || 0

    query += ' ORDER BY i.name, l.name'

    if (limit) {
      query += ' LIMIT ?'
      params.push(parseInt(limit))
      if (offset) {
        query += ' OFFSET ?'
        params.push(parseInt(offset))
      }
    }

    const rows = await this.db.query(query, params)
    return { data: rows, total }
  }

  async getTotalStock(itemId, variationId = null, locationId = null) {
    let query = 'SELECT COALESCE(SUM(quantity), 0) as total FROM item_quantities WHERE item_id = UUID_TO_BIN(\'' + itemId + '\')'

    if (variationId) {
      query += ' AND variation_id = UUID_TO_BIN(\'' + variationId + '\')'
    } else {
      query += ' AND variation_id IS NULL'
    }

    if (locationId) {
      query += ' AND location_id = UUID_TO_BIN(\'' + locationId + '\')'
    }

    const rows = await this.db.query(query)
    return parseFloat(rows[0]?.total || 0)
  }

  async updateStock(itemId, variationId, locationId, quantity, createdBy, isEntry = true) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const varId = variationId || null
      const signedQuantity = isEntry ? Math.abs(parseFloat(quantity)) : -Math.abs(parseFloat(quantity))

      let queryStock
      if (varId === null) {
        queryStock = 'SELECT quantity FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND variation_id IS NULL AND location_id = UUID_TO_BIN(?)'
      } else {
        queryStock = 'SELECT quantity FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)'
      }

      const stockParams = varId === null ? [itemId, locationId] : [itemId, varId, locationId]
      const currentStock = await conn.query(queryStock, stockParams)

      const quantityBefore = currentStock.length > 0 ? Number(currentStock[0].quantity) : 0
      const quantityAfter = Number(quantityBefore) + signedQuantity

      if (quantityAfter < 0) {
        throw new Error(`Stock insuficiente: actual=${quantityBefore}, cambio=${signedQuantity}, resultado=${quantityAfter}`)
      }

      if (currentStock.length > 0) {
        if (varId === null) {
          await conn.query(
            'UPDATE item_quantities SET quantity = ?, updated_by = UUID_TO_BIN(?) WHERE item_id = UUID_TO_BIN(?) AND variation_id IS NULL AND location_id = UUID_TO_BIN(?)',
            [quantityAfter, createdBy, itemId, locationId]
          )
        } else {
          await conn.query(
            'UPDATE item_quantities SET quantity = ?, updated_by = UUID_TO_BIN(?) WHERE item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
            [quantityAfter, createdBy, itemId, varId, locationId]
          )
        }
      } else {
        const qtyUUID = crypto.randomUUID()
        const varIdBin = varId ? `UUID_TO_BIN('${varId}')` : 'NULL'
        await conn.query(
          'INSERT INTO item_quantities (id, item_id, variation_id, location_id, quantity, created_by) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, UUID_TO_BIN(?), ?, UUID_TO_BIN(?))',
          [qtyUUID, itemId, varIdBin, locationId, quantityAfter, createdBy]
        )
      }

      await conn.commit()
      return { quantityBefore, quantityAfter, signedQuantity }
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async getMovements(itemId = null, locationId = null, limit = 100, userLocations = [], isAdmin = false, companyId = null) {
    let query = `
      SELECT
        BIN_TO_UUID(im.id) as id,
        BIN_TO_UUID(im.item_id) as item_id,
        BIN_TO_UUID(im.variation_id) as variation_id,
        BIN_TO_UUID(im.location_id) as location_id,
        im.movement_type,
        im.quantity_change,
        im.quantity_before,
        im.quantity_after,
        im.unit_cost,
        im.total_cost,
        im.reference_type,
        im.reference_id,
        im.serial_numbers,
        BIN_TO_UUID(im.user_id) as user_id,
        im.notes,
        im.created_at,
        i.name as item_name,
        i.item_number,
        l.name as location_name,
        l.code as location_code,
        iv.attributes as variation_attributes
      FROM inventory_movements im
      JOIN items i ON im.item_id = i.id
      JOIN locations l ON im.location_id = l.id
      LEFT JOIN item_variations iv ON im.variation_id = iv.id
      WHERE 1=1
    `
    const params = []

    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    if (itemId) {
      query += ' AND im.item_id = UUID_TO_BIN(?)'
      params.push(itemId)
    }
    if (locationId) {
      query += ' AND im.location_id = UUID_TO_BIN(?)'
      params.push(locationId)
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND im.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ' ORDER BY im.created_at DESC LIMIT ?'
    params.push(parseInt(limit))

    const rows = await this.db.query(query, params)
    return rows
  }

  async createMovement(data) {
    const {
      item_id,
      variation_id,
      location_id,
      movement_type,
      quantity,
      quantity_before,
      quantity_after,
      unit_cost,
      total_cost,
      reference_type,
      reference_id,
      serial_numbers,
      user_id,
      notes
    } = data

    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const movementUUID = crypto.randomUUID()
      const varIdBin = variation_id ? `UUID_TO_BIN('${variation_id}')` : 'NULL'
      
      const columns = 'id, item_id, variation_id, location_id, movement_type, quantity_change, quantity_before, quantity_after, unit_cost, total_cost, reference_type, reference_id, serial_numbers, user_id, notes'
      const values = `UUID_TO_BIN('${movementUUID}'), UUID_TO_BIN('${item_id}'), ${varIdBin}, UUID_TO_BIN('${location_id}'), '${movement_type}', ${quantity}, ${quantity_before}, ${quantity_after}, ${unit_cost || 0}, ${total_cost || 0}, ${reference_type ? `'${reference_type}'` : 'NULL'}, ${reference_id ? `UUID_TO_BIN('${reference_id}')` : 'NULL'}, ${serial_numbers ? `'${serial_numbers}'` : 'NULL'}, UUID_TO_BIN('${user_id}'), ${notes ? `'${notes}'` : 'NULL'}`
      
      const result = await conn.query(
        `INSERT INTO inventory_movements (${columns}) VALUES (${values})`
      )

      await conn.commit()
      return result.insertId
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async getSerials(itemId = null, locationId = null, status = null, userLocations = [], isAdmin = false) {
    let query = `
      SELECT
        BIN_TO_UUID(srs.id) as id,
        BIN_TO_UUID(srs.item_id) as item_id,
        BIN_TO_UUID(srs.variation_id) as variation_id,
        BIN_TO_UUID(srs.location_id) as location_id,
        srs.serial_number,
        srs.status,
        srs.purchase_date,
        srs.warranty_expiry,
        srs.notes,
        srs.created_at,
        srs.updated_at,
        i.name as item_name,
        i.item_number,
        l.name as location_name,
        l.code as location_code,
        iv.attributes as variation_attributes
      FROM item_serials srs
      JOIN items i ON srs.item_id = i.id
      JOIN locations l ON srs.location_id = l.id
      LEFT JOIN item_variations iv ON srs.variation_id = iv.id
      WHERE 1=1
    `

    if (itemId) {
      query += ` AND srs.item_id = UUID_TO_BIN('${itemId}')`
    }
    if (locationId) {
      query += ` AND srs.location_id = UUID_TO_BIN('${locationId}')`
    } else if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(id => `'${id}'`).join(',')
      query += ` AND srs.location_id IN (${placeholders})`
    }
    if (status) {
      query += ` AND srs.status = '${status}'`
    }

    query += ' ORDER BY srs.created_at DESC'

    const rows = await this.db.query(query)
    return rows
  }

  async getLowStock(userLocations = [], isAdmin = false, companyId = null) {
    let query = `
      SELECT
        BIN_TO_UUID(i.id) as id,
        i.item_number,
        i.name,
        i.reorder_level,
        COALESCE(SUM(iq.quantity), 0) as total_quantity,
        c.name as category_name
      FROM items i
      LEFT JOIN item_quantities iq ON i.id = iq.item_id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.status = 'active' AND i.is_service = 0
    `
    const params = []

    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND iq.location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ` GROUP BY i.id
      HAVING COALESCE(SUM(iq.quantity), 0) <= i.reorder_level OR i.reorder_level = 0
      ORDER BY total_quantity ASC`

    const rows = await this.db.query(query, params)
    return rows
  }

  async getStockInTransit(locationIds = [], isAdmin = false, companyId = null) {
    let query = `
      SELECT 
        BIN_TO_UUID(iq.id) as id,
        BIN_TO_UUID(iq.item_id) as item_id,
        BIN_TO_UUID(iq.variation_id) as variation_id,
        BIN_TO_UUID(iq.location_id) as location_id,
        i.id as item_id,
        i.name as item_name,
        i.item_number,
        iv.attributes as variation_attributes,
        iv.sku as variation_sku,
        l.name as location_name,
        l.code as location_code,
        iq.quantity_in_transit
      FROM item_quantities iq
      JOIN items i ON iq.item_id = i.id
      JOIN locations l ON iq.location_id = l.id
      LEFT JOIN item_variations iv ON iq.variation_id = iv.id
      WHERE iq.quantity_in_transit > 0
    `
    const params = []

    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }

    if (!isAdmin && locationIds.length > 0) {
      const placeholders = locationIds.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND iq.location_id IN (${placeholders})`
      params.push(...locationIds)
    }

    query += ' ORDER BY l.name, i.name'

    const rows = await this.db.query(query, params)
    return rows
  }
}
