export const generateStands = (blockConfigs = {}) => {
  const stands = [];
  
  for (const [blockId, config] of Object.entries(blockConfigs)) {
    if (!config.active) continue;
    
    // Assign capacity based on manager input, default to 100 if not provided
    const standTotal = parseInt(config.capacity, 10) || 100;
    const seatsPerRow = 10;
    const rows = Math.ceil(standTotal / seatsPerRow);

    stands.push({
      name: blockId, // The DB "stand" is now a specific block like 'A1-T1'
      rows,
      seatsPerRow,
      totalSeats: standTotal,
      price: Number(config.price || 0)
    });
  }

  // Sort them so they appear consistently
  stands.sort((a, b) => a.name.localeCompare(b.name));
  
  return stands;
};

