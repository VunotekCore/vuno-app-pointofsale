import { CompanyRepository } from '../repository/company.repository.js'
import { UserRepository } from '../repository/user.repository.js'
import { NotFoundError, BadRequestError } from '../errors/index.js'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

export class CompanyModel {
  constructor (db) {
    this.db = db
    this.companyRepo = new CompanyRepository(db)
    this.userRepo = new UserRepository(db)
  }

  async createCompany (data) {
    if (!data.name || data.name.trim().length < 2) {
      throw new BadRequestError('El nombre de la empresa es requerido (mínimo 2 caracteres)')
    }

    if (!data.admin_username || !data.admin_email || !data.admin_password) {
      throw new BadRequestError('Los datos del administrador son requeridos')
    }

    const existing = await this.companyRepo.findBySlug(this.companyRepo.generateSlug(data.name))
    if (existing) {
      throw new BadRequestError('Ya existe una empresa con ese nombre')
    }

    const conn = await this.db.getConnection()
    try {
      await conn.beginTransaction()

      const companyId = uuidv4()
      const slug = this.companyRepo.generateSlug(data.name)

      await conn.query(
        `INSERT INTO companies (id, name, slug, logo_url, address, phone, business_email, nit, invoice_prefix, invoice_sequence, currency_code, currency_symbol, decimal_places, expiration_alert_days, is_active)
         VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          companyId,
          data.name.trim(),
          slug,
          data.logo_url || null,
          data.address || null,
          data.phone || null,
          data.business_email || data.email || null,
          data.nit || null,
          data.invoice_prefix || 'F',
          data.invoice_sequence || 1,
          data.currency_code || 'NIO',
          data.currency_symbol || 'C$',
          data.decimal_places || 2,
          data.expiration_alert_days || 10
        ]
      )

      const adminRoleId = await this.createRole(conn, companyId, {
        name: 'Admin',
        description: 'Administrador con todos los permisos',
        is_admin: 1
      })

      const globalAdminRoleId = await this.getGlobalAdminRoleId(conn)
      const allPermissions = await conn.query(
        `SELECT rp.permission_id 
         FROM role_permissions rp 
         WHERE rp.role_id = UUID_TO_BIN(?)`,
        [globalAdminRoleId]
      )
      for (const perm of allPermissions) {
        await conn.query(
          'INSERT INTO role_permissions (role_id, permission_id, company_id) VALUES (UUID_TO_BIN(?), ?, UUID_TO_BIN(?))',
          [adminRoleId, perm.permission_id, companyId]
        )
      }

      await this.createRole(conn, companyId, {
        name: 'Manager',
        description: 'Gerente',
        is_admin: 0
      })

      await this.createRole(conn, companyId, {
        name: 'Cashier',
        description: 'Cajero',
        is_admin: 0
      })

      const userId = uuidv4()
      const passwordHash = bcrypt.hashSync(data.admin_password, 10)

      await conn.query(
        `INSERT INTO users (id, username, email, password_hash, role_id, company_id, is_active)
         VALUES (UUID_TO_BIN(?), ?, ?, ?, UUID_TO_BIN(?), UUID_TO_BIN(?), 1)`,
        [userId, data.admin_username, data.admin_email, passwordHash, adminRoleId, companyId]
      )

      await conn.commit()

      return {
        id: companyId,
        name: data.name.trim(),
        slug,
        logo_url: data.logo_url,
        settings: data.settings,
        is_active: true,
        admin: {
          id: userId,
          username: data.admin_username,
          email: data.admin_email
        }
      }
    } catch (error) {
      await conn.rollback()
      throw error
    } finally {
      conn.release()
    }
  }

  async createRole (conn, companyId, roleData) {
    const roleId = uuidv4()
    await conn.query(
      'INSERT INTO roles (id, name, description, is_admin, company_id) VALUES (UUID_TO_BIN(?), ?, ?, ?, UUID_TO_BIN(?))',
      [roleId, roleData.name, roleData.description || null, roleData.is_admin || 0, companyId]
    )
    return roleId
  }

  async getGlobalAdminRoleId (conn) {
    const globalCompanyId = '00000000-0000-0000-0000-000000000001'
    const rows = await conn.query(
      'SELECT BIN_TO_UUID(id) as id FROM roles WHERE company_id = UUID_TO_BIN(?) AND is_admin = 1 LIMIT 1',
      [globalCompanyId]
    )
    if (rows.length === 0) {
      throw new NotFoundError('No se encontró el rol Admin global')
    }
    return rows[0].id
  }

  async getCompanyById (id) {
    const company = await this.companyRepo.findById(id)
    if (!company) {
      throw new NotFoundError('Empresa no encontrada')
    }
    return company
  }

  async getCompanyBySlug (slug) {
    const company = await this.companyRepo.findBySlug(slug)
    if (!company) {
      throw new NotFoundError('Empresa no encontrada')
    }
    return company
  }

  async getAllCompanies (filters = {}) {
    const companies = await this.companyRepo.findAll(filters)
    return companies
  }

  async updateCompany (id, data) {
    const existing = await this.companyRepo.findById(id)
    if (!existing) {
      throw new NotFoundError('Empresa no encontrada')
    }

    if (data.name && data.name.trim() !== existing.name) {
      const slugConflict = await this.companyRepo.findBySlug(this.companyRepo.generateSlug(data.name))
      if (slugConflict && slugConflict.id !== id) {
        throw new BadRequestError('Ya existe una empresa con ese nombre')
      }
    }

    const updated = await this.companyRepo.update(id, {
      name: data.name?.trim(),
      logo_url: data.logo_url,
      address: data.address,
      phone: data.phone,
      business_email: data.business_email,
      nit: data.nit,
      invoice_prefix: data.invoice_prefix,
      invoice_sequence: data.invoice_sequence,
      currency_code: data.currency_code,
      currency_symbol: data.currency_symbol,
      decimal_places: data.decimal_places,
      expiration_alert_days: data.expiration_alert_days,
      is_active: data.is_active,
      imagekit_private_key: data.imagekit_private_key,
      imagekit_url_endpoint: data.imagekit_url_endpoint
    })

    if (data.admin_user_id && data.admin_new_password) {
      await this.changeAdminPassword(id, data.admin_user_id, data.admin_new_password)
    }

    return updated
  }

  async deleteCompany (id) {
    const existing = await this.companyRepo.findById(id)
    if (!existing) {
      throw new NotFoundError('Empresa no encontrada')
    }

    await this.companyRepo.delete(id)
    return { success: true }
  }

  async getCompanyStats (id) {
    const company = await this.companyRepo.findById(id)
    if (!company) {
      throw new NotFoundError('Empresa no encontrada')
    }

    return await this.companyRepo.getStats(id)
  }

  async getCompanyWithStats (id) {
    const company = await this.companyRepo.findById(id)
    if (!company) {
      throw new NotFoundError('Empresa no encontrada')
    }

    const stats = await this.companyRepo.getStats(id)
    return { ...company, stats }
  }

  async getCompanyAdmin (id) {
    const company = await this.companyRepo.findById(id)
    if (!company) {
      throw new NotFoundError('Empresa no encontrada')
    }

    const admin = await this.companyRepo.getAdminUser(id)
    return { company, admin }
  }

  async changeAdminPassword (companyId, userId, newPassword) {
    const company = await this.companyRepo.findById(companyId)
    if (!company) {
      throw new NotFoundError('Empresa no encontrada')
    }

    const user = await this.userRepo.findById(userId)
    if (!user) {
      throw new NotFoundError('Usuario no encontrado')
    }

    const userCompanyBin = Buffer.isBuffer(user.company_id)
      ? user.company_id.toString('hex')
      : user.company_id
    const companyBin = Buffer.from(companyId.replace(/-/g, ''), 'hex').toString('hex')

    if (userCompanyBin !== companyBin) {
      throw new BadRequestError('El usuario no pertenece a esta empresa')
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10)
    await this.userRepo.updatePassword(userId, passwordHash)

    return { success: true }
  }
}
