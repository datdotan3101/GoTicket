import { STAND_NAMES, STAND_RATIOS } from "../constants/standRatios.js";

const getRowsAndSeatsPerRow = (seatCount) => {
  const rows = Math.max(1, Math.round(Math.sqrt(seatCount / 2)));
  const seatsPerRow = Math.max(1, Math.ceil(seatCount / rows));
  return { rows, seatsPerRow };
};

export const generateStands = (totalCapacity, vipCapacity, prices) => {
  const total = Number(totalCapacity);
  const vip = Number(vipCapacity || 0);
  const normalTotal = Math.max(0, total - vip);
  
  let remainingNormal = normalTotal;
  const normalStands = ["A", "B", "C", "D"];

  return STAND_NAMES.map((name) => {
    let standTotal = 0;
    
    if (name === "VIP") {
      standTotal = vip;
    } else {
      const isLastNormal = name === "D";
      standTotal = isLastNormal ? remainingNormal : Math.floor(normalTotal * STAND_RATIOS[name]);
      remainingNormal -= standTotal;
    }

    const { rows, seatsPerRow } = getRowsAndSeatsPerRow(standTotal);
    const totalSeats = rows * seatsPerRow;

    return {
      name,
      rows,
      seatsPerRow,
      totalSeats: standTotal,
      price: Number(prices[name] || 0)
    };
  });
};
