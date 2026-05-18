/**
 * Validates a password according to complexity requirements:
 * - 6-100 characters
 * - At least one letter
 * - At least one digit
 * - At least one special character
 * 
 * @param {string} password - The password to validate.
 * @returns {Object} { isValid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required.' }
  }
  if (password.length <= 8) {
    return { isValid: false, message: 'Password must be at least 8 characters.' }
  }
  if (password.length > 15) {
    return { isValid: false, message: 'Password exceeds 15 characters.' }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one letter.' }
  }
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' }
  }
  if (!/[!@#$%^&*(),.?":{}|<>_]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character.' }
  }
  return { isValid: true, message: '' }
}
