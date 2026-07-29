import Match from "../models/Match.js";

const Matches = new Map();

export const matchController = {
  createRoom(req, res, next) {
    try {
      const { roomId, players, problem } = req.body;
      if (!roomId || !players || !(players instanceof Array) || !problem) {
        return res.status(400).json({ error: "Incomplete details to create a room" });
      }
      Matches.set(roomId, { players, problem });
      res.status(200).json({ message: "Room Created", room: Matches.get(roomId) });
    } catch (err) {
      next(err);
    }
  },

  getRoom(req, res) {
    const { matchId } = req.params;
    if (!matchId || !Matches.get(matchId)) {
      return res.status(400).json({ error: "Invalid match id" });
    }
    res.status(200).json({ room: Matches.get(matchId) });
  },

  removeRoom(req, res) {
    const { matchId } = req.params;
    if (!matchId || !Matches.get(matchId)) {
      return res.status(400).json({ error: "Invalid match id" });
    }
    Matches.delete(matchId);
    res.status(200).json({ message: "Match removed successfully" });
  },

  async storeMatch(req, res, next) {
    try {
      const { room_id, problem_id, player1_id, player2_id, winner } = req.body;
      if (!room_id || !problem_id || !player1_id || !player2_id) {
        return res.status(400).json({ error: "Incomplete details" });
      }
      await Match.create({ room_id, problem_id, player1_id, player2_id, winner });
      res.status(200).json({ message: "Match stored successfully" });
    } catch (err) {
      next(err);
    }
  },
};
