const crypto = require("crypto");
const queue = [];
const activeMatches = new Map();
const axios = require("axios");
require("dotenv").config();

const BACKEND = process.env.BACKEND_URI;
const SECRET = process.env.INTERNAL_SECRET;

const eloRating = (Ra, Rb) => 1 / (1 + Math.pow(10, (Ra - Rb) / 400));
const finalScore = (Ra, Rb, Sa) => Ra + 50 * (Sa - eloRating(Ra, Rb));
const storeMatchResult = async (roomId, match, winner, io, isDraw) => {
  const [p1, p2] = Object.keys(match.players);
  const loser = winner === p1 ? p2 : p1;

  try {
    await axios.post(
      `${BACKEND}/match/store-match`,
      {
        room_id: roomId,
        problem_id: match.problemId,
        player1_id: parseInt(p1),
        player2_id: parseInt(p2),
        winner: isDraw ? -1 : winner,
      },
      {
        headers: { "x-internal-secret": SECRET },
      }
    );

    const socket1 = match.players[p1];
    const socket2 = match.players[p2];

    if (isDraw) {
      io.to(socket1).emit("match-ended", {
        result: "draw",
        message: "The match ended in a draw.",
      });

      io.to(socket2).emit("match-ended", {
        result: "draw",
        message: "The match ended in a draw.",
      });

      const newScore1 = Math.floor(
        finalScore(match.ratings[p1], match.ratings[p2], 0.5)
      );
      const newScore2 = Math.floor(
        finalScore(match.ratings[p2], match.ratings[p1], 0.5)
      );

      await axios.put(
        `${BACKEND}/user/update-score`,
        {
          user_id: parseInt(p1),
          new_score: newScore1,
        },
        { headers: { "x-internal-secret": SECRET } }
      );

      await axios.put(
        `${BACKEND}/user/update-score`,
        {
          user_id: parseInt(p2),
          new_score: newScore2,
        },
        { headers: { "x-internal-secret": SECRET } }
      );
    } else {
      const winnerSocket = match.players[winner];
      const loserSocket = match.players[loser];

      io.to(winnerSocket).emit("match-ended", {
        result: "win",
        message: "You have won!",
      });

      io.to(loserSocket).emit("match-ended", {
        result: "lose",
        message: "Opponent has won the match.",
      });

      const winRating = match.ratings[winner];
      const loseRating = match.ratings[loser];

      await axios.put(
        `${BACKEND}/user/update-score`,
        {
          user_id: parseInt(winner),
          new_score: Math.floor(finalScore(winRating, loseRating, 1)),
        },
        { headers: { "x-internal-secret": SECRET } }
      );

      await axios.put(
        `${BACKEND}/user/update-score`,
        {
          user_id: parseInt(loser),
          new_score: Math.floor(finalScore(loseRating, winRating, 0)),
        },
        { headers: { "x-internal-secret": SECRET } }
      );
    }
    activeMatches.delete(roomId);
  } catch (err) {
    console.error("Error storing match result:", err.message);
  }
};

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`${socket.id} connected`);

    socket.on("join-matchmaking", async (user) => {
      queue.push({ socketId: socket.id, ...user });

      if (queue.length >= 2) {
        const player1 = queue.shift();
        const player2 = queue.shift();
        const roomId = crypto.randomUUID();

        try {
          const problemRes = await fetch(
            `http://localhost:5000/api/problem/generate?difficulty=${user.difficulty}`
          );
          const problem = await problemRes.json();

          await fetch("http://localhost:5000/api/match/create-match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomId,
              players: [player1.id, player2.id],
              problem,
            }),
          });

          activeMatches.set(roomId, {
            players: {
              [player1.id]: player1.socketId,
              [player2.id]: player2.socketId,
            },
            ratings: {
              [player1.id]: player1.rating,
              [player2.id]: player2.rating,
            },
            problemId: problem.id,
            winner: null,
            submitted: {
              [player1.id]: false,
              [player2.id]: false,
            },
            isAutoSubmit: {
              [player1.id]: false,
              [player2.id]: false,
            },
            approved: {
              [player1.id]: false,
              [player2.id]: false,
            },
          });

          [player1, player2].forEach(({ socketId }) => {
            const playerSocket = io.sockets.sockets.get(socketId);
            playerSocket?.join(roomId);
          });

          io.to(roomId).emit("match-started", { roomId });
        } catch (err) {
          console.error("Matchmaking failed:", err.message);
        }
      }
    });

    socket.on(
      "submit-solution",
      async ({
        roomId,
        username,
        code,
        language,
        testcases,
        expected,
        isAuto,
      }) => {
        const match = activeMatches.get(roomId);
        if (!match || match.winner) return;

        try {
          const res = await fetch("http://localhost:5000/api/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language, code, testcases, expected }),
          });

          const result = await res.json();
          const approved = result.output?.includes("Approved");

          match.submitted[username] = true;
          match.approved[username] = approved;
          match.isAutoSubmit[username] = isAuto || false;

          await axios.post(
            `${BACKEND}/submission/add`,
            {
              user_id: parseInt(username),
              match_id: roomId,
              code,
              language,
              result: approved ? "Approved" : "Not Approved",
            },
            {
              headers: { "x-internal-secret": SECRET },
            }
          );

          const opponent = Object.keys(match.players).find(
            (u) => u !== username
          );
          if (approved && !match.winner) {
            match.winner = username;
            await storeMatchResult(roomId, match, username, io, false);
            return;
          }

          const bothSubmitted =
            match.submitted[username] && match.submitted[opponent];
          const bothAuto =
            match.isAutoSubmit[username] && match.isAutoSubmit[opponent];
          const bothFailed =
            !match.approved[username] && !match.approved[opponent];

          if (bothSubmitted && !match.winner) {
            if (match.approved[opponent]) {
              match.winner = opponent;
              await storeMatchResult(roomId, match, opponent, io, false);
            } else if (bothAuto && bothFailed) {
              console.log("Both players failed, ending match as a draw");
              await storeMatchResult(roomId, match, username, io, true);
            }
            activeMatches.delete(roomId);
          } else if (!approved) {
            console.log("Reached here with non-approved submission");
            io.to(socket.id).emit("solution-feedback", {
              passed: false,
              message: "Incorrect output. Try again.",
            });

            console.log(match.isAutoSubmit);
            if (!match.isAutoSubmit[username]) {
              match.approved[username] = false;
              match.isAutoSubmit[username] = false;
              match.submitted[username] = false;
            }
          }
        } catch (err) {
          console.error("Submission error:", err.message);
          io.to(socket.id).emit("solution-feedback", {
            passed: false,
            message: "Server error while executing code.",
          });
        }
      }
    );

    socket.on("disconnect", () => {
      const i = queue.findIndex((q) => q.socketId === socket.id);
      if (i !== -1) queue.splice(i, 1);

      for (const [roomId, match] of activeMatches.entries()) {
        const user = Object.keys(match.players).find(
          (u) => match.players[u] === socket.id
        );
        if (user) {
          io.to(roomId).emit("match-ended", {
            result: "cancelled",
            message: "Opponent disconnected. Match cancelled.",
          });
          activeMatches.delete(roomId);
          break;
        }
      }
    });
  });
};

module.exports = { initializeSocket };
