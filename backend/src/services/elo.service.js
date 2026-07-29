const K_FACTOR = 50;

const expectedScore = (ratingA, ratingB) =>
  1 / (1 + Math.pow(10, (ratingA - ratingB) / 400));

export const calculateNewRatings = (player1Rating, player2Rating, outcome) => {
  const expected1 = expectedScore(player1Rating, player2Rating);
  const expected2 = expectedScore(player2Rating, player1Rating);

  const score1 = outcome === "draw" ? 0.5 : outcome === "p1" ? 1 : 0;
  const score2 = outcome === "draw" ? 0.5 : outcome === "p2" ? 1 : 0;

  return {
    p1New: Math.floor(player1Rating + K_FACTOR * (score1 - expected1)),
    p2New: Math.floor(player2Rating + K_FACTOR * (score2 - expected2)),
  };
};
