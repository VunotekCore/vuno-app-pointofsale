import { Server } from 'socket.io'

let io = null

export function initSocketServer (server) {
  const CORS_ORIGINS = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5174', 'http://localhost:5173', 'http://localhost:4173']

  io = new Server(server, {
    cors: {
      origin: CORS_ORIGINS,
      methods: ['GET', 'POST']
    }
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-pos', (data) => {
      socket.join('pos-room')
      console.log('Client joined pos-room:', socket.id)
    })

    socket.on('sale-update', (data) => {
      io.to('pos-room').emit('sale-updated', data)
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}

export function getIO () {
  return io
}

export function emitToPosRoom (event, data) {
  if (io) {
    io.to('pos-room').emit(event, data)
  }
}
