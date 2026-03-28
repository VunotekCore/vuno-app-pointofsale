import { defineStore } from 'pinia'
import { paymentService } from '../services/payment.service.js'

export const useCashDrawerStore = defineStore('cashDrawer', {
  state: () => ({
    currentDrawer: null,
    cashSummary: null,
    drawerHistory: [],
    loading: false,
    startDate: null,
    endDate: null
  }),

  getters: {
    isDrawerOpen: (state) => state.currentDrawer?.status === 'open',
    
    difference: (state) => {
      if (!state.cashSummary || !state.currentDrawer) return 0
      const counted = parseFloat(state.currentDrawer.current_amount || 0)
      return counted - state.cashSummary.expected_cash
    }
  },

  actions: {
    setDefaultDates() {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      this.startDate = startOfDay.toISOString()
      this.endDate = now.toISOString()
    },

    async checkOpenDrawer(locationId) {
      this.loading = true
      try {
        const { data } = await paymentService.getOpenDrawer(locationId)
        if (data.success && data.data) {
          this.currentDrawer = data.data
          this.setDefaultDates()
          await this.loadCashSummary(this.currentDrawer.id)
        } else {
          this.currentDrawer = null
          this.cashSummary = null
        }
      } catch (error) {
        this.currentDrawer = null
        this.cashSummary = null
      } finally {
        this.loading = false
      }
    },

    async loadCashSummary(drawerId, startDate = null, endDate = null) {
      try {
        const params = {}
        if (startDate) params.start_date = startDate
        if (endDate) params.end_date = endDate
        
        const { data } = await paymentService.getCashSummary(drawerId, params)
        if (data.success) {
          this.cashSummary = data.data
        }
      } catch (error) {
        console.error('Error loading cash summary:', error)
      }
    },

    async openDrawer(data) {
      this.loading = true
      try {
        const { data: response } = await paymentService.openDrawer(data)
        if (response.success) {
          this.currentDrawer = response.data
          await this.loadCashSummary(this.currentDrawer.id)
          return response
        }
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async closeDrawer(id, closingAmount, notes) {
      this.loading = true
      try {
        const { data: response } = await paymentService.closeDrawer(id, {
          closing_amount: closingAmount,
          notes
        })
        this.currentDrawer = null
        this.cashSummary = null
        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async loadHistory(locationId) {
      try {
        const { data } = await paymentService.getDrawerHistory(locationId)
        if (data.success) {
          this.drawerHistory = data.data
        }
      } catch (error) {
        console.error('Error loading drawer history:', error)
      }
    },

    async downloadClosePDF(drawerId) {
      try {
        const response = await paymentService.downloadClosePDF(drawerId)
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `cierre-caja-${drawerId}-${new Date().toISOString().split('T')[0]}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
      } catch (error) {
        console.error('Error downloading close PDF:', error)
        throw error
      }
    },

    async addWithdrawal(drawerId, amount, notes) {
      this.loading = true
      try {
        const { data: response } = await paymentService.addDrawerTransaction(drawerId, {
          transaction_type: 'withdrawal',
          amount: parseFloat(amount),
          notes
        })
        if (response.success) {
          await this.loadCashSummary(drawerId)
          await this.checkOpenDrawer(this.currentDrawer.location_id)
        }
        return response
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
