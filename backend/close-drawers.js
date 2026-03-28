import Database from './src/config/database.js'

const db = new Database()

async function closeAllDrawers() {
  const rows = await db.query('SELECT id, name, status, opened_at FROM cash_drawers WHERE status = "open"')
  console.log('Cajas abiertas encontradas:', rows.length)
  for (const r of rows) {
    console.log(' - ID:', r.id, '|', r.name)
  }

  await db.query('UPDATE cash_drawers SET status = "closed", closed_at = NOW() WHERE status = "open"')
  console.log('Todas las cajas abiertas han sido cerradas')

  process.exit(0)
}

closeAllDrawers().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
