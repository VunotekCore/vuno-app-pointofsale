import pool from '../config/database.js'
import { NotFoundError } from '../errors/NotFoundError.js'
import { BadRequestError } from '../errors/BadRequestError.js'
import { SequenceRepository } from './sequence.repository.js'
import crypto from 'crypto'

export class ItemsRepository {
  constructor (db = pool, sequenceRepo = null) {
    this.db = db
    this.sequenceRepo = sequenceRepo || new SequenceRepository(db)
  }

  async getAll (locationId = null, filters = {}) {
    const { limit = 20, offset = 0, search = '', status = '', company_id, supplier_id } = filters
    
    const quantitySubquery = locationId 
      ? `(SELECT COALESCE(SUM(quantity), 0) FROM item_quantities WHERE item_id = i.id AND location_id = UUID_TO_BIN(?)) as total_quantity`
      : `(SELECT COALESCE(SUM(quantity), 0) FROM item_quantities WHERE item_id = i.id) as total_quantity`

    const params = locationId ? [locationId] : []
    let whereClause = 'WHERE (i.is_delete = 0 OR i.is_delete IS NULL)'
    
    if (company_id) {
      whereClause += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(company_id)
    }
    
    if (search) {
      whereClause += ' AND (i.name LIKE ? OR i.item_number LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }
    
    if (status) {
      whereClause += ' AND i.status = ?'
      params.push(status)
    }

    if (supplier_id) {
      whereClause += ' AND (i.supplier_id = UUID_TO_BIN(?) OR i.preferred_supplier_id = UUID_TO_BIN(?))'
      params.push(supplier_id, supplier_id)
    }
    
    const countParams = [...params]
    const countRows = await this.db.query(`
      SELECT COUNT(*) as total FROM items i ${whereClause}
    `, countParams)
    const total = countRows[0]?.total || 0

    const queryParams = [...params, parseInt(limit), parseInt(offset)]
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(i.id) as id,
        i.item_number,
        i.name,
        i.description,
        BIN_TO_UUID(i.category_id) as category_id,
        BIN_TO_UUID(i.supplier_id) as supplier_id,
        i.cost_price,
        i.unit_price,
        i.reorder_level,
        i.reorder_quantity,
        i.is_serialized,
        i.is_service,
        i.is_kit,
        i.is_variable_sale,
        i.tracks_expiration,
        i.image_url,
        i.custom_fields,
        i.status,
        i.created_at,
        i.updated_at,
        i.is_delete,
        c.name as category_name,
        s.name as supplier_name,
        BIN_TO_UUID(i.default_unit_id) as default_unit_id,
        ${quantitySubquery}
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      ${whereClause}
      ORDER BY i.name ASC
      LIMIT ? OFFSET ?
    `, queryParams)
    
    const items = rows || []
    
    const kitIds = items.filter(i => i.is_kit).map(i => i.id)
    if (kitIds.length > 0) {
      const kitIdParams = kitIds.map(() => 'UUID_TO_BIN(?)')
      const components = await this.db.query(`
        SELECT kc.kit_item_id, kc.component_item_id, kc.quantity, i.name as item_name, i.item_number
        FROM kit_components kc
        JOIN items i ON kc.component_item_id = i.id
        WHERE kc.kit_item_id IN (${kitIdParams.join(',')})
      `, kitIds)
      
      const componentsMap = {}
      for (const comp of components) {
        const itemIdHex = comp.component_item_id.toString('hex')
        const itemIdUuid = itemIdHex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
        
        const kitIdHex = comp.kit_item_id.toString('hex')
        const kitIdUuid = kitIdHex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
        
        if (!componentsMap[kitIdUuid]) {
          componentsMap[kitIdUuid] = []
        }
        componentsMap[kitIdUuid].push({
          item_id: itemIdUuid,
          quantity: comp.quantity,
          item_name: comp.item_name,
          item_number: comp.item_number
        })
      }
      
      const componentBinaries = components.map(c => c.component_item_id)
      
      if (componentBinaries.length > 0) {
        const componentUuids = componentBinaries.map(bin => {
          const hex = bin.toString('hex')
          return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
        })
        
        let stockQuery
        let stockParams
        
        if (locationId) {
          stockQuery = `
            SELECT BIN_TO_UUID(item_id) as item_id, COALESCE(quantity, 0) as stock
            FROM item_quantities
            WHERE item_id IN (${componentUuids.map(() => 'UUID_TO_BIN(?)').join(',')})
              AND location_id = UUID_TO_BIN(?)
          `
          stockParams = [...componentUuids, locationId]
        } else {
          stockQuery = `
            SELECT BIN_TO_UUID(item_id) as item_id, COALESCE(SUM(quantity), 0) as stock
            FROM item_quantities
            WHERE item_id IN (${componentUuids.map(() => 'UUID_TO_BIN(?)').join(',')})
            GROUP BY item_id
          `
          stockParams = componentUuids
        }
        
        const stocks = await this.db.query(stockQuery, stockParams)

        const stockMap = {}
        for (const s of stocks) {
          stockMap[s.item_id] = parseFloat(s.stock)
        }
        
        for (const item of items) {
          if (item.is_kit && componentsMap[item.id]) {
            item.kit_components = componentsMap[item.id]
            
            let minStock = Infinity
            for (const comp of item.kit_components) {
              const availableStock = stockMap[comp.item_id] || 0
              const possibleKits = Math.floor(availableStock / parseFloat(comp.quantity))
              minStock = Math.min(minStock, possibleKits)
            }
            item.total_quantity = minStock === Infinity ? 0 : minStock
          } else {
            item.kit_components = []
          }
        }
      }
    }
    
    return { items, total }
  }

  async getById (id, locationId = null, companyId) {
    let quantitySubquery
    let params
    
    if (locationId) {
      quantitySubquery = `(SELECT quantity FROM item_quantities WHERE item_id = i.id AND location_id = UUID_TO_BIN(?)) as total_quantity`
      params = [locationId, id, companyId]
    } else {
      quantitySubquery = `(SELECT COALESCE(SUM(quantity), 0) FROM item_quantities WHERE item_id = i.id) as total_quantity`
      params = [id, companyId]
    }
    
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(i.id) as id,
        i.item_number,
        i.name,
        i.description,
        BIN_TO_UUID(i.category_id) as category_id,
        BIN_TO_UUID(i.supplier_id) as supplier_id,
        i.cost_price,
        i.unit_price,
        i.reorder_level,
        i.reorder_quantity,
        i.is_serialized,
        i.is_service,
        i.is_kit,
        i.is_part_of_kit,
        i.is_variable_sale,
        i.tracks_expiration,
        i.image_url,
        i.custom_fields,
        i.status,
        i.created_at,
        i.updated_at,
        i.is_delete,
        c.name as category_name,
        s.name as supplier_name,
        ${quantitySubquery}
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.id = UUID_TO_BIN(?) AND i.company_id = UUID_TO_BIN(?) AND (i.is_delete = 0 OR i.is_delete IS NULL)
    `, params)
    if (!rows || rows.length === 0) {
      throw new NotFoundError(`Item con id ${id} no encontrado`)
    }
    
    const item = rows[0]
    
    const variations = await this.getVariations(id, companyId)
    item.variations = variations

    const stock = await this.getStock(id, companyId)
    item.stock = stock
    
    const totalStock = stock.reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0)
    item.total_quantity = totalStock
    
    if (item.is_kit) {
      const components = await this.db.query(`
        SELECT kc.component_item_id, kc.quantity, i.name as item_name, i.item_number
        FROM kit_components kc
        JOIN items i ON kc.component_item_id = i.id
        WHERE kc.kit_item_id = UUID_TO_BIN(?)
      `, [id])
      item.kit_components = components.map(c => ({
        item_id: c.component_item_id.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'),
        quantity: parseFloat(c.quantity),
        item_name: c.item_name,
        item_number: c.item_number
      }))

      const componentBinaries = components.map(c => c.component_item_id)
      
      if (componentBinaries.length > 0) {
        const componentUuids = componentBinaries.map(bin => {
          const hex = bin.toString('hex')
          return hex.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
        })
        
        let stockQuery
        let stockParams
        
        if (locationId) {
          stockQuery = `
            SELECT BIN_TO_UUID(item_id) as item_id, COALESCE(quantity, 0) as stock
            FROM item_quantities
            WHERE item_id IN (${componentUuids.map(() => 'UUID_TO_BIN(?)').join(',')})
              AND location_id = UUID_TO_BIN(?)
          `
          stockParams = [...componentUuids, locationId]
        } else {
          stockQuery = `
            SELECT BIN_TO_UUID(item_id) as item_id, COALESCE(SUM(quantity), 0) as stock
            FROM item_quantities
            WHERE item_id IN (${componentUuids.map(() => 'UUID_TO_BIN(?)').join(',')})
            GROUP BY item_id
          `
          stockParams = componentUuids
        }
        
        const stocks = await this.db.query(stockQuery, stockParams)

        const stockMap = {}
        for (const s of stocks) {
          stockMap[s.item_id] = parseFloat(s.stock)
        }

        let minStock = Infinity
        for (const comp of item.kit_components) {
          const availableStock = stockMap[comp.item_id] || 0
          const possibleKits = Math.floor(availableStock / parseFloat(comp.quantity))
          minStock = Math.min(minStock, possibleKits)
        }
        item.total_quantity = minStock === Infinity ? 0 : minStock
      } else {
        item.total_quantity = 0
      }
    } else {
      item.kit_components = []
    }
    
    return item
  }

  async create (data, userId = null) {
    const { item_number, name, description, category_id, supplier_id, cost_price, unit_price, reorder_level, reorder_quantity, is_serialized, is_service, is_kit, is_variable_sale, tracks_expiration, image_url, custom_fields, status, kit_components, company_id, initial_quantity } = data

    if (!name || !name.trim()) {
      throw new BadRequestError('El nombre del producto es requerido')
    }

    let finalItemNumber = item_number

    if (!finalItemNumber || !finalItemNumber.trim()) {
      const seqResult = await this.sequenceRepo.getNext(company_id, 'item')
      finalItemNumber = seqResult.docNumber
    }

    let finalCostPrice = cost_price || 0
    let finalUnitPrice = unit_price || 0

    if (is_kit && kit_components && kit_components.length > 0) {
      await this.validateKitComponents(kit_components, company_id)

      const componentIds = kit_components.map(c => c.item_id)
      const components = await this.db.query(`
        SELECT id, cost_price, unit_price FROM items WHERE id IN (?) AND company_id = UUID_TO_BIN(?)
      `, [componentIds, company_id])
      
      const componentMap = {}
      for (const c of components) {
        componentMap[c.id] = c
      }
      
      let totalComponentCost = 0
      let totalComponentPrice = 0
      
      for (const comp of kit_components) {
        const component = componentMap[comp.item_id]
        if (component) {
          totalComponentCost += parseFloat(component.cost_price) * comp.quantity
          totalComponentPrice += parseFloat(component.unit_price) * comp.quantity
        }
      }
      
      finalCostPrice = totalComponentCost
      if (!unit_price || unit_price === 0) {
        finalUnitPrice = totalComponentPrice
      }
    }

    // Use transaction for atomicity
    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const itemId = crypto.randomUUID()
      
      await conn.query(`
        INSERT INTO items (id, item_number, name, description, category_id, supplier_id, cost_price, unit_price, reorder_level, reorder_quantity, is_serialized, is_service, is_kit, is_variable_sale, tracks_expiration, image_url, status, created_by, company_id)
        VALUES (UUID_TO_BIN(?), ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?))
      `, [itemId, finalItemNumber, name.trim(), description || null, category_id || null, supplier_id || null, finalCostPrice, finalUnitPrice, reorder_level || 0, reorder_quantity || 0, is_serialized || 0, is_service || 0, is_kit || 0, is_variable_sale || 0, tracks_expiration || 0, image_url || null, status || 'active', userId, company_id])

      // Create initial stock if quantity > 0 and not a service or kit
      if (!is_service && !is_kit && initial_quantity && parseFloat(initial_quantity) > 0) {
        await this.createInitialStockInTransaction(conn, itemId, company_id, finalCostPrice, parseFloat(initial_quantity), userId)
      }

      await conn.commit()
      return itemId
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async createInitialStockInTransaction (conn, itemId, companyId, unitCost, quantity, userId = null) {
    // Get default location or first available location for the company
    let locationRows = await conn.query(
      'SELECT id FROM locations WHERE company_id = UUID_TO_BIN(?) AND is_default = 1 AND is_active = 1 LIMIT 1',
      [companyId]
    )

    if (!locationRows || locationRows.length === 0) {
      // If no default location, get the first active location
      locationRows = await conn.query(
        'SELECT id FROM locations WHERE company_id = UUID_TO_BIN(?) AND is_active = 1 LIMIT 1',
        [companyId]
      )
    }

    if (!locationRows || locationRows.length === 0) {
      throw new BadRequestError('No active location found for this company')
    }

    const locationId = locationRows[0].id

    // Insert or update item_quantities
    await conn.query(`
      INSERT INTO item_quantities (id, item_id, location_id, quantity)
      VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
    `, [crypto.randomUUID(), itemId, locationId, quantity])

    // Create inventory_movement record for audit trail
    await conn.query(`
      INSERT INTO inventory_movements (id, item_id, location_id, movement_type, quantity_change, quantity_after, unit_cost, total_cost, reference_type, user_id, notes)
      VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, 'initial_stock', ?, ?, ?, ?, 'item', UUID_TO_BIN(?), ?)
    `, [crypto.randomUUID(), itemId, locationId, quantity, quantity, unitCost, unitCost * quantity, userId || null, 'Initial stock'])
  }

  async update (id, data, userId = null, companyId = null) {
    const existing = await this.getById(id, null, companyId)
    
    const { item_number, name, description, category_id, supplier_id, cost_price, unit_price, reorder_level, reorder_quantity, is_serialized, is_service, is_kit, is_variable_sale, tracks_expiration, image_url, custom_fields, status, kit_components } = data

    let finalCostPrice = cost_price
    let finalUnitPrice = unit_price

    const isKit = is_kit !== undefined ? is_kit : existing.is_kit
    
    if (isKit && kit_components && kit_components.length > 0) {
      await this.validateKitComponents(kit_components, companyId)

      const componentIds = kit_components.map(c => c.item_id)
      const components = await this.db.query(`
        SELECT id, cost_price, unit_price FROM items WHERE id IN (?) AND company_id = UUID_TO_BIN(?)
      `, [componentIds, companyId])
      
      const componentMap = {}
      for (const c of components) {
        componentMap[c.id] = c
      }
      
      let totalComponentCost = 0
      let totalComponentPrice = 0
      
      for (const comp of kit_components) {
        const component = componentMap[comp.item_id]
        if (component) {
          totalComponentCost += parseFloat(component.cost_price) * comp.quantity
          totalComponentPrice += parseFloat(component.unit_price) * comp.quantity
        }
      }
      
      finalCostPrice = totalComponentCost
      if (!unit_price || unit_price === 0) {
        finalUnitPrice = totalComponentPrice
      }
    }

    const fields = []
    const values = []
    const allowedFields = ['item_number', 'name', 'description', 'category_id', 'supplier_id', 'cost_price', 'unit_price', 'reorder_level', 'reorder_quantity', 'is_serialized', 'is_service', 'is_kit', 'is_variable_sale', 'tracks_expiration', 'image_url', 'custom_fields', 'status']

    for (const field of allowedFields) {
      let value = data[field]
      
      if (field === 'cost_price' && isKit && kit_components?.length > 0) {
        value = finalCostPrice
      }
      if (field === 'unit_price' && isKit && kit_components?.length > 0) {
        if (unit_price === undefined) {
          value = finalUnitPrice
        } else {
          value = unit_price
        }
      }
      
      if (value !== undefined) {
        if (field === 'name' && value && !value.trim()) {
          throw new BadRequestError('El nombre del producto no puede estar vacío')
        }
        if (field === 'category_id' || field === 'supplier_id') {
          fields.push(`${field} = UUID_TO_BIN(?)`)
          values.push(value)
        } else {
          fields.push(`${field} = ?`)
          values.push(field === 'name' ? value.trim() : value)
        }
      }
    }

    if (userId) {
      fields.push('updated_by = UUID_TO_BIN(?)')
      values.push(userId)
    }

    if (fields.length === 0) {
      throw new BadRequestError('No hay campos para actualizar')
    }

    values.push(id)
    if (companyId) {
      values.push(companyId)
      const result = await this.db.query(`UPDATE items SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`, values)
      return result.affectedRows
    } else {
      const result = await this.db.query(`UPDATE items SET ${fields.join(', ')} WHERE id = UUID_TO_BIN(?)`, values)
      return result.affectedRows
    }
  }

  async delete (id, userId = null, companyId = null) {
    await this.getById(id, null, companyId)
    const updates = ['is_delete = 1']
    const values = []

    if (userId) {
      updates.push('updated_by = UUID_TO_BIN(?)')
      values.push(userId)
    }

    values.push(id)
    if (companyId) {
      values.push(companyId)
      const result = await this.db.query(`UPDATE items SET ${updates.join(', ')} WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)`, values)
      return result.affectedRows
    } else {
      const result = await this.db.query(`UPDATE items SET ${updates.join(', ')} WHERE id = UUID_TO_BIN(?)`, values)
      return result.affectedRows
    }
  }

  async restore (id, companyId) {
    if (companyId) {
      const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM items WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)', [id, companyId])
      if (!rows || rows.length === 0) {
        throw new NotFoundError(`Item con id ${id} no encontrado`)
      }
      const result = await this.db.query('UPDATE items SET is_delete = 0 WHERE id = UUID_TO_BIN(?) AND company_id = UUID_TO_BIN(?)', [id, companyId])
      return result.affectedRows
    } else {
      const rows = await this.db.query('SELECT BIN_TO_UUID(id) as id FROM items WHERE id = UUID_TO_BIN(?)', [id])
      if (!rows || rows.length === 0) {
        throw new NotFoundError(`Item con id ${id} no encontrado`)
      }
      const result = await this.db.query('UPDATE items SET is_delete = 0 WHERE id = UUID_TO_BIN(?)', [id])
      return result.affectedRows
    }
  }

  async getVariations (itemId, companyId) {
    let query = `SELECT iv.id, BIN_TO_UUID(iv.item_id) as item_id, iv.sku, iv.attributes, iv.cost_price, iv.unit_price, iv.image_url 
                 FROM item_variations iv
                 JOIN items i ON iv.item_id = i.id
                 WHERE iv.item_id = UUID_TO_BIN(?) AND (iv.is_delete = 0 OR iv.is_delete IS NULL)`
    const params = [itemId]
    
    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const rows = await this.db.query(query, params)
    return rows
  }

  async getStock (itemId, companyId) {
    let query = `
      SELECT BIN_TO_UUID(iq.id) as id, BIN_TO_UUID(iq.item_id) as item_id, BIN_TO_UUID(iq.variation_id) as variation_id, BIN_TO_UUID(iq.location_id) as location_id, iq.quantity, iq.quantity_reserved, iq.quantity_in_transit, l.name as location_name, l.code as location_code
      FROM item_quantities iq
      JOIN items i ON iq.item_id = i.id
      JOIN locations l ON iq.location_id = l.id
      WHERE iq.item_id = UUID_TO_BIN(?)`
    const params = [itemId]
    
    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const rows = await this.db.query(query, params)
    return rows
  }

  async generateItemNumber (companyId) {
    let query = 'SELECT MAX(CAST(SUBSTRING(item_number, 5) AS UNSIGNED)) as max_num FROM items WHERE item_number LIKE \'ITE-%\''
    const params = []
    
    if (companyId) {
      query += ' AND company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const rows = await this.db.query(query, params)
    const nextNum = (rows[0]?.max_num || 0) + 1
    return `ITE-${String(nextNum).padStart(6, '0')}`
  }

  async calculateKitStock (kitItemId, components, companyId) {
    if (!components || components.length === 0) return 0

    const componentIds = components.map(c => c.item_id)
    const componentIdParams = componentIds.map(() => 'UUID_TO_BIN(?)')
    let query = `
      SELECT BIN_TO_UUID(iq.item_id) as item_id, COALESCE(SUM(iq.quantity), 0) as stock
      FROM item_quantities iq
      JOIN items i ON iq.item_id = i.id
      WHERE iq.item_id IN (${componentIdParams.join(',')})`
    const params = [...componentIds]
    
    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    query += ' GROUP BY iq.item_id'
    
    const stocks = await this.db.query(query, params)

    const stockMap = {}
    for (const s of stocks) {
      stockMap[s.item_id] = parseFloat(s.stock)
    }

    let minStock = Infinity
    for (const comp of components) {
      const availableStock = stockMap[comp.item_id] || 0
      const possibleKits = Math.floor(availableStock / comp.quantity)
      minStock = Math.min(minStock, possibleKits)
    }

    return minStock === Infinity ? 0 : minStock
  }

  async validateKitComponents (components, companyId) {
    if (!components || components.length === 0) return

    const componentIds = components.map(c => c.item_id)
    const componentIdParams = componentIds.map(() => 'UUID_TO_BIN(?)')
    let query = `
      SELECT BIN_TO_UUID(i.id) as id, i.name, COALESCE(SUM(iq.quantity), 0) as stock
      FROM items i
      LEFT JOIN item_quantities iq ON i.id = iq.item_id
      WHERE i.id IN (${componentIdParams.join(',')})`
    const params = [...componentIds]
    
    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    query += ' GROUP BY i.id'
    
    const stocks = await this.db.query(query, params)

    const stockMap = {}
    for (const s of stocks) {
      stockMap[s.id] = { name: s.name, stock: parseFloat(s.stock) }
    }

    const insufficient = []
    for (const comp of components) {
      const info = stockMap[comp.item_id]
      if (!info || info.stock < comp.quantity) {
        insufficient.push({
          item_id: comp.item_id,
          item_name: info?.name || 'Unknown',
          required: comp.quantity,
          available: info?.stock || 0
        })
      }
    }

    if (insufficient.length > 0) {
      const messages = insufficient.map(i => 
        `${i.item_name}: requiere ${i.required}, disponible ${i.available}`
      ).join(', ')
      throw new BadRequestError(`Stock insuficiente para componentes del kit: ${messages}`)
    }
  }

  async saveKitComponents (kitItemId, components, companyId) {
    if (!components || components.length === 0) return
    
    await this.db.query('DELETE FROM kit_components WHERE kit_item_id = UUID_TO_BIN(?)', [kitItemId])
    
    for (const comp of components) {
      await this.db.query(`
        INSERT INTO kit_components (id, kit_item_id, component_item_id, quantity)
        VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN(?), UUID_TO_BIN(?), ?)
      `, [kitItemId, comp.item_id, comp.quantity])
    }
  }

  async deleteKitComponents (kitItemId, companyId) {
    let query = 'DELETE kc FROM kit_components kc JOIN items i ON kc.kit_item_id = i.id WHERE kc.kit_item_id = UUID_TO_BIN(?)'
    const params = [kitItemId]
    
    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    await this.db.query(query, params)
  }

  async getKitsByComponent (componentItemId, companyId) {
    let query = `
      SELECT 
        BIN_TO_UUID(kc.kit_item_id) as kit_item_id,
        i.name as kit_name,
        kc.quantity as component_quantity
      FROM kit_components kc
      JOIN items i ON kc.kit_item_id = i.id
      WHERE kc.component_item_id = UUID_TO_BIN(?) 
        AND i.is_delete = 0`
    const params = [componentItemId]
    
    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const rows = await this.db.query(query, params)
    return rows
  }

  async getKitComponents (kitItemId, companyId) {
    let query = `
      SELECT 
        BIN_TO_UUID(kc.component_item_id) as component_item_id,
        kc.quantity,
        i.name as item_name,
        i.item_number
      FROM kit_components kc
      JOIN items i ON kc.component_item_id = i.id
      WHERE kc.kit_item_id = UUID_TO_BIN(?)`
    const params = [kitItemId]
    
    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const rows = await this.db.query(query, params)
    return rows
  }

  async getItemUnits (itemId, companyId) {
    let query = `
      SELECT 
        BIN_TO_UUID(iu.id) as id,
        BIN_TO_UUID(iu.item_id) as item_id,
        BIN_TO_UUID(iu.unit_id) as unit_id,
        iu.price,
        iu.cost_price,
        iu.barcode,
        iu.is_default,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation,
        u.type as unit_type
      FROM item_units iu
      JOIN units_of_measure u ON iu.unit_id = u.id
      JOIN items i ON iu.item_id = i.id
      WHERE iu.item_id = UUID_TO_BIN(?) AND iu.is_active = 1`
    const params = [itemId]
    
    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    query += ' ORDER BY iu.is_default DESC, u.name'
    
    const rows = await this.db.query(query, params)
    return rows
  }

  async getDefaultItemUnit (itemId, companyId) {
    let query = `
      SELECT 
        BIN_TO_UUID(iu.id) as id,
        BIN_TO_UUID(iu.item_id) as item_id,
        BIN_TO_UUID(iu.unit_id) as unit_id,
        iu.price,
        iu.cost_price,
        iu.barcode,
        iu.is_default,
        u.name as unit_name,
        u.abbreviation as unit_abbreviation
      FROM item_units iu
      JOIN units_of_measure u ON iu.unit_id = u.id
      JOIN items i ON iu.item_id = i.id
      WHERE iu.item_id = UUID_TO_BIN(?) AND iu.is_default = 1 AND iu.is_active = 1`
    const params = [itemId]
    
    if (companyId) {
      query += ' AND i.company_id = UUID_TO_BIN(?)'
      params.push(companyId)
    }
    
    const rows = await this.db.query(query, params)
    return rows[0] || null
  }

  async savePriceHistory(itemId, before, after, userId, companyId) {
    await this.db.query(`
      INSERT INTO product_price_history 
        (item_id, company_id, cost_price_before, unit_price_before, margin_before, cost_price_after, unit_price_after, margin_after, created_by)
      VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, UUID_TO_BIN(?))
    `, [
      itemId,
      companyId,
      before.cost_price || 0,
      before.unit_price || 0,
      before.margin || 0,
      after.cost_price || 0,
      after.unit_price || 0,
      after.margin || 0,
      userId
    ])
  }

  async getPriceHistory(itemId, limit = 50) {
    const rows = await this.db.query(`
      SELECT 
        BIN_TO_UUID(pph.id) as id,
        BIN_TO_UUID(pph.item_id) as item_id,
        pph.cost_price_before,
        pph.unit_price_before,
        pph.margin_before,
        pph.cost_price_after,
        pph.unit_price_after,
        pph.margin_after,
        pph.created_at,
        BIN_TO_UUID(pph.created_by) as created_by,
        u.username as created_by_name
      FROM product_price_history pph
      LEFT JOIN users u ON pph.created_by = u.id
      WHERE pph.item_id = UUID_TO_BIN(?)
      ORDER BY pph.created_at DESC
      LIMIT ?
    `, [itemId, limit])
    return rows
  }
}
