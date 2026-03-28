import express from 'express'
import cors from 'cors'
import routers from './router/index.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.get('/', (req, res) => {
  res.json({ message: 'API vuno-app-pointofsale running' })
})

app.use('/login', routers.authRouter)
app.use('/password', routers.authRouter)
app.use('/users', routers.usersRouter)
app.use('/users-locations', routers.userLocationsRouter)
app.use('/roles', routers.rolesRouter)
app.use('/permissions', routers.permissionsRouter)
app.use('/company-config', routers.companyConfigRouter)
app.use('/items', routers.itemsRouter)
app.use('/inventory', routers.inventoryRouter)
app.use('/sales', routers.salesRouter)
app.use('/customers', routers.customersRouter)
app.use('/payments', routers.paymentRouter)
app.use('/employees', routers.employeesRouter)
app.use('/core', routers.coreRouter)
app.use('/dashboard', routers.dashboardRouter)
app.use('/shifts', routers.shiftRouter)
app.use('/suppliers', routers.supplierRouter)
app.use('/purchase-orders', routers.purchaseOrderRouter)
app.use('/receivings', routers.receivingRouter)
app.use('/sync', routers.syncRouter)
app.use('/platform', routers.platformUserRouter)
app.use('/platform/companies', routers.companyRouter)
app.use('/companies', routers.companyMeRouter)
app.use('/platform/users', routers.platformUserProtectedRouter)
app.use('/units', routers.unitsRouter)
app.use('/reports', routers.reportsRouter)

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use(errorHandler)

export default app
