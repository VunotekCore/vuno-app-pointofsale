import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { itemsService, coreService } from '../services/inventory.service.js'

export const useItemsStore = defineStore('items', () => {
  const items = ref([])
  const categories = ref([])
  const loading = ref(false)
  const lastLoadedLocation = ref(null)
  const lastLoadedTime = ref(null)
  const CACHE_DURATION = 5 * 60 * 1000

  const itemsByCategory = computed(() => {
    const grouped = {}
    
    items.value.forEach(item => {
      const qty = parseFloat(item.total_quantity) || 0
      if (qty <= 0) return
      
      const catId = item.category_id || 'uncategorized'
      const catName = item.category_name || 'Sin categoría'
      
      if (!grouped[catId]) {
        grouped[catId] = {
          id: catId,
          name: catName,
          items: []
        }
      }
      grouped[catId].items.push(item)
    })
    
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))
  })

  const activeCategories = computed(() => {
    const categoryIdsWithStock = new Set()
    items.value.forEach(item => {
      const qty = parseFloat(item.total_quantity) || 0
      if (qty > 0 && item.category_id) {
        categoryIdsWithStock.add(item.category_id)
      }
    })
    
    return categories.value.filter(c => 
      c.is_active && categoryIdsWithStock.has(c.id)
    )
  })

  const rootCategories = computed(() => {
    return categories.value.filter(c => 
      c.is_active && c.parent_id === null
    ).sort((a, b) => a.name.localeCompare(b.name))
  })

  function getCategoryById(id) {
    return categories.value.find(c => c.id === id) || null
  }

  function getSubcategories(parentId) {
    return categories.value.filter(c => 
      c.is_active && c.parent_id === parentId
    ).sort((a, b) => a.name.localeCompare(b.name))
  }

  function hasSubcategories(categoryId) {
    return categories.value.some(c => c.is_active && c.parent_id === categoryId)
  }

  function getCategoryItems(categoryId) {
    return items.value.filter(item => {
      const qty = parseFloat(item.total_quantity) || 0
      return qty > 0 && item.category_id === categoryId
    })
  }

  function getSubcategoriesWithItems(parentId) {
    const subs = getSubcategories(parentId)
    return subs.filter(sub => {
      const directItems = getCategoryItems(sub.id)
      const childSubs = getSubcategoriesWithItems(sub.id)
      return directItems.length > 0 || childSubs.length > 0
    })
  }

  function getAllItemsForCategoryTree(categoryId) {
    const directItems = getCategoryItems(categoryId)
    const subcategories = getSubcategories(categoryId)
    
    let allItems = [...directItems]
    for (const sub of subcategories) {
      allItems = allItems.concat(getAllItemsForCategoryTree(sub.id))
    }
    
    return allItems
  }

  async function loadItems(locationId = null, force = false) {
    const currentLocation = locationId || 'default'
    
    if (!force && 
        lastLoadedLocation.value === currentLocation && 
        items.value.length > 0 &&
        lastLoadedTime.value &&
        Date.now() - lastLoadedTime.value < CACHE_DURATION) {
      return
    }

    loading.value = true
    try {
      const params = locationId ? { location_id: locationId } : {}
      const { data } = await itemsService.getItems(params)
      items.value = (data.data || []).filter(i => i.status === 'active')
      lastLoadedLocation.value = currentLocation
      lastLoadedTime.value = Date.now()
    } catch (error) {
      console.error('Error loading items:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function loadCategories(force = false) {
    if (!force && categories.value.length > 0) {
      return
    }

    try {
      const { data } = await coreService.getCategories()
      categories.value = data.data || []
    } catch (error) {
      console.error('Error loading categories:', error)
      throw error
    }
  }

  async function loadAll(locationId = null) {
    await Promise.all([
      loadItems(locationId),
      loadCategories()
    ])
  }

  function getItemById(id) {
    return items.value.find(i => i.id === id) || null
  }

  function searchItems(query) {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return items.value.filter(item =>
      item.name?.toLowerCase().includes(q) ||
      item.item_number?.toLowerCase().includes(q)
    ).slice(0, 10)
  }

  function clearCache() {
    items.value = []
    categories.value = []
    lastLoadedLocation.value = null
    lastLoadedTime.value = null
  }

  return {
    items,
    categories,
    loading,
    itemsByCategory,
    activeCategories,
    rootCategories,
    getCategoryById,
    getSubcategories,
    hasSubcategories,
    getCategoryItems,
    getSubcategoriesWithItems,
    getAllItemsForCategoryTree,
    loadItems,
    loadCategories,
    loadAll,
    getItemById,
    searchItems,
    clearCache
  }
})
