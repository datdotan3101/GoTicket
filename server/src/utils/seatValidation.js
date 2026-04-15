import { MAX_SEATS_PER_ORDER } from "../constants/ticketRules.js";

export const validateSeatSelection = (selectedSeats) => {
  if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
    return { valid: false, message: "Danh sách ghế không hợp lệ." };
  }

  if (selectedSeats.length > MAX_SEATS_PER_ORDER) {
    return { valid: false, message: `Chỉ được chọn tối đa ${MAX_SEATS_PER_ORDER} ghế.` };
  }

  const groupedByRow = selectedSeats.reduce((acc, seat) => {
    const row = seat.row_number;
    if (!acc[row]) {
      acc[row] = [];
    }
    acc[row].push(seat.seat_number);
    return acc;
  }, {});

  for (const rowSeats of Object.values(groupedByRow)) {
    const sorted = rowSeats.sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i] - sorted[i - 1] > 1) {
        return { valid: false, message: "Không được để ghế trống giữa các ghế đã chọn." };
      }
    }
  }

  return { valid: true };
};
