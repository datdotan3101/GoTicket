export const getMatchBasicInfoSchema = (form, isEditMode, hasPreviewBanner) => {
  const schema = {
    leagueId: { required: 'League' },
    stadiumId: { required: 'Stadium' },
    homeTeam: { required: 'Home Team' },
    awayTeam: { required: 'Away Team', custom: val => val === form.homeTeam ? 'Home and Away must be different' : null },
    matchDate: { required: 'Date & Time', custom: val => new Date(val) < new Date() ? 'Date cannot be in the past' : null },
    description: { required: 'Description' }
  };
  
  if (!isEditMode && !hasPreviewBanner) {
    schema.banner = { required: 'Banner Image' };
  }
  
  return schema;
};
