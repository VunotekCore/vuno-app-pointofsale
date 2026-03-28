export const phoneUtils = {
  clean(value) {
    if (!value) return ''
    return value.replace(/[^0-9+]/g, '')
  },

  format(value) {
    const cleaned = this.clean(value)
    if (!cleaned) return ''
    
    const digits = cleaned.replace(/\D/g, '')
    
    if (digits.length <= 4) {
      return digits
    }
    
    if (digits.length <= 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4)}`
    }
    
    if (digits.length === 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    }
    
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    }
    
    if (digits.length >= 11 && digits.startsWith('505')) {
      const withoutCountry = digits.slice(3)
      return `+505 ${this.format(withoutCountry)}`
    }
    
    if (digits.startsWith('+')) {
      return digits
    }
    
    return digits
  },

  isValid(value) {
    if (!value) return false
    const cleaned = this.clean(value)
    const digits = cleaned.replace(/\D/g, '')
    return digits.length >= 8
  }
}

export function usePhoneFormatter() {
  const formatPhone = (value) => {
    return phoneUtils.format(value)
  }

  const formatPhoneOnBlur = (event) => {
    const target = event.target
    if (target.value) {
      target.value = phoneUtils.format(target.value)
    }
  }

  const isValidPhone = (value) => {
    return phoneUtils.isValid(value)
  }

  return {
    formatPhone,
    formatPhoneOnBlur,
    isValidPhone,
    phoneUtils
  }
}