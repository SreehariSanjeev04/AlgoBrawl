const Matches = new Map() 
const router = require('express').Router()

router.post("/create-match", async (req, res) => {
  const { roomId, players, problem } = req.body;

  console.log(req.body)
  if (!roomId || !players || !(players instanceof Array) || !problem) {
    return res.status(400).json({
      error: "Incomplete details to create a room",
    });
  }

  try {
    Matches.set(roomId, {
      players,
      problem,
    });

    res.status(200).json({
      message: "Room Created",
      room: Matches.get(roomId),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get("/:matchId", async(req,res) => {
    const {matchId} = req.params;
    console.log(matchId)

    if(!matchId || !Matches.get(matchId)) return res.status(400).json({error: "Invalid match id"})
    const matchDetails = Matches.get(matchId)

    res.status(200).json({room: matchDetails})
})

router.get("/remove-match/:matchId", async(req,res) => {
    const {matchId} = req.params
    if(!matchId || !Matches.get(matchId)) return res.status(400).json({error: "Invalid match id"})
    
    Matches.delete(matchId)
    res.status(200).json({message:"Match removed successfully"})
})

module.exports = router