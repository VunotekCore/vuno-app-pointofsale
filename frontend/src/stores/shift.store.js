import { defineStore } from 'pinia'
import { shiftService } from '../services/shift.service.js'

export const useShiftStore = defineStore('shift', {
  state: () => ({
    shiftConfigs: [],
    openSession: null,
    closeReminders: [],
    loading: false,
    shiftReminders: []
  }),

  getters: {
    hasOpenSession: (state) => state.openSession !== null,
    
    activeShiftsForToday: (state) => {
      const now = new Date()
      const currentDayOfWeek = now.getDay()
      const currentTime = now.toTimeString().slice(0, 8)
      
      return state.shiftConfigs.filter(shift => {
        if (!shift.is_active) return false
        return shift.start_time <= currentTime && shift.end_time >= currentTime
      })
    }
  },

  actions: {
    async loadShiftConfigs(locationId = null) {
      this.loading = true
      try {
        const { data } = await shiftService.getShiftConfigs(locationId)
        if (data.success) {
          this.shiftConfigs = data.data
        }
      } catch (error) {
        console.error('Error loading shift configs:', error)
      } finally {
        this.loading = false
      }
    },

    async createShiftConfig(data) {
      const { data: response } = await shiftService.createShiftConfig(data)
      if (response.success) {
        await this.loadShiftConfigs()
        return response
      }
      throw new Error(response.message)
    },

    async updateShiftConfig(id, data) {
      const { data: response } = await shiftService.updateShiftConfig(id, data)
      if (response.success) {
        await this.loadShiftConfigs()
        return response
      }
      throw new Error(response.message)
    },

    async deleteShiftConfig(id) {
      const { data: response } = await shiftService.deleteShiftConfig(id)
      if (response.success) {
        await this.loadShiftConfigs()
        return response
      }
      throw new Error(response.message)
    },

    async checkOpenSession(locationId) {
      this.loading = true
      try {
        const { data } = await shiftService.getOpenSession(locationId)
        if (data.success && data.data) {
          this.openSession = data.data
        } else {
          this.openSession = null
        }
      } catch (error) {
        this.openSession = null
      } finally {
        this.loading = false
      }
    },

    async checkCloseReminders(locationId) {
      try {
        const { data } = await shiftService.getCloseReminders(locationId)
        if (data.success) {
          this.closeReminders = data.data
          return data.data
        }
      } catch (error) {
        console.error('Error checking close reminders:', error)
      }
      return []
    },

    startReminderCheck(locationId, intervalMs = 60000) {
      if (this.reminderInterval) {
        clearInterval(this.reminderInterval)
      }
      
      this.reminderInterval = setInterval(() => {
        this.checkCloseReminders(locationId)
      }, intervalMs)
    },

    stopReminderCheck() {
      if (this.reminderInterval) {
        clearInterval(this.reminderInterval)
        this.reminderInterval = null
      }
    }
  }
})
