import pool from '../config/database.js'

export class AdjustmentRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getAll(filters = {}) {
    const { location_id, adjustment_type, status, company_id } = filters
    
    let query = `
      SELECT 
        BIN_TO_UUID(a.id) as id,
        a.adjustment_number,
        BIN_TO_UUID(a.location_id) as location_id,
        a.adjustment_type,
        a.status,
        a.notes,
        a.total_items,
        a.total_quantity_change,
        a.is_delete,
        BIN_TO_UUID(a.created_by) as created_by,
        BIN_TO_UUID(a.updated_by) as updated_by,
        a.created_at,
        a.updated_at,
        l.name as location_name,
        l.code as location_code,
        u.username as created_by_name
      FROM inventory_adjustments a
      JOIN locations l ON a.location_id = l.id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.company_id = UUID_TO_BIN(?)
    `
    const params = [company_id]

    if (location_id) {
      query += ` AND a.location_id = UUID_TO_BIN(?)`
      params.push(location_id)
    }

    if (adjustment_type) {
      query += ` AND a.adjustment_type = ?`
      params.push(adjustment_type)
    }

    if (status) {
      query += ` AND a.status = ?`
      params.push(status)
    }

    query += ' ORDER BY a.created_at DESC'

    const rows = await this.db.query(query)
    return rows
  }

  async getById(id, companyId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(a.id) as id, a.adjustment_number, BIN_TO_UUID(a.location_id) as location_id, a.adjustment_type, a.status, a.notes, a.total_items, a.total_quantity_change, a.is_delete, BIN_TO_UUID(a.created_by) as created_by, BIN_TO_UUID(a.updated_by) as updated_by, a.created_at, a.updated_at, l.name as location_name, l.code as location_code, u.username as created_by_name
       FROM inventory_adjustments a
       JOIN locations l ON a.location_id = l.id
       LEFT JOIN users u ON a.created_by = u.id
       WHERE a.id = UUID_TO_BIN(?) AND a.company_id = UUID_TO_BIN(?) AND a.is_delete = 0`,
      [id, companyId]
    )
    return rows[0] || null
  }

  async getItems(adjustmentId, companyId = null) {
    let query = `
      SELECT 
        BIN_TO_UUID(ai.id) as id,
        BIN_TO_UUID(ai.adjustment_id) as adjustment_id,
        BIN_TO_UUID(ai.item_id) as item_id,
        BIN_TO_UUID(ai.variation_id) as variation_id,
        ai.quantity_before,
        ai.quantity_counted,
        ai.quantity_difference,
        ai.unit_cost,
        ai.reason,
        BIN_TO_UUID(ai.created_by) as created_by,
        ai.created_at,
        ai.updated_at,
        i.name as item_name,
        i.item_number,
        iv.attributes as variation_attributes,
        iv.sku as variation_sku
      FROM inventory_adjustment_items ai
      JOIN items i ON ai.item_id = i.id
      LEFT JOIN item_variations iv ON ai.variation_id = iv.id
      WHERE ai.adjustment_id = UUID_TO_BIN(?)`
    const params = [adjustmentId]
    
    if (companyId) {
      query += ' AND ai.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    query += ' ORDER BY ai.id'
    const rows = await this.db.query(query, params)
    return rows
  }

  async create(data) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const adjustmentUUID = crypto.randomUUID()
      
      await conn.query(
        `INSERT INTO inventory_adjustments 
         (id, adjustment_number, location_id, adjustment_type, status, notes, total_items, total_quantity_change, created_by, company_id)
         VALUES (UUID_TO_BIN('${adjustmentUUID}'), ?, UUID_TO_BIN('${data.location_id}'), ?, ?, ?, ?, ?, UUID_TO_BIN('${data.created_by}'), UUID_TO_BIN(?))`,
        [
          data.adjustment_number,
          data.adjustment_type,
          data.status || 'draft',
          data.notes || null,
          0,
          0,
          data.company_id
        ]
      )

      await conn.commit()
      return adjustmentUUID
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async createWithTransaction(data) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const { adjustment_number, location_id, company_id, adjustment_type, notes, created_by, item_id, variation_id, quantity, movement_type, unit_cost } = data

      const adjustmentUUID = crypto.randomUUID()
      
      await conn.query(
        `INSERT INTO inventory_adjustments 
         (id, adjustment_number, location_id, company_id, adjustment_type, status, notes, total_items, total_quantity_change, created_by)
         VALUES (UUID_TO_BIN('${adjustmentUUID}'), ?, UUID_TO_BIN('${location_id}'), UUID_TO_BIN('${company_id}'), ?, ?, ?, ?, ?, UUID_TO_BIN('${created_by}'))`,
        [
          adjustment_number,
          adjustment_type,
          'completed',
          notes || null,
          1,
          quantity
        ]
      )

      const [current] = await conn.query(
        `SELECT COALESCE(SUM(quantity), 0) as stock FROM item_quantities WHERE item_id = UUID_TO_BIN('${item_id}') ${variation_id ? "AND variation_id = UUID_TO_BIN('" + variation_id + "')" : 'AND variation_id IS NULL'} AND location_id = UUID_TO_BIN('${location_id}')`
      )

      const quantityBefore = parseFloat(current[0]?.stock || 0)
      const inputMovements = ['adjustment_in', 'found']
      const isInput = inputMovements.includes(movement_type)
      const signedQuantity = isInput ? parseFloat(quantity) : -parseFloat(quantity)
      const quantityAfter = quantityBefore + signedQuantity
      const quantityChange = signedQuantity

      const [itemData] = await conn.query(`SELECT cost_price FROM items WHERE id = UUID_TO_BIN('${item_id}')`)
      const currentItemCost = parseFloat(itemData[0]?.cost_price || 0)
      const finalUnitCost = (unit_cost !== undefined && unit_cost !== null && unit_cost !== '' && unit_cost !== 0)
        ? parseFloat(unit_cost)
        : currentItemCost
      const quantityDifference = signedQuantity
      const itemUUID = crypto.randomUUID()

      const varIdBinary = variation_id ? "UUID_TO_BIN('" + variation_id + "')" : 'NULL'
      await conn.query(
        `INSERT INTO inventory_adjustment_items 
         (id, adjustment_id, item_id, variation_id, quantity_before, quantity_counted, quantity_difference, unit_cost, reason, created_by)
         VALUES (UUID_TO_BIN('${itemUUID}'), UUID_TO_BIN('${adjustmentUUID}'), UUID_TO_BIN('${item_id}'), ${varIdBinary}, ?, ?, ?, ?, ?, UUID_TO_BIN('${created_by}'))`,
        [
          quantityBefore,
          quantityAfter,
          quantityDifference,
          finalUnitCost,
          notes || null
        ]
      )

      const [existingQty] = await conn.query(
        `SELECT id FROM item_quantities WHERE item_id = UUID_TO_BIN('${item_id}') ${variation_id ? "AND variation_id = UUID_TO_BIN('" + variation_id + "')" : 'AND variation_id IS NULL'} AND location_id = UUID_TO_BIN('${location_id}')`
      )

      if (existingQty.length > 0) {
        await conn.query(
          `UPDATE item_quantities SET quantity = ?, updated_by = UUID_TO_BIN('${created_by}') WHERE id = ?`,
          [quantityAfter, existingQty[0].id]
        )
      } else {
        const qtyUUID = crypto.randomUUID()
        await conn.query(
          `INSERT INTO item_quantities (id, item_id, variation_id, location_id, quantity, created_by) VALUES (UUID_TO_BIN('${qtyUUID}'), UUID_TO_BIN('${item_id}'), ${variation_id ? "UUID_TO_BIN('" + variation_id + "')" : 'NULL'}, UUID_TO_BIN('${location_id}'), ?, UUID_TO_BIN('${created_by}'))`,
          [quantityAfter]
        )
      }

      if (isInput && finalUnitCost !== currentItemCost && finalUnitCost > 0) {
        const currentStock = await this.getTotalStockForItem(conn, item_id)
        const totalCurrentValue = currentStock * currentItemCost
        const totalNewValue = parseFloat(quantity) * finalUnitCost
        const totalQuantity = currentStock + parseFloat(quantity)

        let averageCost = currentItemCost
        if (totalQuantity > 0) {
          averageCost = (totalCurrentValue + totalNewValue) / totalQuantity
        }
        averageCost = Math.round(averageCost * 100) / 100

        await conn.query(
          `UPDATE items SET cost_price = ? WHERE id = UUID_TO_BIN('${item_id}')`,
          [averageCost]
        )
      }

      const movementTypeMap = {
        adjustment_in: 'adjustment',
        adjustment_out: 'adjustment',
        damaged: 'damaged',
        lost: 'loss',
        found: 'found'
      }
      const dbMovementType = movementTypeMap[movement_type] || 'adjustment'

      const movementUUID = crypto.randomUUID()
      await conn.query(
        `INSERT INTO inventory_movements 
         (id, item_id, variation_id, location_id, movement_type, quantity_change, quantity_before, quantity_after, unit_cost, total_cost, reference_type, reference_id, user_id, notes)
         VALUES (UUID_TO_BIN('${movementUUID}'), UUID_TO_BIN('${item_id}'), ${variation_id ? "UUID_TO_BIN('" + variation_id + "')" : 'NULL'}, UUID_TO_BIN('${location_id}'), ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN('${adjustmentUUID}'), UUID_TO_BIN('${created_by}'), ?)`,
        [
          dbMovementType,
          quantityChange,
          quantityBefore,
          quantityAfter,
          finalUnitCost,
          Math.abs(finalUnitCost * quantityChange),
          'adjustment',
          notes || null
        ]
      )

      await conn.commit()
      return adjustmentUUID
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async getTotalStockForItem(conn, itemId) {
    const [result] = await conn.query(
      `SELECT COALESCE(SUM(quantity), 0) as total FROM item_quantities WHERE item_id = UUID_TO_BIN('${itemId}')`
    )
    return parseFloat(result[0]?.total || 0)
  }

  async addItem(data) {
    await this.db.query(
      `INSERT INTO inventory_adjustment_items 
       (adjustment_id, item_id, variation_id, quantity_before, quantity_counted, quantity_difference, unit_cost, reason, created_by)
       VALUES (UUID_TO_BIN('${data.adjustment_id}'), UUID_TO_BIN('${data.item_id}'), ${data.variation_id ? "UUID_TO_BIN('" + data.variation_id + "')" : 'NULL'}, ?, ?, ?, ?, ?, UUID_TO_BIN('${data.created_by}'))`,
      [
        data.quantity_before,
        data.quantity_counted,
        data.quantity_difference,
        data.unit_cost,
        data.reason || null
      ]
    )
  }

  async updateTotals(adjustmentId) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const [items] = await conn.query(
        `SELECT COUNT(*) as total_items, SUM(quantity_difference) as total_change FROM inventory_adjustment_items WHERE adjustment_id = UUID_TO_BIN('${adjustmentId}')`
      )

      await conn.query(
        `UPDATE inventory_adjustments SET total_items = ?, total_quantity_change = ? WHERE id = UUID_TO_BIN('${adjustmentId}')`,
        [items[0].total_items || 0, items[0].total_change || 0]
      )

      await conn.commit()
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async confirm(adjustmentId, userId) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const [adjustmentData] = await conn.query(`SELECT BIN_TO_UUID(location_id) as location_id FROM inventory_adjustments WHERE id = UUID_TO_BIN('${adjustmentId}')`)
      const locationId = adjustmentData[0]?.location_id

      const [items] = await conn.query(
        `SELECT id, adjustment_id, item_id, variation_id, quantity_before, quantity_counted, quantity_difference, unit_cost, reason, created_at FROM inventory_adjustment_items WHERE adjustment_id = UUID_TO_BIN('${adjustmentId}')`
      )

      for (const item of items) {
        let current
        if (item.variation_id === null) {
          [current] = await conn.query(
            `SELECT quantity FROM item_quantities WHERE item_id = UUID_TO_BIN('${item.item_id}') AND variation_id IS NULL AND location_id = UUID_TO_BIN('${locationId}')`
          )
        } else {
          [current] = await conn.query(
            `SELECT quantity FROM item_quantities WHERE item_id = UUID_TO_BIN('${item.item_id}') AND variation_id = UUID_TO_BIN('${item.variation_id}') AND location_id = UUID_TO_BIN('${locationId}')`
          )
        }

        const quantityBefore = current.length > 0 ? Number(current[0].quantity) : 0
        const quantityAfter = Number(quantityBefore) + parseFloat(item.quantity_difference)

        if (current.length > 0) {
          if (item.variation_id === null) {
            await conn.query(
              `UPDATE item_quantities SET quantity = ?, updated_by = UUID_TO_BIN('${userId}') WHERE item_id = UUID_TO_BIN('${item.item_id}') AND variation_id IS NULL AND location_id = UUID_TO_BIN('${locationId}')`,
              [quantityAfter]
            )
          } else {
            await conn.query(
              `UPDATE item_quantities SET quantity = ?, updated_by = UUID_TO_BIN('${userId}') WHERE item_id = UUID_TO_BIN('${item.item_id}') AND variation_id = UUID_TO_BIN('${item.variation_id}') AND location_id = UUID_TO_BIN('${locationId}')`,
              [quantityAfter]
            )
          }
        } else {
          const qtyUUID = crypto.randomUUID()
          await conn.query(
            `INSERT INTO item_quantities (id, item_id, variation_id, location_id, quantity, created_by) VALUES (UUID_TO_BIN('${qtyUUID}'), UUID_TO_BIN('${item.item_id}'), ${item.variation_id ? "UUID_TO_BIN('" + item.variation_id + "')" : 'NULL'}, UUID_TO_BIN('${locationId}'), ?, UUID_TO_BIN('${userId}'))`,
            [quantityAfter]
          )
        }

        const [adjustment] = await conn.query(`SELECT id, adjustment_number, BIN_TO_UUID(location_id) as location_id, adjustment_type, status, notes, total_items, total_quantity_change, created_by, created_at, updated_at FROM inventory_adjustments WHERE id = UUID_TO_BIN('${adjustmentId}')`)

        const movementTypeMap = {
          count: 'adjustment',
          damage: 'damaged',
          theft: 'lost',
          loss: 'lost',
          found: 'found',
          correction: 'adjustment'
        }
        const movementType = movementTypeMap[adjustment[0].adjustment_type] || 'adjustment'

        const movementUUID = crypto.randomUUID()
        await conn.query(
          `INSERT INTO inventory_movements 
           (id, item_id, variation_id, location_id, movement_type, quantity_change, quantity_before, quantity_after, unit_cost, total_cost, reference_type, reference_id, user_id, notes)
           VALUES (UUID_TO_BIN('${movementUUID}'), UUID_TO_BIN('${item.item_id}'), ${item.variation_id ? "UUID_TO_BIN('" + item.variation_id + "')" : 'NULL'}, UUID_TO_BIN('${adjustment[0].location_id}'), ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN('${userId}'), ?)`,
          [
            movementType,
            item.quantity_difference,
            quantityBefore,
            quantityAfter,
            item.unit_cost,
            Math.abs(item.unit_cost * item.quantity_difference),
            'adjustment',
            adjustmentId,
            adjustment[0].notes
          ]
        )
      }

      await conn.query(
        `UPDATE inventory_adjustments SET status = ?, updated_by = UUID_TO_BIN('${userId}') WHERE id = UUID_TO_BIN('${adjustmentId}')`,
        ['completed']
      )

      await conn.commit()
      return true
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async cancel(adjustmentId, userId, companyId = null) {
    let query = 'UPDATE inventory_adjustments SET status = ?, updated_by = UUID_TO_BIN(?) WHERE id = UUID_TO_BIN(?)'
    const params = ['cancelled', userId, adjustmentId]
    
    if (companyId) {
      query += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    await this.db.query(query, params)
  }

  async delete(adjustmentId, companyId = null) {
    let query = 'UPDATE inventory_adjustments SET is_delete = 1 WHERE id = UUID_TO_BIN(?)'
    const params = [adjustmentId]
    
    if (companyId) {
      query += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    await this.db.query(query, params)
  }

  async deleteItem(adjustmentId, itemId, companyId = null) {
    let query = 'DELETE FROM inventory_adjustment_items WHERE adjustment_id = UUID_TO_BIN(?) AND item_id = UUID_TO_BIN(?)'
    const params = [adjustmentId, itemId]
    
    if (companyId) {
      query += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    await this.db.query(query, params)
  }

  async getNextNumber(companyId = null) {
    const whereClause = companyId ? 'WHERE company_id = UUID_TO_BIN(?)' : ''
    const params = companyId ? [companyId] : []
    
    const rows = await this.db.query(
      `SELECT adjustment_number FROM inventory_adjustments ${whereClause} ORDER BY id DESC LIMIT 1`,
      params
    )
    
    if (rows.length === 0) {
      return 'ADJ-0001'
    }
    
    const lastNumber = rows[0].adjustment_number
    const num = parseInt(lastNumber.split('-')[1]) + 1
    return `ADJ-${num.toString().padStart(4, '0')}`
  }

  async generateUniqueNumber(companyId = null) {
    const maxNum = 9999
    
    for (let num = 1; num <= maxNum; num++) {
      const number = `ADJ-${num.toString().padStart(4, '0')}`
      let query = 'SELECT id FROM inventory_adjustments WHERE adjustment_number = ?'
      const params = [number]
      
      if (companyId) {
        query += ' AND company_id = UUID_TO_BIN(?)'
        params.push(companyId)
      }
      
      const existing = await this.db.query(query, params)
      
      if (existing.length === 0) {
        return number
      }
    }
    
    throw new Error('No se pudo generar un número único de ajuste')
  }
}
