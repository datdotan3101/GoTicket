import { STAND_NAMES, STAND_RATIOS } from "../constants/standRatios.js";

const getRowsAndSeatsPerRow = (seatCount) => {
  const rows = Math.max(1, Math.round(Math.sqrt(seatCount / 2)));
  const seatsPerRow = Math.max(1, Math.ceil(seatCount / rows));
  return { rows, seatsPerRow };
};

export const generateStands = (totalCapacity, prices) => {
  let remaining = Number(totalCapacity);

  return STAND_NAMES.map((name, index) => {
    const isLast = index === STAND_NAMES.length - 1;
    const baseSeats = isLast ? remaining : Math.floor(totalCapacity * STAND_RATIOS[name]);
    const { rows, seatsPerRow } = getRowsAndSeatsPerRow(baseSeats);
    const totalSeats = rows * seatsPerRow;
    remaining -= totalSeats;

    return {
      name,
      rows,
      seatsPerRow,
      totalSeats,
      price: Number(prices[name] || 0)
    };
  });
};
