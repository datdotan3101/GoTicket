export const redistributeStadiumSeats = (totalCapacity, activeBlocks, standTotalsOverride = null) => {
  const total = Number(totalCapacity) || 0
  if (total < 100) {
    throw new Error('Minimum capacity is 100')
  }

  // Default ratios based on standard setup
  const standTotals = standTotalsOverride || {
    A: Math.floor(total * 0.3),
    B: Math.floor(total * 0.3),
    C: Math.floor(total * 0.2),
    D: Math.floor(total * 0.2)
  }
  
  const standSum = standTotals.A + standTotals.B + standTotals.C + standTotals.D;
  standTotals.A += (total - standSum);

  if (activeBlocks.length === 0) {
    throw new Error('Please enable at least one level first')
  }

  const resultCapacities = {}

  // Distribute
  ;['A', 'B', 'C', 'D'].forEach(mainStand => {
    const blocksInStand = activeBlocks.filter(b => b.stand === mainStand);
    if (blocksInStand.length > 0) {
      const baseCapacity = Math.floor(standTotals[mainStand] / blocksInStand.length);
      const remainder = standTotals[mainStand] % blocksInStand.length;
      
      blocksInStand.forEach((block, index) => {
        const capacity = baseCapacity + (index < remainder ? 1 : 0);
        resultCapacities[`${block.colId}-${block.tier}`] = capacity;
      });
    }
  });

  return resultCapacities;
}
