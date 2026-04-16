import { MAX_SEATS_PER_ORDER } from '../constants/ticketRules'

const groupByRow = (seats) =>
  seats.reduce((acc, seat) => {
    const row = seat.row_number ?? seat.rowNumber
    if (!acc[row]) acc[row] = []
    acc[row].push(seat)
    return acc
  }, {})

const hasGapInRow = (rowSeats) => {
  const sorted = [...rowSeats].sort(
    (a, b) => (a.seat_number ?? a.seatNumber) - (b.seat_number ?? b.seatNumber),
  )

  for (let index = 1; index < sorted.length; index += 1) {
    const prevSeat = sorted[index - 1]
    const currentSeat = sorted[index]
    const prevNumber = prevSeat.seat_number ?? prevSeat.seatNumber
    const currentNumber = currentSeat.seat_number ?? currentSeat.seatNumber

    if (currentNumber - prevNumber > 1) return true
  }

  return false
}

export const validateSelectedSeats = (selectedSeats) => {
  if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    return { valid: false, message: 'Please select at least one seat.' }
  }

  if (selectedSeats.length > MAX_SEATS_PER_ORDER) {
    return { valid: false, message: `You can only book up to ${MAX_SEATS_PER_ORDER} seats.` }
  }

  const rows = groupByRow(selectedSeats)
  const hasGap = Object.values(rows).some(hasGapInRow)

  if (hasGap) {
    return {
      valid: false,
      message: 'Please choose adjacent seats in each row (no empty seat in between).',
    }
  }

  return { valid: true, message: '' }
}
