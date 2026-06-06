export const profileUpdateSchema = {
  fullName: { required: 'Full Name is required', maxLength: { value: 255, message: 'Full name exceeds 255 characters.' } }
};

export const passwordChangeSchema = {
  oldPassword: { required: 'Current password is required' },
  newPassword: {
    required: 'New password is required',
    minLength: { value: 6, message: 'Password must be at least 6 characters' },
    maxLength: { value: 100, message: 'Password exceeds 100 characters' },
    regex: {
      pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_]).*$/,
      message: 'Password must contain an uppercase letter, a number, and a special character',
    },
  },
};
