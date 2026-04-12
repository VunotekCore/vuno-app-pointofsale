import pool from '../config/database.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { SequenceRepository } from './sequence.repository.js'
import { CompanyRepository } from './company.repository.js'

export class ReceivingRepository {
  constructor (db = pool, companyRepo = null, sequenceRepo = null) {
    this.db = db
    this.companyRepo = companyRepo || new CompanyRepository(db)
    this.sequenceRepo = sequenceRepo || new SequenceRepository(db, this.companyRepo)
  }

  async getAll (filters = {}) {
    const { status, supplier_id, location_id, search, start_date, end_date, company_id, limit, offset } = filters
    
    let whereClause = 'WHERE (r.is_delete = 0 OR r.is_delete IS NULL)'
    const params = []
    const countParams = []

    if (company_id) {
      whereClause += ' AND r.company_id = UUID_TO_BIN(?)'
      params.push(company_id)
      countParams.push(company_id)
    }

    if (status) {
      whereClause += ' AND r.status = ?'
      params.push(status)
      countParams.push(status)
    }

    if (supplier_id) {
      whereClause += ' AND r.supplier_id = UUID_TO_BIN(?)'
      params.push(supplier_id)
      countParams.push(supplier_id)
    }

    if (location_id) {
      whereClause += ' AND r.location_id = UUID_TO_BIN(?)'
      params.push(location_id)
      countParams.push(location_id)
    }

    if (search) {
      whereClause += ' AND (r.receiving_number LIKE ? OR s.name LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
      countParams.push(searchTerm, searchTerm)
    }

    if (start_date) {
      whereClause += ' AND DATE(r.received_at) >= ?'
      params.push(start_date)
      countParams.push(start_date)
    }

    if (end_date) {
      whereClause += ' AND DATE(r.received_at) <= ?'
      params.push(end_date)
      countParams.push(end_date)
    }

    const countResult = await this.db.query(`SELECT COUNT(*) as total FROM receivings r LEFT JOIN suppliers s ON r.supplier_id = s.id ${whereClause}`, countParams)
    const total = countResult[0]?.total || 0

    let query = `
      SELECT 
        BIN_TO_UUID(r.id) as id,
        r.receiving_number,
        BIN_TO_UUID(r.purchase_order_id) as purchase_order_id,
        BIN_TO_UUID(r.supplier_id) as supplier_id,
        BIN_TO_UUID(r.location_id) as location_id,
        r.status,
        r.receiving_type,
        r.total_amount,
        r.notes,
        r.received_at,
        r.created_at,
        s.name as supplier_name,
        l.name as location_name,
        po.po_number,
        u.username as created_by_name
      FROM receivings r
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      LEFT JOIN locations l ON r.location_id = l.id
      LEFT JOIN purchase_orders po ON r.purchase_order_id = po.id
      LEFT JOIN users u ON r.created_by = u.id
      ${whereClause}
      ORDER BY r.received_at DESC
    `

    if (limit) {
      query += ' LIMIT ?'
      params.push(parseInt(limit))
      if (offset) {
        query += ' OFFSET ?'
        params.push(parseInt(offset))
      }
    }

    const rows = await this.db.query(query, params)
    return { data: rows || [], total }
  }

  async getById (id, companyId) {
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(r.id) as id,
        r.receiving_number,
        BIN_TO_UUID(r.purchase_order_id) as purchase_order_id,
        BIN_TO_UUID(r.supplier_id) as supplier_id,
        BIN_TO_UUID(r.location_id) as location_id,
        r.status,
        r.receiving_type,
        r.total_amount,
        r.notes,
        r.received_at,
        r.created_at,
        s.name as supplier_name,
        l.name as location_name,
        po.po_number as po_number
      FROM receivings r
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      LEFT JOIN locations l ON r.location_id = l.id
      LEFT JOIN purchase_orders po ON r.purchase_order_id = po.id
      WHERE r.id = UUID_TO_BIN(?) AND r.company_id = UUID_TO_BIN(?) AND (r.is_delete = 0 OR r.is_delete IS NULL)
    `, [id, companyId])

    if (!rows || rows.length === 0) {
      throw new NotFoundError(`Recepción con id ${id} no encontrada`)
    }

    const receiving = rows[0]
    receiving.items = await this.getItems(id, companyId)
    
    return receiving
  }

  async getItems (receivingId, companyId) {
    let query = `
      SELECT 
        BIN_TO_UUID(ri.id) as id,
        BIN_TO_UUID(ri.receiving_id) as receiving_id,
        BIN_TO_UUID(ri.item_id) as item_id,
        BIN_TO_UUID(ri.variation_id) as variation_id,
        ri.serial_numbers,
        ri.quantity,
        ri.cost_price,
        ri.total_cost,
        ri.expire_date,
        ri.batch_number,
        i.name as item_name,
        i.item_number,
        iv.sku as variation_sku,
        iv.attributes as variation_attributes
      FROM receiving_items ri
      LEFT JOIN items i ON ri.item_id = i.id
      LEFT JOIN item_variations iv ON ri.variation_id = iv.id
      WHERE ri.receiving_id = UUID_TO_BIN(?)
    `
    const params = [receivingId]
    
    const rows = await this.db.query(query, params)
    return rows || []
  }

  async create (data, userId = null) {
    const { purchase_order_id, supplier_id, location_id, receiving_type, notes, items, company_id } = data

    if (!supplier_id) {
      throw new BadRequestError('El proveedor es requerido')
    }

    if (!location_id) {
      throw new BadRequestError('La ubicación es requerida')
    }

    if (!items || items.length === 0) {
      throw new BadRequestError('Los items son requeridos')
    }

    const receivingNumber = await this.generateReceivingNumber(company_id)

    await this.db.query(`
      INSERT INTO receivings (id, receiving_number, purchase_order_id, supplier_id, location_id, receiving_type, notes, created_by, company_id)
      VALUES (UUID_TO_BIN(UUID()), ?, UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?))
    `, [receivingNumber, purchase_order_id || null, supplier_id, location_id, receiving_type || 'purchase_order', notes || null, userId, company_id])

    const newReceiving = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM receivings WHERE receiving_number = ? AND company_id = UUID_TO_BIN(?)', [receivingNumber, company_id])
    const receivingId = newReceiving[0]?.id

    let totalAmount = 0

    for (const item of items) {
      const { item_id, variation_id, quantity, cost_price, serial_numbers, expire_date, batch_number } = item
      
      const finalCost = cost_price || 0
      
      if (!item_id || !quantity || !finalCost) {
        throw new BadRequestError('Cada item debe tener item_id, cantidad y costo')
      }

      const totalCost = parseFloat(quantity) * parseFloat(finalCost)
      totalAmount += totalCost

      await this.db.query(`
        INSERT INTO receiving_items (id, receiving_id, item_id, variation_id, serial_numbers, quantity, cost_price, total_cost, expire_date, batch_number)
        VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)
      `, [receivingId, item_id, variation_id || null, serial_numbers ? JSON.stringify(serial_numbers) : null, quantity, finalCost, totalCost, expire_date || null, batch_number || null])
    }

    await this.db.query('UPDATE receivings SET total_amount = ? WHERE id = UUID_TO_BIN(?)', [totalAmount, receivingId])

    if (purchase_order_id) {
      const conn = await this.db.getConnection()
      try {
        await conn.beginTransaction()
        await this.updatePurchaseOrderReceivedAmountWithConn(conn, purchase_order_id)
        await this.updatePurchaseOrderStatusWithConn(conn, purchase_order_id)
        await conn.commit()
      } catch (error) {
        await conn.rollback()
        throw error
      } finally {
        conn.release()
      }
    }

    return receivingId
  }

  async complete (id, userId = null, companyId = null) {
    const receiving = await this.getById(id, companyId)

    if (receiving.status === 'completed') {
      throw new BadRequestError('Esta recepción ya está completada')
    }

    if (receiving.status === 'cancelled') {
      throw new BadRequestError('No se puede completar una recepción cancelada')
    }

    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      for (const item of receiving.items) {
        const { item_id, variation_id, quantity, cost_price, serial_numbers } = item

        const existingStock = await conn.query(`
          SELECT id, quantity FROM item_quantities 
          WHERE item_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?) AND (variation_id = UUID_TO_BIN(?) OR (variation_id IS NULL AND ? IS NULL))
        `, [item_id, receiving.location_id, variation_id, variation_id])

        if (existingStock.length > 0) {
          await conn.query(`
            UPDATE item_quantities 
            SET quantity = quantity + ? 
            WHERE id = ?
          `, [quantity, existingStock[0].id])
        } else {
          await conn.query(`
            INSERT INTO item_quantities (id, item_id, variation_id, location_id, quantity)
            VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), ?)
          `, [item_id, variation_id || null, receiving.location_id, quantity])
        }

        await conn.query(`
          INSERT INTO inventory_movements (id, item_id, variation_id, location_id, movement_type, quantity_change, unit_cost, reference_id, reference_type, created_by)
          VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), 'receiving', ?, ?, UUID_TO_BIN(?), 'receiving', UUID_TO_BIN(?))
        `, [item_id, variation_id || null, receiving.location_id, quantity, cost_price, id, userId])

        if (receiving.purchase_order_id) {
          const poItems = await conn.query(`
            SELECT id, quantity_received FROM purchase_order_items 
            WHERE purchase_order_id = UUID_TO_BIN(?) AND item_id = UUID_TO_BIN(?) AND (variation_id = UUID_TO_BIN(?) OR (variation_id IS NULL AND ? IS NULL))
          `, [receiving.purchase_order_id, item_id, variation_id, variation_id])

          if (poItems.length > 0) {
            const newQuantityReceived = parseFloat(poItems[0].quantity_received) + parseFloat(quantity)
            await conn.query(`
              UPDATE purchase_order_items 
              SET quantity_received = ? 
              WHERE id = ?
            `, [newQuantityReceived, poItems[0].id])
          }
        }

        await this.updateAverageCost(conn, item_id, quantity, cost_price, userId, companyId)
      }

      await conn.query('UPDATE receivings SET status = ?, received_at = NOW() WHERE id = UUID_TO_BIN(?)', ['completed', id])

      if (receiving.purchase_order_id) {
        await this.updatePurchaseOrderReceivedAmountWithConn(conn, receiving.purchase_order_id)
        await this.updatePurchaseOrderStatusWithConn(conn, receiving.purchase_order_id)
      }

      await conn.commit()

      return await this.getById(id, companyId)
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async updatePurchaseOrderReceivedAmount (purchaseOrderId) {
    const result = await this.db.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM receivings 
      WHERE purchase_order_id = UUID_TO_BIN(?) AND status = 'completed'
    `, [purchaseOrderId])

    await this.db.query(`
      UPDATE purchase_orders SET received_amount = ? WHERE id = UUID_TO_BIN(?)
    `, [result[0].total, purchaseOrderId])
  }

  async updatePurchaseOrderStatus (purchaseOrderId) {
    const po = await this.db.query(`
      SELECT total_amount, received_amount FROM purchase_orders WHERE id = UUID_TO_BIN(?)
    `, [purchaseOrderId])

    if (po.length > 0) {
      const total = parseFloat(po[0].total_amount)
      const received = parseFloat(po[0].received_amount)

      let newStatus = 'sent'
      if (received >= total && total > 0) {
        newStatus = 'received'
      } else if (received > 0) {
        newStatus = 'partial'
      }

      await this.db.query(`
        UPDATE purchase_orders SET status = ? WHERE id = UUID_TO_BIN(?)
      `, [newStatus, purchaseOrderId])
    }
  }

  async updatePurchaseOrderStatusWithConn (conn, purchaseOrderId) {
    const po = await conn.query(`
      SELECT total_amount, received_amount FROM purchase_orders WHERE id = UUID_TO_BIN(?)
    `, [purchaseOrderId])

    if (po.length > 0) {
      const total = parseFloat(po[0].total_amount) || 0
      const received = parseFloat(po[0].received_amount) || 0

      let newStatus = 'sent'
      if (received >= total && total > 0) {
        newStatus = 'received'
      } else if (received > 0) {
        newStatus = 'partial'
      }

      await conn.query(`
        UPDATE purchase_orders SET status = ? WHERE id = UUID_TO_BIN(?)
      `, [newStatus, purchaseOrderId])
    }
  }

  async updatePurchaseOrderReceivedAmountWithConn (conn, purchaseOrderId) {
    const result = await conn.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM receivings 
      WHERE purchase_order_id = UUID_TO_BIN(?) AND status = 'completed'
    `, [purchaseOrderId])

    const totalReceived = result[0]?.total || 0
    await conn.query(`
      UPDATE purchase_orders SET received_amount = ? WHERE id = UUID_TO_BIN(?)
    `, [totalReceived, purchaseOrderId])
  }

  async delete (id, companyId = null) {
    const receiving = await this.getById(id, companyId)
    
    if (receiving.status === 'completed') {
      const conn = await this.db.getConnection()
      try {
        await conn.beginTransaction()
        
        for (const item of receiving.items) {
          const { item_id, variation_id, quantity, cost_price } = item
          
          const existingStock = await conn.query(`
            SELECT id, quantity FROM item_quantities 
            WHERE item_id = UUID_TO_BIN(?) AND location_id = UUID_TO_BIN(?) AND (variation_id = UUID_TO_BIN(?) OR (variation_id IS NULL AND ? IS NULL))
          `, [item_id, receiving.location_id, variation_id, variation_id])

          if (existingStock.length > 0 && existingStock[0].quantity >= quantity) {
            await conn.query(`
              UPDATE item_quantities SET quantity = quantity - ? WHERE id = ?
            `, [quantity, existingStock[0].id])
            
            await conn.query(`
              INSERT INTO inventory_movements (id, item_id, variation_id, location_id, movement_type, quantity_change, unit_cost, reference_id, reference_type, created_by)
              VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), UUID_TO_BIN(?), 'receiving', -?, ?, UUID_TO_BIN(?), 'receiving', NULL)
            `, [item_id, variation_id || null, receiving.location_id, quantity, cost_price, id])
          }
        }
        
        if (receiving.purchase_order_id) {
          await this.updatePurchaseOrderReceivedAmountWithConn(conn, receiving.purchase_order_id)
          await this.updatePurchaseOrderStatusWithConn(conn, receiving.purchase_order_id)
        }
        
        await conn.commit()
      } catch (error) {
        await conn.rollback()
        throw error
      } finally {
        conn.release()
      }
    }
    
    const result = await this.db.query('UPDATE receivings SET is_delete = 1 WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)', [id, companyId])
    if (result.affectedRows === 0) {
      throw new NotFoundError(`Recepción con id ${id} no encontrada`)
    }
    return result.affectedRows
  }

  async generateReceivingNumber (companyId) {
    if (!companyId) {
      throw new Error('companyId es requerido para generar número de recepción')
    }
    const result = await this.sequenceRepo.getNext(companyId, 'receiving')
    return result.docNumber
  }

  async updateAverageCost (conn, itemId, newQuantity, newCost, userId = null, companyId = null) {
    // Parsear correctamente los valores
    const qtyNew = parseFloat(String(newQuantity).replace(',', '.')) || 0
    const costNew = parseFloat(String(newCost).replace(',', '.')) || 0
    
    const currentItem = await conn.query(`
      SELECT cost_price, unit_price FROM items WHERE id = UUID_TO_BIN(?)
    `, [itemId])

    if (!currentItem || currentItem.length === 0) {
      return
    }

    const currentCost = parseFloat(currentItem[0].cost_price) || 0
    const currentPrice = parseFloat(currentItem[0].unit_price) || 0
    const currentStockRaw = await this.getTotalStock(conn, itemId)
    const currentStock = parseFloat(String(currentStockRaw).replace(',', '.')) || 0
    
    const totalValue = (currentCost * currentStock) + (costNew * qtyNew)
    const totalQuantity = currentStock + qtyNew
    
    let newAverageCost = costNew
    if (totalQuantity > 0 && totalValue > 0) {
      newAverageCost = totalValue / totalQuantity
    }
    
    // Redondear a 2 decimales
    newAverageCost = Math.round(newAverageCost * 100) / 100

    if (newAverageCost > 0 && newAverageCost !== currentCost) {
      await conn.query(`
        UPDATE items SET cost_price = ? WHERE id = UUID_TO_BIN(?)
      `, [newAverageCost, itemId])
      
      // Guardar historial de precios
      if (companyId) {
        await conn.query(`
          INSERT INTO product_price_history 
            (item_id, company_id, cost_price_before, unit_price_before, margin_before, cost_price_after, unit_price_after, margin_after, created_by)
          VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?))
        `, [
          itemId,
          companyId,
          currentCost,
          currentPrice,
          currentPrice > 0 ? Math.round(((currentPrice - currentCost) / currentPrice) * 10000) / 100 : 0,
          newAverageCost,
          currentPrice,
          currentPrice > 0 ? Math.round(((currentPrice - newAverageCost) / currentPrice) * 10000) / 100 : 0,
          userId
        ])
      }
    }
  }

  async getTotalStock (conn, itemId) {
    const result = await conn.query(`
      SELECT COALESCE(SUM(quantity), 0) as total FROM item_quantities WHERE item_id = UUID_TO_BIN(?)
    `, [itemId])
    return parseFloat(result[0].total) || 0
  }
}
