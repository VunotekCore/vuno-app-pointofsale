import { defineStore } from 'pinia'
import { ref } from 'vue'
import { unitsService } from '../services/units.service.js'

export const useUnitsStore = defineStore('units', () => {
  const units = ref([])
  const itemUnitsCache = ref({})

  async function loadUnits() {
    try {
      const { data } = await unitsService.getAll()
      units.value = data.data || []
    } catch (error) {
      console.error('Error loading units:', error)
    }
  }

  async function getItemUnits(itemId) {
    if (itemUnitsCache.value[itemId]) {
      return itemUnitsCache.value[itemId]
    }
    
    try {
      const { data } = await unitsService.getItemUnits(itemId)
      const units = data.data || []
      itemUnitsCache.value[itemId] = units
      return units
    } catch (error) {
      console.error('Error loading item units:', error)
      return []
    }
  }

  async function createItemUnit(itemId, unitData) {
    const { data } = await unitsService.createItemUnit({
      item_id: itemId,
      ...unitData
    })
    itemUnitsCache.value[itemId] = data.data
    return data.data
  }

  async function updateItemUnit(itemUnitId, itemId, unitData) {
    const { data } = await unitsService.updateItemUnit(itemUnitId, unitData)
    itemUnitsCache.value[itemId] = data.data
    return data.data
  }

  async function deleteItemUnit(itemUnitId, itemId) {
    const { data } = await unitsService.deleteItemUnit(itemUnitId)
    itemUnitsCache.value[itemId] = data.data
    return data.data
  }

  function clearItemUnitsCache(itemId) {
    if (itemId) {
      delete itemUnitsCache.value[itemId]
    } else {
      itemUnitsCache.value = {}
    }
  }

  function getDefaultUnit(itemId) {
    const units = itemUnitsCache.value[itemId]
    if (!units) return null
    return units.find(u => u.is_default) || units[0] || null
  }

  function getUnitById(unitId) {
    return units.value.find(u => u.id === unitId) || null
  }

  function getItemUnitsSync(itemId) {
    return itemUnitsCache.value[itemId] || []
  }

  return {
    units,
    itemUnitsCache,
    loadUnits,
    getItemUnits,
    createItemUnit,
    updateItemUnit,
    deleteItemUnit,
    clearItemUnitsCache,
    getDefaultUnit,
    getUnitById,
    getItemUnitsSync
  }
})
