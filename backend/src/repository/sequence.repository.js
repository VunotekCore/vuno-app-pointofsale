import crypto from 'crypto'
import pool from '../config/database.js'
import { CompanyRepository } from './company.repository.js'

const ENTITY_SEQUENCE_MAP = {
  sale: 'invoice_sequence',
  return: 'return_sequence',
  purchase_order: 'purchase_order_sequence',
  receiving: 'receiving_sequence',
  transfer: 'transfer_sequence',
  adjustment: 'adjustment_sequence'
}

const ENTITY_PREFIX_MAP = {
  sale: 'F',
  return: 'RET',
  purchase_order: 'OC',
  receiving: 'REC',
  transfer: 'TRF',
  adjustment: 'ADJ'
}

export class SequenceRepository {
  constructor(db = pool, companyRepo = null) {
    this.db = db
    this.companyRepo = companyRepo || new CompanyRepository(db)
  }

  async getNext(companyId, entityType) {
    if (!companyId) {
      throw new Error('companyId es requerido')
    }

    if (!entityType) {
      throw new Error('entityType es requerido')
    }

    const normalizedType = entityType.toLowerCase()
    const prefix = ENTITY_PREFIX_MAP[normalizedType]

    if (!prefix) {
      throw new Error(`Tipo de entidad no válido: ${entityType}`)
    }

    const company = await this.companyRepo.findById(companyId)
    if (!company) {
      throw new Error('Compañía no encontrada')
    }

    let currentSeq = await this.getCurrent(companyId, normalizedType)

    if (currentSeq === null) {
      const initialField = ENTITY_SEQUENCE_MAP[normalizedType]
      const initialValue = company[initialField] || 1
      currentSeq = initialValue - 1
    }

    const nextSeq = currentSeq + 1
    const docNumber = `${prefix}-${String(nextSeq).padStart(6, '0')}`

    await this.save(companyId, normalizedType, nextSeq)

    return { docNumber, sequence: nextSeq, entityType: normalizedType }
  }

  async getCurrent(companyId, entityType) {
    const normalizedType = entityType.toLowerCase()

    const rows = await this.db.query(
      `SELECT last_number FROM sequences 
       WHERE company_id = UUID_TO_BIN(?) AND entity_type = ?`,
      [companyId, normalizedType]
    )

    return rows.length > 0 ? rows[0].last_number : null
  }

  async save(companyId, entityType, lastNumber, dbConn = null) {
    const normalizedType = entityType.toLowerCase()
    const id = crypto.randomUUID()
    const db = dbConn || this.db

    const rows = await db.query(
      `SELECT id FROM sequences 
       WHERE company_id = UUID_TO_BIN(?) AND entity_type = ?`,
      [companyId, normalizedType]
    )

    if (rows.length > 0) {
      await db.query(
        `UPDATE sequences SET last_number = ?, updated_at = NOW() 
         WHERE company_id = UUID_TO_BIN(?) AND entity_type = ?`,
        [lastNumber, companyId, normalizedType]
      )
    } else {
      await db.query(
        `INSERT INTO sequences (id, company_id, entity_type, last_number) 
         VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?)`,
        [id, companyId, normalizedType, lastNumber]
      )
    }
  }

  async getNextWithConnection(dbConn, companyId, entityType) {
    if (!companyId) {
      throw new Error('companyId es requerido')
    }

    if (!entityType) {
      throw new Error('entityType es requerido')
    }

    const normalizedType = entityType.toLowerCase()
    const prefix = ENTITY_PREFIX_MAP[normalizedType]

    if (!prefix) {
      throw new Error(`Tipo de entidad no válido: ${entityType}`)
    }

    const company = await this.companyRepo.findById(companyId)
    if (!company) {
      throw new Error('Compañía no encontrada')
    }

    let currentSeq = await this.getCurrentWithConnection(dbConn, companyId, normalizedType)

    if (currentSeq === null) {
      const initialField = ENTITY_SEQUENCE_MAP[normalizedType]
      const initialValue = company[initialField] || 1
      currentSeq = initialValue - 1
    }

    const nextSeq = currentSeq + 1
    const docNumber = `${prefix}-${String(nextSeq).padStart(6, '0')}`

    await this.save(companyId, normalizedType, nextSeq, dbConn)

    return { docNumber, sequence: nextSeq, entityType: normalizedType }
  }

  async getCurrentWithConnection(dbConn, companyId, entityType) {
    const normalizedType = entityType.toLowerCase()

    const rows = await dbConn.query(
      `SELECT last_number FROM sequences 
       WHERE company_id = UUID_TO_BIN(?) AND entity_type = ?`,
      [companyId, entityType]
    )

    return rows.length > 0 ? rows[0].last_number : null
  }
}