fetch('http://localhost:5000/api/matches')
  .then(r => r.json())
  .then(data => {
    const m = data.data.find(x => x.home_team === 'Câu lạc bộ Hà Nội FC');
    console.log(m ? {
      home_team: m.home_team,
      home_team_logo: m.home_team_logo
    } : 'Not found');
  });
