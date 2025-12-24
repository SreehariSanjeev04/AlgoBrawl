export const calculateNewRatings = (player1Rating, player2Rating, outcome) => {
  const eloRating = (Ra, Rb) => 1 / (1 + Math.pow(10, (Ra - Rb) / 400));
  const K = 50;

  const expected1 = eloRating(player1Rating, player2Rating);
  const expected2 = eloRating(player2Rating, player1Rating);

  const score1 = outcome === "draw" ? 0.5 : outcome === "p1" ? 1 : 0;
  const score2 = outcome === "draw" ? 0.5 : outcome === "p2" ? 1 : 0;

  return {
    p1New: Math.floor(player1.rating + K * (score1 - expected1)),
    p2New: Math.floor(player2.rating + K * (score2 - expected2)),
  };
};
