class FieldValidator {
  constructor(value, fieldName) {
    this.value = value ?? ''
    this.fieldName = fieldName
    this.error = ''
  }

  required(customMsg) {
    if (this.error) return this
    if (typeof this.value === 'string' ? !this.value.trim() : !this.value) {
      this.error = customMsg || `${this.fieldName} is required.`
    }
    return this
  }

  min(length, customMsg) {
    if (this.error) return this
    if (this.value.length < length) {
      this.error = customMsg || `${this.fieldName} must be at least ${length} characters.`
    }
    return this
  }

  max(length, customMsg) {
    if (this.error) return this
    if (this.value.length > length) {
      this.error = customMsg || `${this.fieldName} exceeds ${length} characters.`
    }
    return this
  }

  pattern(regex, customMsg) {
    if (this.error) return this
    if (!regex.test(this.value)) {
      this.error = customMsg || `${this.fieldName} is invalid.`
    }
    return this
  }

  email(customMsg) {
    if (this.error) return this
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return this.pattern(emailRegex, customMsg || 'Invalid email format.')
  }

  getError() {
    return this.error
  }
}

// Fluent initialization helper
const validate = (value, fieldName) => new FieldValidator(value, fieldName)

/**
 * Validates an email address format.
 *
 * @param {string} email
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateEmail = (email) => {
  const error = validate(email, 'Email').required().email().getError()
  return { isValid: !error, message: error }
}

/**
 * Validates a full name (non-empty, max 255 characters).
 *
 * @param {string} fullName
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateFullName = (fullName) => {
  const error = validate(fullName, 'Full name').required().max(255).getError()
  return { isValid: !error, message: error }
}

/**
 * Validates a password according to complexity requirements:
 * - 8-15 characters
 * - At least one letter
 * - At least one digit
 * - At least one special character
 *
 * @param {string} password - The password to validate.
 * @returns {{ isValid: boolean, message: string }}
 */
export const validatePassword = (password) => {
  const error = validate(password, 'Password')
    .required()
    .min(8)
    .max(15)
    .pattern(/[a-zA-Z]/, 'Password must contain at least one letter.')
    .pattern(/\d/, 'Password must contain at least one number.')
    .pattern(/[!@#$%^&*(),.?":{}|<>_]/, 'Password must contain at least one special character.')
    .getError()

  return { isValid: !error, message: error }
}

/**
 * Validates the login form fields (email + password presence).
 * Password complexity is NOT checked on login — the server handles it.
 *
 * @param {{ email: string, password: string }} form
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateLoginForm = (form) => {
  const emailResult = validateEmail(form.email)
  if (!emailResult.isValid) return emailResult

  const passwordError = validate(form.password, 'Password').required().getError()
  if (passwordError) {
    return { isValid: false, message: passwordError }
  }

  return { isValid: true, message: '' }
}

/**
 * Validates the register form fields (fullName + email + password complexity).
 *
 * @param {{ fullName: string, email: string, password: string }} form
 * @returns {{ isValid: boolean, message: string }}
 */
export const validateRegisterForm = (form) => {
  const fullNameResult = validateFullName(form.fullName)
  if (!fullNameResult.isValid) return fullNameResult

  const emailResult = validateEmail(form.email)
  if (!emailResult.isValid) return emailResult

  const passwordResult = validatePassword(form.password)
  if (!passwordResult.isValid) return passwordResult

  return { isValid: true, message: '' }
}

/**
 * Validates ALL login fields simultaneously.
 * Returns an errors object keyed by field name and a top-level isValid flag.
 *
 * @param {{ email: string, password: string }} form
 * @returns {{ isValid: boolean, errors: { email: string, password: string } }}
 */
export const validateLoginFields = (form) => {
  const errors = {
    email: validate(form.email, 'Email').required().email().getError(),
    password: validate(form.password, 'Password').required().getError()
  }

  const isValid = !Object.values(errors).some(Boolean)
  return { isValid, errors }
}

/**
 * Validates ALL register fields simultaneously.
 * Returns an errors object keyed by field name and a top-level isValid flag.
 *
 * @param {{ fullName: string, email: string, password: string }} form
 * @returns {{ isValid: boolean, errors: { fullName: string, email: string, password: string } }}
 */
export const validateRegisterFields = (form) => {
  const errors = {
    fullName: validate(form.fullName, 'Full name').required().max(255).getError(),
    email: validate(form.email, 'Email').required().email().getError(),
    password: validate(form.password, 'Password')
      .required()
      .min(8)
      .max(15)
      .pattern(/[a-zA-Z]/, 'Password must contain at least one letter.')
      .pattern(/\d/, 'Password must contain at least one number.')
      .pattern(/[!@#$%^&*(),.?":{}|<>_]/, 'Password must contain at least one special character.')
      .getError()
  }

  const isValid = !Object.values(errors).some(Boolean)
  return { isValid, errors }
}
