export const loginSchema = {
  email: { required: 'Email is required', regex: { pattern: /\S+@\S+\.\S+/, message: 'Invalid email format' } },
  password: { required: 'Password is required' }
};

export const registerSchema = {
  fullName: { required: 'Full Name is required', maxLength: { value: 255, message: 'Full Name exceeds 255 characters' } },
  email: { required: 'Email is required', regex: { pattern: /\S+@\S+\.\S+/, message: 'Invalid email format' } },
  password: { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' }, maxLength: { value: 100, message: 'Password exceeds 100 characters' }, regex: { pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).*$/, message: 'Password must contain an uppercase letter, a number, and a special character' } }
};
