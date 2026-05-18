import { format } from 'date-fns'

export const formatDateTime = (value, dateFormat = 'dd/MM/yyyy HH:mm') => {
  if (!value) return '--'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'

  return format(date, dateFormat)
}

export const formatVND = (amount = 0) => {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
  return `${formatted} VND`
}
