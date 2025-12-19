import User from "../models/User.js";
import Match from "../models/Match.js";

// Define association between User and Match
User.hasMany(Match, { foreignKey: "player1_id", as: "MatchesAsPlayer1" });
User.hasMany(Match, { foreignKey: "player2_id", as: "MatchesAsPlayer2" });

Match.belongsTo(User, { foreignKey: "player1_id", as: "Player1" });
Match.belongsTo(User, { foreignKey: "player2_id", as: "Player2" });

export { User, Match };