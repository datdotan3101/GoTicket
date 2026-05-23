/* eslint-disable no-unused-vars */
import { STAND_NAMES, STAND_RATIOS } from '../constants/standRatios'

export const generateStandsPreview = (totalCapacity, vipCapacity) => {
  const total = Number(totalCapacity)
  const vip = Number(vipCapacity || 0)
  if (!Number.isFinite(total) || total <= 0) return []

  const normalTotal = Math.max(0, total - vip)
  let remainingNormal = normalTotal

  return STAND_NAMES.map((name) => {
    let standTotal = 0
    if (name === 'VIP') {
      standTotal = vip
    } else {
      const isLastNormal = name === 'D'
      standTotal = isLastNormal ? remainingNormal : Math.floor(normalTotal * STAND_RATIOS[name])
      remainingNormal -= standTotal
    }

    const rows = Math.max(1, Math.round(Math.sqrt(standTotal / 2)))
    const seatsPerRow = Math.max(1, Math.ceil(standTotal / rows))
    const generatedTotal = rows * seatsPerRow

    return {
      name,
      total_seats: standTotal,
      rows,
      seats_per_row: seatsPerRow,
    }
  })
}
