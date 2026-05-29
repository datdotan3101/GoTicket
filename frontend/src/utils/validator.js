import { toast } from 'react-toastify'

/**
 * Validates a data object against a given schema.
 * @param {Object} data - The data object to validate (e.g. form state).
 * @param {Object} schema - The validation rules. 
 *    Format: { fieldName: { required: "Message", regex: { pattern: /.../, message: "..." }, minLength: { value: 6, message: "..." }, maxLength: { value: 255, message: "..." }, custom: (val, data) => "Error Message" } }
 * @param {boolean} showToast - Whether to display a toast on failure.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
export const validateForm = (data, schema, showToast = true) => {
  const errors = []

  for (const field in schema) {
    const rules = schema[field]
    const value = data[field]

    // Check required
    if (rules.required) {
      if (value === undefined || value === null || String(value).trim() === '') {
        errors.push(rules.required)
        continue // Skip further checks if empty and required
      }
    }

    // If not required and empty, skip other checks
    if (!rules.required && (value === undefined || value === null || String(value).trim() === '')) {
      continue
    }

    // Check regex
    if (rules.regex && rules.regex.pattern) {
      if (!rules.regex.pattern.test(String(value))) {
        errors.push(rules.regex.message)
      }
    }

    // Check minLength
    if (rules.minLength && rules.minLength.value) {
      if (String(value).length < rules.minLength.value) {
        errors.push(rules.minLength.message)
      }
    }

    // Check maxLength
    if (rules.maxLength && rules.maxLength.value) {
      if (String(value).length > rules.maxLength.value) {
        errors.push(rules.maxLength.message)
      }
    }

    // Check custom
    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value, data)
      if (customError) {
        errors.push(customError)
      }
    }
  }

  if (errors.length > 0) {
    if (showToast) {
      toast.error(errors.join(', '))
    }
    return false
  }

  return true
}
