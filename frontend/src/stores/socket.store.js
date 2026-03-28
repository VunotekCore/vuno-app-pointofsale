import { defineStore } from 'pinia'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:1405'

export const useSocketStore = defineStore('socket', {
  state: () => ({
    socket: null,
    isConnected: false,
    isEmitter: false,
    currentSale: null,
    cartItems: [],
    customer: null,
    subtotal: 0,
    discount: 0,
    total: 0
  }),

  actions: {
    connect(asEmitter = false) {
      if (this.socket && this.isConnected) {
        this.isEmitter = asEmitter
        return
      }

      this.isEmitter = asEmitter

      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      })

      this.socket.on('connect', () => {
        this.isConnected = true
        // console.log('Socket connected, isEmitter:', this.isEmitter)
        this.socket.emit('join-pos')
      })

      this.socket.on('disconnect', () => {
        this.isConnected = false
        // console.log('Socket disconnected')
      })

      this.socket.on('sale-updated', (data) => {
        // console.log('Received sale-updated:', data)
        if (!this.isEmitter) {
          this.currentSale = data
          this.cartItems = data.items || []
          this.customer = data.customer
          this.subtotal = data.subtotal || 0
          this.discount = data.discount || 0
          this.total = data.total || 0
        }
      })

      this.socket.on('sale-cleared', () => {
        if (!this.isEmitter) {
          this.clearSale()
        }
      })
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        this.isConnected = false
        this.isEmitter = false
      }
    },

    emitSaleUpdate(data) {
      if (this.socket && this.isConnected) {
        // console.log('Emitting sale-update:', data)
        this.socket.emit('sale-update', data)
      } else {
        console.log('Cannot emit - not connected')
      }
    },

    clearSale() {
      this.currentSale = null
      this.cartItems = []
      this.customer = null
      this.subtotal = 0
      this.discount = 0
      this.total = 0
    }
  }
})
