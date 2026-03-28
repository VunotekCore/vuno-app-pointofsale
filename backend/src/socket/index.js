import { Server } from 'socket.io'

let io = null

export function initSocketServer (server) {
  io = new Server(server, {
    cors: {
      origin: '*',
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
