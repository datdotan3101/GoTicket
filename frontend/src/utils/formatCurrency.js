export const formatVND = (amount = 0) => {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
  return `${formatted} VND`
}
