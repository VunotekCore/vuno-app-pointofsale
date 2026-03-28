import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLocationStore = defineStore('location', () => {
  const selectedLocationId = ref(null)
  const locations = ref([])

  function setLocations(locs) {
    locations.value = locs
    if (locs.length > 0 && !selectedLocationId.value) {
      selectedLocationId.value = locs[0].id
    }
  }

  function setSelectedLocation(loc) {
    selectedLocationId.value = loc?.id || null
  }

  function getSelectedLocation() {
    return locations.value.find(l => l.id === selectedLocationId.value) || null
  }

  return {
    selectedLocationId,
    locations,
    setLocations,
    setSelectedLocation,
    getSelectedLocation
  }
})
