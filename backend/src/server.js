import app from './app.js'
// import dotenv from 'dotenv'
import { permissionsService } from './utils/permissions.utils.js'
import { initSocketServer } from './socket/index.js'
import { createServer } from 'http'
import { dbKeepAlive } from './utils/db-keepalive.js'

// dotenv.config()

const PORT = process.env.PORT || 3000
const DB_KEEPALIVE_INTERVAL = 13 * 60 * 1000

setInterval(dbKeepAlive, DB_KEEPALIVE_INTERVAL)

const startServer = async () => {
  await permissionsService.loadPermissions()

  const httpServer = createServer(app)
  initSocketServer(httpServer)

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

startServer()
