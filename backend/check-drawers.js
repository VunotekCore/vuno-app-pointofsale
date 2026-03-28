import { Database } from './src/config/database.js'

const db = new Database()

const rows = await db.query('SELECT id, location_id, name, status, opened_at FROM cash_drawers WHERE status = "open"')
console.log('Cajas abiertas:', JSON.stringify(rows, null, 2))
