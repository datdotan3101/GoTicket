import { STAND_NAMES, STAND_RATIOS } from '../constants/standRatios'

export const generateStandsPreview = (totalCapacity) => {
  const total = Number(totalCapacity)
  if (!Number.isFinite(total) || total <= 0) return []

  let remaining = total

  return STAND_NAMES.map((name, index) => {
    const isLast = index === STAND_NAMES.length - 1
    const standTotal = isLast ? remaining : Math.floor(total * STAND_RATIOS[name])
    const rows = Math.max(1, Math.round(Math.sqrt(standTotal / 2)))
    const seatsPerRow = Math.max(1, Math.ceil(standTotal / rows))
    const generatedTotal = rows * seatsPerRow

    remaining -= generatedTotal

    return {
      name,
      total_seats: generatedTotal,
      rows,
      seats_per_row: seatsPerRow,
    }
  })
}
