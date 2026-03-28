import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { platformService } from '../services/platform.service.js'

export const useTenantStore = defineStore('tenant', () => {
  const selectedCompanyId = ref(localStorage.getItem('selected_company_id') || null)
  const companies = ref([])
  const loading = ref(false)

  const hasCompany = computed(() => !!selectedCompanyId.value)

  const selectedCompany = computed(() => {
    if (!selectedCompanyId.value) return null
    return companies.value.find(c => c.id === selectedCompanyId.value) || null
  })

  async function loadCompanies() {
    loading.value = true
    try {
      const response = await platformService.getCompanies({ is_active: 1 })
      companies.value = response.data || []
      
      if (!selectedCompanyId.value && companies.value.length > 0) {
        const defaultCompany = companies.value.find(c => c.is_default === 1) || companies.value[0]
        selectCompany(defaultCompany.id)
      }
      
      return companies.value
    } catch (error) {
      console.error('Error loading companies:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  function selectCompany(companyId) {
    selectedCompanyId.value = companyId
    localStorage.setItem('selected_company_id', companyId)
  }

  function clearSelection() {
    selectedCompanyId.value = null
    localStorage.removeItem('selected_company_id')
  }

  function getCompanyById(id) {
    return companies.value.find(c => c.id === id)
  }

  return {
    selectedCompanyId,
    selectedCompany,
    companies,
    loading,
    hasCompany,
    loadCompanies,
    selectCompany,
    clearSelection,
    getCompanyById
  }
})
