import pool from '../config/database.js'

export class TransferRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getAll(filters = {}) {
    let query = `
      SELECT 
        BIN_TO_UUID(t.id) as id,
        t.transfer_number,
        BIN_TO_UUID(t.from_location_id) as from_location_id,
        BIN_TO_UUID(t.to_location_id) as to_location_id,
        t.status,
        t.notes,
        t.total_items,
        t.is_delete,
        BIN_TO_UUID(t.created_by) as created_by,
        BIN_TO_UUID(t.updated_by) as updated_by,
        t.created_at,
        t.updated_at,
        fl.name as from_location_name,
        fl.code as from_location_code,
        tl.name as to_location_name,
        tl.code as to_location_code,
        u.username as created_by_name,
        u2.username as updated_by_name
      FROM inventory_transfers t
      JOIN locations fl ON t.from_location_id = fl.id
      JOIN locations tl ON t.to_location_id = tl.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN users u2 ON t.updated_by = u2.id
      WHERE t.is_delete = 0
    `
    const params = []

    if (filters.user_locations && filters.user_locations.length > 0) {
      const placeholders = filters.user_locations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND (t.from_location_id IN (${placeholders}) OR t.to_location_id IN (${placeholders}))`
      params.push(...filters.user_locations, ...filters.user_locations)
    }

    if (filters.from_location_id) {
      query += ' AND t.from_location_id = UUID_TO_BIN(?)'
      params.push(filters.from_location_id)
    }

    if (filters.to_location_id) {
      query += ' AND t.to_location_id = UUID_TO_BIN(?)'
      params.push(filters.to_location_id)
    }

    if (filters.status) {
      query += ' AND t.status = ?'
      params.push(filters.status)
    }

    if (filters.search) {
      query += ' AND (t.transfer_number LIKE ? OR fl.name LIKE ? OR tl.name LIKE ?)'
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    const countQuery = `SELECT COUNT(*) as total FROM inventory_transfers t
      JOIN locations fl ON t.from_location_id = fl.id
      JOIN locations tl ON t.to_location_id = tl.id
      WHERE t.is_delete = 0`
    
    let countWhere = ''
    if (filters.user_locations && filters.user_locations.length > 0) {
      const placeholders = filters.user_locations.map(() => 'UUID_TO_BIN(?)').join(',')
      countWhere += ` AND (t.from_location_id IN (${placeholders}) OR t.to_location_id IN (${placeholders}))`
    }
    if (filters.from_location_id) countWhere += ' AND t.from_location_id = UUID_TO_BIN(?)'
    if (filters.to_location_id) countWhere += ' AND t.to_location_id = UUID_TO_BIN(?)'
    if (filters.status) countWhere += ' AND t.status = ?'
    if (filters.search) countWhere += ' AND (t.transfer_number LIKE ? OR fl.name LIKE ? OR tl.name LIKE ?)'
    
    const countParams = []
    if (filters.user_locations && filters.user_locations.length > 0) {
      countParams.push(...filters.user_locations, ...filters.user_locations)
    }
    if (filters.from_location_id) countParams.push(filters.from_location_id)
    if (filters.to_location_id) countParams.push(filters.to_location_id)
    if (filters.status) countParams.push(filters.status)
    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      countParams.push(searchTerm, searchTerm, searchTerm)
    }

    const finalCountQuery = countQuery + countWhere
    const countResult = await this.db.query(finalCountQuery, countParams)
    const total = countResult[0]?.total || 0

    query += ' ORDER BY t.created_at DESC'

    if (filters.limit) {
      query += ' LIMIT ?'
      params.push(parseInt(filters.limit))
      
      if (filters.offset) {
        query += ' OFFSET ?'
        params.push(parseInt(filters.offset))
      }
    }

    const rows = await this.db.query(query, params)
    return { data: rows, total }
  }

  async getPendingReceipt(userLocations = [], isAdmin = false) {
    let query = `
      SELECT 
        BIN_TO_UUID(t.id) as id,
        t.transfer_number,
        BIN_TO_UUID(t.from_location_id) as from_location_id,
        BIN_TO_UUID(t.to_location_id) as to_location_id,
        t.status,
        t.notes,
        t.total_items,
        t.is_delete,
        BIN_TO_UUID(t.created_by) as created_by,
        BIN_TO_UUID(t.updated_by) as updated_by,
        t.created_at,
        t.updated_at,
        fl.name as from_location_name,
        fl.code as from_location_code,
        tl.name as to_location_name,
        tl.code as to_location_code,
        u.username as created_by_name,
        u2.username as updated_by_name
      FROM inventory_transfers t
      JOIN locations fl ON t.from_location_id = fl.id
      JOIN locations tl ON t.to_location_id = tl.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN users u2 ON t.updated_by = u2.id
      WHERE t.is_delete = 0 AND t.status = 'in_transit'
    `
    const params = []

    if (!isAdmin && userLocations.length > 0) {
      const placeholders = userLocations.map(() => 'UUID_TO_BIN(?)').join(',')
      query += ` AND t.to_location_id IN (${placeholders})`
      params.push(...userLocations)
    }

    query += ' ORDER BY t.updated_at ASC'

    const rows = await this.db.query(query, params)
    return rows
  }

  async getById(id) {
    const rows = await this.db.query(
      `SELECT 
        BIN_TO_UUID(t.id) as id,
        t.transfer_number,
        BIN_TO_UUID(t.from_location_id) as from_location_id,
        BIN_TO_UUID(t.to_location_id) as to_location_id,
        t.status,
        t.notes,
        t.total_items,
        t.is_delete,
        BIN_TO_UUID(t.created_by) as created_by,
        BIN_TO_UUID(t.updated_by) as updated_by,
        t.created_at,
        t.updated_at,
        fl.name as from_location_name,
        fl.code as from_location_code,
        tl.name as to_location_name,
        tl.code as to_location_code,
        u.username as created_by_name,
        u2.username as updated_by_name
       FROM inventory_transfers t
       JOIN locations fl ON t.from_location_id = fl.id
       JOIN locations tl ON t.to_location_id = tl.id
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN users u2 ON t.updated_by = u2.id
       WHERE t.id = UUID_TO_BIN(?) AND t.is_delete = 0`,
      [id]
    )
    return rows[0] || null
  }

  async getItems(transferId) {
    const rows = await this.db.query(
      `SELECT 
        BIN_TO_UUID(ti.id) as id,
        BIN_TO_UUID(ti.transfer_id) as transfer_id,
        BIN_TO_UUID(ti.item_id) as item_id,
        BIN_TO_UUID(ti.variation_id) as variation_id,
        ti.quantity,
        ti.quantity_received,
        ti.status,
        ti.created_at,
        ti.updated_at,
        i.name as item_name,
        i.item_number,
        i.is_serialized,
        iv.attributes as variation_attributes,
        iv.sku as variation_sku
      FROM inventory_transfer_items ti
      JOIN items i ON ti.item_id = i.id
      LEFT JOIN item_variations iv ON ti.variation_id = iv.id
      WHERE ti.transfer_id = UUID_TO_BIN(?)
      ORDER BY ti.id`,
      [transferId]
    )
    return rows
  }

  async create(data) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const transferUUID = crypto.randomUUID()

      const [result] = await conn.query(
        `INSERT INTO inventory_transfers 
         (id, transfer_number, from_location_id, to_location_id, status, notes, total_items, created_by)
          VALUES (UUID_TO_BIN('${transferUUID}'), ?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, UUID_TO_BIN(?))`,
        [
          data.transfer_number,
          data.from_location_id,
          data.to_location_id,
          'pending',
          data.notes || null,
          0,
          data.created_by
        ]
      )

      await conn.commit()
      return transferUUID
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async addItem(data) {
    const variationId = data.variation_id || null
    
    let existing
    if (variationId === null) {
      existing = await this.db.query(
        `SELECT id, quantity FROM inventory_transfer_items 
         WHERE transfer_id = UUID_TO_BIN(?) AND item_id = UUID_TO_BIN(?) AND variation_id IS NULL`,
        [data.transfer_id, data.item_id]
      )
    } else {
      existing = await this.db.query(
        `SELECT id, quantity FROM inventory_transfer_items 
         WHERE transfer_id = UUID_TO_BIN(?) AND item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?)`,
        [data.transfer_id, data.item_id, variationId]
      )
    }

    if (existing.length > 0) {
      const newQuantity = parseFloat(existing[0].quantity) + parseFloat(data.quantity)
      await this.db.query(
        'UPDATE inventory_transfer_items SET quantity = ? WHERE id = ?',
        [newQuantity, existing[0].id]
      )
    } else {
      const itemUUID = crypto.randomUUID()
      await this.db.query(
        `INSERT INTO inventory_transfer_items 
         (id, transfer_id, item_id, variation_id, quantity, status)
         VALUES (UUID_TO_BIN('${itemUUID}'), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?)`,
        [
          data.transfer_id,
          data.item_id,
          variationId,
          data.quantity,
          'pending'
        ]
      )
    }
  }

  async updateTotals(transferId) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const [items] = await conn.query(
        'SELECT COUNT(*) as total_items, SUM(quantity) as total_quantity FROM inventory_transfer_items WHERE transfer_id = UUID_TO_BIN(?)',
        [transferId]
      )

      await conn.query(
        'UPDATE inventory_transfers SET total_items = ? WHERE id = UUID_TO_BIN(?)',
        [items[0].total_items || 0, transferId]
      )

      await conn.commit()
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async ship(transferId, userId) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const [transferData] = await conn.query('SELECT id, transfer_number, from_location_id, to_location_id, status, notes, total_items, created_by, updated_by, created_at, updated_at FROM inventory_transfers WHERE id = UUID_TO_BIN(?)', [transferId])
      const rawTransfer = transferData[0]
      if (!rawTransfer) throw new Error('Transfer not found')
      
      const transfer = {
        id: rawTransfer.id ? rawTransfer.id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        transfer_number: rawTransfer.transfer_number,
        from_location_id: rawTransfer.from_location_id ? rawTransfer.from_location_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        to_location_id: rawTransfer.to_location_id ? rawTransfer.to_location_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        status: rawTransfer.status,
        notes: rawTransfer.notes,
        total_items: rawTransfer.total_items,
        created_by: rawTransfer.created_by,
        updated_by: rawTransfer.updated_by,
        created_at: rawTransfer.created_at,
        updated_at: rawTransfer.updated_at
      }
      
      if (transfer.status !== 'pending') {
        throw new Error('Only pending transfers can be shipped')
      }

      const [items] = await conn.query(
        'SELECT id, transfer_id, item_id, variation_id, quantity, quantity_received, status, created_at FROM inventory_transfer_items WHERE transfer_id = UUID_TO_BIN(?)',
        [transferId]
      )

      const formattedItems = items.map(item => ({
        id: item.id ? item.id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        transfer_id: item.transfer_id ? item.transfer_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        item_id: item.item_id ? item.item_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        variation_id: item.variation_id ? item.variation_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        quantity: item.quantity,
        quantity_received: item.quantity_received,
        status: item.status,
        created_at: item.created_at
      }))

      for (const item of formattedItems) {
        const itemId = item.item_id || null
        const variationId = item.variation_id || null
        
        if (!itemId) {
          throw new Error('Item ID is required')
        }
        
        let current
        if (variationId === null) {
          [current] = await conn.query(
            'SELECT quantity, quantity_in_transit FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND variation_id IS NULL AND location_id = UUID_TO_BIN(?)',
            [itemId, transfer.from_location_id]
          )
        } else {
          [current] = await conn.query(
            'SELECT quantity, quantity_in_transit FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
            [itemId, variationId, transfer.from_location_id]
          )
        }

        const quantityBefore = current.length > 0 ? Number(current[0].quantity) : 0
        const quantityInTransitBefore = current.length > 0 ? Number(current[0].quantity_in_transit) : 0
        const quantityAfter = Number(quantityBefore) - parseFloat(item.quantity)
        const quantityInTransitAfter = Number(quantityInTransitBefore) + parseFloat(item.quantity)

        if (quantityAfter < 0) {
          throw new Error(`Insufficient stock for item ${itemId}`)
        }

        if (current.length > 0) {
          if (variationId === null) {
            await conn.query(
              'UPDATE item_quantities SET quantity = ?, quantity_in_transit = ?, updated_by = UUID_TO_BIN(?) WHERE item_id = UUID_TO_BIN(?) AND variation_id IS NULL AND location_id = UUID_TO_BIN(?)',
              [quantityAfter, quantityInTransitAfter, userId, itemId, transfer.from_location_id]
            )
          } else {
            await conn.query(
              'UPDATE item_quantities SET quantity = ?, quantity_in_transit = ?, updated_by = UUID_TO_BIN(?) WHERE item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
              [quantityAfter, quantityInTransitAfter, userId, itemId, variationId, transfer.from_location_id]
            )
          }
        }

        const movementUUID = crypto.randomUUID()
        await conn.query(
          `INSERT INTO inventory_movements 
           (id, item_id, variation_id, location_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, user_id, notes)
           VALUES (UUID_TO_BIN('${movementUUID}'), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, UUID_TO_BIN('${transferId}'), UUID_TO_BIN(?), ?)`,
          [
            itemId,
            variationId,
            transfer.from_location_id,
            'transfer_out',
            -parseFloat(item.quantity),
            quantityBefore,
            quantityAfter,
            'transfer',
            userId,
            'Stock en tránsito'
          ]
        )

        await conn.query(
          'UPDATE inventory_transfer_items SET status = ? WHERE id = UUID_TO_BIN(?)',
          ['in_transit', item.id]
        )
      }

      await conn.query(
        'UPDATE inventory_transfers SET status = ?, updated_by = UUID_TO_BIN(?) WHERE id = UUID_TO_BIN(?)',
        ['in_transit', userId, transferId]
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

  async receive(transferId, userId, items = []) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const [transferData] = await conn.query('SELECT id, transfer_number, from_location_id, to_location_id, status, notes, total_items, created_by, updated_by, created_at, updated_at FROM inventory_transfers WHERE id = UUID_TO_BIN(?)', [transferId])
      const rawTransfer = transferData[0]
      if (!rawTransfer) throw new Error('Transfer not found')
      
      const transfer = {
        id: rawTransfer.id ? rawTransfer.id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        from_location_id: rawTransfer.from_location_id ? rawTransfer.from_location_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        to_location_id: rawTransfer.to_location_id ? rawTransfer.to_location_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        status: rawTransfer.status
      }
      
      if (transfer.status !== 'in_transit') {
        throw new Error('Only in_transit transfers can be received')
      }

      const [existingItems] = await conn.query(
        'SELECT id, transfer_id, item_id, variation_id, quantity, quantity_received, status, created_at FROM inventory_transfer_items WHERE transfer_id = UUID_TO_BIN(?)',
        [transferId]
      )

      const formattedItems = existingItems.map(item => ({
        id: item.id ? item.id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        transfer_id: item.transfer_id ? item.transfer_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        item_id: item.item_id ? item.item_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        variation_id: item.variation_id ? item.variation_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        quantity: item.quantity,
        quantity_received: item.quantity_received,
        status: item.status,
        created_at: item.created_at
      }))

      for (const item of formattedItems) {
        const itemId = item.item_id || null
        const variationId = item.variation_id || null
        
        const receivedQty = items.find(i => i.item_id === item.item_id && i.variation_id === item.variation_id)?.quantity_received ?? item.quantity

        let currentDest
        if (variationId === null) {
          [currentDest] = await conn.query(
            'SELECT quantity FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND variation_id IS NULL AND location_id = UUID_TO_BIN(?)',
            [itemId, transfer.to_location_id]
          )
        } else {
          [currentDest] = await conn.query(
            'SELECT quantity FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
            [itemId, variationId, transfer.to_location_id]
          )
        }

        const quantityBeforeDest = currentDest.length > 0 ? Number(currentDest[0].quantity) : 0
        const quantityAfterDest = Number(quantityBeforeDest) + parseFloat(receivedQty)

        if (currentDest.length > 0) {
          if (variationId === null) {
            await conn.query(
              'UPDATE item_quantities SET quantity = ?, updated_by = UUID_TO_BIN(?) WHERE item_id = UUID_TO_BIN(?) AND variation_id IS NULL AND location_id = UUID_TO_BIN(?)',
              [quantityAfterDest, userId, itemId, transfer.to_location_id]
            )
          } else {
            await conn.query(
              'UPDATE item_quantities SET quantity = ?, updated_by = UUID_TO_BIN(?) WHERE item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
              [quantityAfterDest, userId, itemId, variationId, transfer.to_location_id]
            )
          }
        } else {
          const qtyUUID = crypto.randomUUID()
          await conn.query(
            'INSERT INTO item_quantities (id, item_id, variation_id, location_id, quantity, created_by) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, UUID_TO_BIN(?))',
            [qtyUUID, itemId, variationId, transfer.to_location_id, quantityAfterDest, userId]
          )
        }

        const movementUUID2 = crypto.randomUUID()
        await conn.query(
          `INSERT INTO inventory_movements 
           (id, item_id, variation_id, location_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, user_id, notes)
           VALUES (UUID_TO_BIN('${movementUUID2}'), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, UUID_TO_BIN('${transferId}'), UUID_TO_BIN(?), ?)`,
          [
            itemId,
            variationId,
            transfer.to_location_id,
            'transfer_in',
            parseFloat(receivedQty),
            quantityBeforeDest,
            quantityAfterDest,
            'transfer',
            userId,
            'Transferencia recibida'
          ]
        )

        let currentSource
        if (variationId === null) {
          [currentSource] = await conn.query(
            'SELECT quantity, quantity_in_transit FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND variation_id IS NULL AND location_id = UUID_TO_BIN(?)',
            [itemId, transfer.from_location_id]
          )
        } else {
          [currentSource] = await conn.query(
            'SELECT quantity, quantity_in_transit FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
            [itemId, variationId, transfer.from_location_id]
          )
        }

        if (currentSource.length > 0) {
          const quantityInTransitBefore = Number(currentSource[0].quantity_in_transit) || 0
          const quantityInTransitAfter = Math.max(0, quantityInTransitBefore - parseFloat(receivedQty))

          if (variationId === null) {
            await conn.query(
              'UPDATE item_quantities SET quantity_in_transit = ?, updated_by = UUID_TO_BIN(?) WHERE item_id = UUID_TO_BIN(?) AND variation_id IS NULL AND location_id = UUID_TO_BIN(?)',
              [quantityInTransitAfter, userId, itemId, transfer.from_location_id]
            )
          } else {
            await conn.query(
              'UPDATE item_quantities SET quantity_in_transit = ?, updated_by = UUID_TO_BIN(?) WHERE item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
              [quantityInTransitAfter, userId, itemId, variationId, transfer.from_location_id]
            )
          }
        }

        await conn.query(
          'UPDATE inventory_transfer_items SET quantity_received = ?, status = ? WHERE id = UUID_TO_BIN(?)',
          [receivedQty, 'received', item.id]
        )
      }

      await conn.query(
        'UPDATE inventory_transfers SET status = ?, updated_by = UUID_TO_BIN(?) WHERE id = UUID_TO_BIN(?)',
        ['completed', userId, transferId]
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

  async cancel(transferId, userId) {
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const [transferData] = await conn.query(
        'SELECT id, transfer_number, from_location_id, to_location_id, status, notes, total_items, created_by, updated_by, created_at, updated_at FROM inventory_transfers WHERE id = UUID_TO_BIN(?)',
        [transferId]
      )
      const rawTransfer = transferData[0]
      
      if (!rawTransfer) {
        throw new Error('Transfer not found')
      }

      const transfer = {
        id: rawTransfer.id ? rawTransfer.id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        from_location_id: rawTransfer.from_location_id ? rawTransfer.from_location_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
        status: rawTransfer.status
      }

      if (transfer.status === 'completed' || transfer.status === 'received') {
        throw new Error('No se puede cancelar una transferencia completada')
      }

      if (transfer.status === 'in_transit') {
        const [items] = await conn.query(
          'SELECT id, transfer_id, item_id, variation_id, quantity, quantity_received, status, created_at FROM inventory_transfer_items WHERE transfer_id = UUID_TO_BIN(?)',
          [transferId]
        )

        const formattedItems = items.map(item => ({
          id: item.id ? item.id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
          item_id: item.item_id ? item.item_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
          variation_id: item.variation_id ? item.variation_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5') : null,
          quantity: item.quantity,
          quantity_received: item.quantity_received,
          status: item.status,
          created_at: item.created_at
        }))

        for (const item of formattedItems) {
          const itemId = item.item_id || null
          const variationId = item.variation_id || null
          
          let current
          if (variationId === null) {
            [current] = await conn.query(
              'SELECT quantity FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND variation_id IS NULL AND location_id = UUID_TO_BIN(?)',
              [itemId, transfer.from_location_id]
            )
          } else {
            [current] = await conn.query(
              'SELECT quantity FROM item_quantities WHERE item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
              [itemId, variationId, transfer.from_location_id]
            )
          }

          const quantityBefore = current.length > 0 ? Number(current[0].quantity) : 0
          const quantityAfter = quantityBefore + parseFloat(item.quantity)

          if (current.length > 0) {
            if (variationId === null) {
              await conn.query(
                'UPDATE item_quantities SET quantity = ?, updated_by = UUID_TO_BIN(?) WHERE item_id = UUID_TO_BIN(?) AND variation_id IS NULL AND location_id = UUID_TO_BIN(?)',
                [quantityAfter, userId, itemId, transfer.from_location_id]
              )
            } else {
              await conn.query(
                'UPDATE item_quantities SET quantity = ?, updated_by = UUID_TO_BIN(?) WHERE item_id = UUID_TO_BIN(?) AND variation_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?)',
                [quantityAfter, userId, itemId, variationId, transfer.from_location_id]
              )
            }
          } else {
            const qtyUUID = crypto.randomUUID()
            await conn.query(
              'INSERT INTO item_quantities (id, item_id, variation_id, location_id, quantity, created_by) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, UUID_TO_BIN(?))',
              [qtyUUID, itemId, variationId, transfer.from_location_id, quantityAfter, userId]
            )
          }

          const movementUUID3 = crypto.randomUUID()
          await conn.query(
            `INSERT INTO inventory_movements 
             (id, item_id, variation_id, location_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, user_id, notes)
             VALUES (UUID_TO_BIN('${movementUUID3}'), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, UUID_TO_BIN('${transferId}'), UUID_TO_BIN(?), ?)`,
            [
              itemId,
              variationId,
              transfer.from_location_id,
              'adjustment',
              parseFloat(item.quantity),
              quantityBefore,
              quantityAfter,
              'transfer',
              userId,
              'Transferencia cancelada - Stock reintegrado'
            ]
          )

          await conn.query(
            'UPDATE inventory_transfer_items SET status = ? WHERE id = UUID_TO_BIN(?)',
            ['rejected', item.id]
          )
        }
      }

      await conn.query(
        'UPDATE inventory_transfers SET status = ?, updated_by = UUID_TO_BIN(?) WHERE id = UUID_TO_BIN(?)',
        ['cancelled', userId, transferId]
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

  async deleteItem(transferId, itemId) {
    await this.db.query(
      'DELETE FROM inventory_transfer_items WHERE transfer_id = UUID_TO_BIN(?) AND item_id = UUID_TO_BIN(?)',
      [transferId, itemId]
    )
  }

  async getNextNumber() {
    const maxNum = 9999
    
    for (let num = 1; num <= maxNum; num++) {
      const number = `TRF-${num.toString().padStart(4, '0')}`
      const existing = await this.db.query(
        "SELECT id FROM inventory_transfers WHERE transfer_number = ?",
        [number]
      )
      
      if (existing.length === 0) {
        return number
      }
    }
    
    throw new Error('No se pudo generar un número único de transferencia')
  }
}
