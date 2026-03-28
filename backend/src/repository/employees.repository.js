import pool from '../config/database.js'
import { NotFoundError } from '../errors/NotFoundError.js'

function UUID_TO_BIN(uuid) {
  return uuid
}

function BIN_TO_UUID(binary) {
  return binary
}

export class EmployeesRepository {
  constructor(db = pool) {
    this.db = db
  }

  async getAll(filters = {}) {
    const { search, is_active, position, department, limit = 100, offset = 0 } = filters

    let query = `
      SELECT BIN_TO_UUID(e.id) as id, BIN_TO_UUID(e.user_id) as user_id, e.employee_number, e.first_name, e.last_name, e.phone, e.email, e.address, e.city, e.state, e.country, e.postal_code, e.photo_url, e.hire_date, e.position, e.department, e.salary, e.emergency_contact_name, e.emergency_contact_phone, e.notes, e.is_active, e.created_at, e.updated_at, u.username, u.email as user_email, u.role_id, r.name as role_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE 1=1
    `
    const params = []

    if (search) {
      query += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_number LIKE ? OR u.username LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (is_active !== undefined && is_active !== null) {
      query += ' AND e.is_active = ?'
      params.push(is_active)
    }

    if (position) {
      query += ' AND e.position = ?'
      params.push(position)
    }

    if (department) {
      query += ' AND e.department = ?'
      params.push(department)
    }

    query += ' ORDER BY e.first_name, e.last_name LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    return await this.db.query(query, params)
  }

  async getCount(filters = {}) {
    const { search, is_active, position, department } = filters

    let query = `SELECT COUNT(*) as total FROM employees e JOIN users u ON e.user_id = u.id WHERE 1=1`
    const params = []

    if (search) {
      query += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_number LIKE ? OR u.username LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (is_active !== undefined && is_active !== null) {
      query += ' AND e.is_active = ?'
      params.push(is_active)
    }

    const rows = await this.db.query(query, params)
    return rows[0].total
  }

  async getById(id) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(e.id) as id, BIN_TO_UUID(e.user_id) as user_id, e.employee_number, e.first_name, e.last_name, e.phone, e.email, e.address, e.city, e.state, e.country, e.postal_code, e.photo_url, e.hire_date, e.position, e.department, e.salary, e.emergency_contact_name, e.emergency_contact_phone, e.notes, e.is_active, e.created_at, e.updated_at, u.username, u.email as user_email, u.role_id, r.name as role_name
       FROM employees e
       JOIN users u ON e.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE e.id = UUID_TO_BIN('${id}')`
    )
    return rows[0] || null
  }

  async getByUserId(userId) {
    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(e.id) as id, BIN_TO_UUID(e.user_id) as user_id, e.employee_number, e.first_name, e.last_name, e.phone, e.email, e.address, e.city, e.state, e.country, e.postal_code, e.photo_url, e.hire_date, e.position, e.department, e.salary, e.emergency_contact_name, e.emergency_contact_phone, e.notes, e.is_active, e.created_at, e.updated_at, u.username, u.email as user_email, u.role_id, r.name as role_name
       FROM employees e
       JOIN users u ON e.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE e.user_id = UUID_TO_BIN(?)`,
      [userId]
    )
    return rows[0] || null
  }

  async create(data) {
    const {
      user_id,
      employee_number,
      first_name,
      last_name,
      phone,
      email,
      address,
      city,
      state,
      country,
      postal_code,
      photo_url,
      hire_date,
      position,
      department,
      salary,
      emergency_contact_name,
      emergency_contact_phone,
      notes
    } = data

    const result = await this.db.query(
      `INSERT INTO employees (id, user_id, employee_number, first_name, last_name, phone, email, address, city, state, country, postal_code, photo_url, hire_date, position, department, salary, emergency_contact_name, emergency_contact_phone, notes)
       VALUES (UUID_TO_BIN(UUID()), UUID_TO_BIN('${user_id}'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_number,
        first_name,
        last_name,
        phone,
        email,
        address,
        city,
        state,
        country || 'Mexico',
        postal_code,
        photo_url,
        hire_date,
        position,
        department,
        salary,
        emergency_contact_name,
        emergency_contact_phone,
        notes
      ]
    )

    const rows = await this.db.query(
      `SELECT BIN_TO_UUID(id) as id, BIN_TO_UUID(user_id) as user_id FROM employees ORDER BY created_at DESC LIMIT 1`
    )
    return rows[0]?.id
  }

  async update(id, data) {
    const employee = await this.getById(id)
    if (!employee) throw new NotFoundError('Empleado no encontrado')

    const fields = []
    const values = []

    const allowedFields = [
      'employee_number', 'first_name', 'last_name', 'phone', 'email',
      'address', 'city', 'state', 'country', 'postal_code', 'photo_url',
      'hire_date', 'position', 'department', 'salary',
      'emergency_contact_name', 'emergency_contact_phone', 'notes', 'is_active'
    ]

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (fields.length === 0) return false

    await this.db.query(
      `UPDATE employees SET ${fields.join(', ')} WHERE id = UUID_TO_BIN('${id}')`,
      values
    )

    return await this.getById(id)
  }

  async delete(id) {
    await this.db.query(`UPDATE employees SET is_active = 0 WHERE id = UUID_TO_BIN('${id}')`)
    return true
  }

  async getPositions() {
    const rows = await this.db.query(
      'SELECT DISTINCT position FROM employees WHERE position IS NOT NULL ORDER BY position'
    )
    return rows.map(r => r.position)
  }

  async getDepartments() {
    const rows = await this.db.query(
      'SELECT DISTINCT department FROM employees WHERE department IS NOT NULL ORDER BY department'
    )
    return rows.map(r => r.department)
  }
}
