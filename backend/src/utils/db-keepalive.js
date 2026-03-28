import database from '../config/database.js'

const formatDate = () => {
  return new Date().toISOString()
}

export const dbKeepAlive = async () => {
  console.log('testing keepalive')
  try {
    const result = await database.testConnection()
    if (result) {
      console.log(`[${formatDate()}] DB Keep-Alive: OK`)
    } else {
      console.error(`[${formatDate()}] DB Keep-Alive: FAILED`)
    }
    return result
  } catch (error) {
    console.error(`[${formatDate()}] DB Keep-Alive Error: ${error.message}`)
    return false
  }
}
