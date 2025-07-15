const crypto = require("crypto");
const queue = [];
const activeMatches = new Map();
const axios = require("axios");

const eloRating = (Ra, Rb) => {
  return 1 / (1 + Math.pow(10, (Ra - Rb) / 400));
};

const finalScore = (Ra, Sa, Ea) => {
  return Ra + 50*(Sa - Ea);
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
          const response = await fetch(
            `http://localhost:5000/api/problem/generate?difficulty=${user.difficulty}`
          );
          const problem = await response.json();

          const roomResponse = await fetch(
            "http://localhost:5000/api/match/create-match",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                roomId,
                players: [player1.id, player2.id],
                problem,
              }),
            }
          );

          if (!roomResponse.ok) return;

          activeMatches.set(roomId, {
            players: {
              [player1.id]: player1.socketId,
              [player2.id]: player2.socketId,
            },
            problemId: problem.id,
            winner: null,
          });

          const p1Socket = io.sockets.sockets.get(player1.socketId);
          const p2Socket = io.sockets.sockets.get(player2.socketId);

          let joined = 0;
          const onJoined = () => {
            joined++;
            if (joined == 2) {
              io.to(roomId).emit("match-started", { roomId });
            }
          };

          [p1Socket, p2Socket].forEach((soc) => {
            soc.join(roomId);
            onJoined();
          });
        } catch (err) {
          console.error("Matchmaking error:", err);
        }
      }
    });

    socket.on(
      "submit-solution",
      async ({
        roomId,
        problemId,
        username,
        code,
        language,
        testcases,
        expected,
      }) => {
        const match = activeMatches.get(roomId);
        console.log("activeMatch: ", activeMatches);
        console.log(match);
        if (!match || match.winner) return;

        try {
          const response = await fetch("http://localhost:5000/api/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language, code, testcases, expected }),
          });

          const result = await response.json();

          const approved = result.output?.includes("Approved");

          const submission = await axios.post(`${process.env.BACKEND_URI}/submission/add`, {
            user_id: username,
            match_id: roomId,
            code,
            language,
            result: approved ? "Approved" : "Not Approved"
          }, {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "x-internal-secret": process.env.INTERNAL_SECRET
            }
          })

          console.log("Submmision: ", submission.data)
          const winnerSocketId = match.players[username];
          const loserUsername = Object.keys(match.players).find(
            (u) => u !== username
          );
          const loserSocketId = match.players[loserUsername];

          if(submission.status !== 200) {
            io.to(winnerSocketId).emit("solution-feedback", {
              passed: false,
              message: "Could not submit the solution"
            })
          }
          else if (approved) {
            match.winner = username;
            const res = await axios.post(
              "http://localhost:5000/api/match/store-match",
              {
                room_id: roomId,
                problem_id: problemId,
                player1_id: username,
                player2_id: loserUsername,
                winner: username,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Accept: "application/json",
                  "x-internal-secret": process.env.INTERNAL_SECRET,
                },
              }
            );

            if (res.status === 200) {
              console.log("Room has been stored")
              io.to(winnerSocketId).emit("match-ended", {
                result: "win",
                message: "You have won!",
              });

              io.to(loserSocketId).emit("match-ended", {
                result: "lose",
                message: `${username} has won the match.`,
              });
            }
            activeMatches.delete(roomId);
          } else {
            console.log("Winner: ", winnerSocketId),
              io.to(winnerSocketId).emit("solution-feedback", {
                passed: false,
                message: "Incorrect output. Try again.",
              });
          }
        } catch (err) {
          const fallbackSocketId = match?.players?.[username];
          if (fallbackSocketId) {
            io.to(fallbackSocketId).emit("solution-feedback", {
              passed: false,
              message: "Execution failed.",
            });
          }
        }
      }
    );

    socket.on("disconnect", () => {
      const index = queue.findIndex((q) => q.socketId === socket.id);
      if (index !== -1) queue.splice(index, 1);
      for (const [roomId, match] of activeMatches.entries()) {
        const usernames = Object.keys(match.players);
        for (const user of usernames) {
          if (match.players[user] === socket.id) {
            io.to(roomId).emit("match-ended", {
              result: "cancelled",
              message: `${user} disconnected. Match cancelled.`,
            });
            activeMatches.delete(roomId);
            break;
          }
        }
      }
    });
  });
}

module.exports = { initializeSocket };
