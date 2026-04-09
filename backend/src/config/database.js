import mysql from 'mysql2/promise'
import { DatabaseError } from '../errors/index.js'

const getDatabaseErrorMessage = (error) => {
  const errorMessages = {
    ECONNREFUSED: 'El servidor de base de datos no está iniciado',
    ER_ACCESS_DENIED_ERROR: 'Credenciales de base de datos incorrectas',
    ER_NO_SUCH_TABLE: 'La tabla no existe',
    ER_TABLE_EXISTS_ERROR: 'La tabla ya existe',
    ER_DBACCESS_DENIED_ERROR: 'Sin acceso a la base de datos',
    PROTOCOL_CONNECTION_LOST: 'Conexión con la base de datos perdida',
    ETIMEDOUT: 'Tiempo de conexión con la base de datos agotado',
    ER_DUP_ENTRY: 'Registro duplicado',
    ER_NO_REFERENCED_ROW_2: 'Registro relacionado no encontrado',
    ER_ROW_IS_REFERENCED_2: 'El registro está siendo utilizado'
  }
  return errorMessages[error.code] || error.message
}

/**
 * Database connection manager
 * Provides connection pooling and query execution
 */
export class Database {
  constructor () {
    const isProduction = process.env.NODE_ENV === 'production'

    const sslOptions = isProduction
      ? {
          rejectUnauthorized: false
        }
      : undefined

    this.pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'vuno_pointofsale',
      port: process.env.MYSQL_PORT || 3306,
      ssl: sslOptions,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    })
  }

  async query (sql, params) {
    try {
      const [rows] = await this.pool.query(sql, params)
      return rows
    } catch (error) {
      const message = getDatabaseErrorMessage(error)
      throw new DatabaseError(message)
    }
  }

  async execute (sql, params) {
    try {
      const [rows] = await this.pool.query(sql, params)
      return rows
    } catch (error) {
      const message = getDatabaseErrorMessage(error)
      throw new DatabaseError(message)
    }
  }

  async getConnection () {
    const conn = await this.pool.getConnection()
    // Wrap connection to provide .query() method like pool (capture original first!)
    const originalQuery = conn.query.bind(conn)
    conn.query = async (sql, params) => {
      const [rows] = await originalQuery(sql, params)
      return rows
    }
    return conn
  }

  async testConnection () {
    try {
      await this.pool.query('SELECT 1 + 2  as three;')
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }
}

const database = new Database()
export default database
