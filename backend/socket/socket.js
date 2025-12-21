import crypto from "crypto";
const queue = [];
const activeMatches = new Map();
const activeUsers = new Map();
import axios from "axios";
import BucketQueue from "../matchmaking/BucketQueue.js";
import dotenv from "dotenv";
dotenv.config();

// code and logic cleanup required fr 
const BACKEND = process.env.BACKEND_URI;
const SECRET = process.env.INTERNAL_SECRET;

const bucketQueue = new BucketQueue(600, 2000); // Rating range from 600 to 2000

const eloRating = (Ra, Rb) => 1 / (1 + Math.pow(10, (Ra - Rb) / 400));

const finalScore = (Ra, Rb, Sa) => Ra + 50 * (Sa - eloRating(Ra, Rb));

/**
 * @description Updates user statistics after a match
 * @param {string} id
 * @param {number} rating
 * @param {number} matches_played
 * @param {number} wins
 * @returns
 */

const updateUser = async (id, rating, matches_played, wins) => {
  try {
    const response = await axios.patch(`${BACKEND}/user/update`, {
      id,
      rating,
      matches_played,
      wins,
    });
    console.log("User updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error.message);
    return { error: "Failed to update user" };
  }
};

/**
 * @description Stores match result and updates player stats
 * @param {string} roomId
 * @param {object} match
 * @param {string} winner
 * @param {object} io
 * @param {boolean} isDraw
 */

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
        winner: isDraw ? null : winner,
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

      console.log("New score for player1: ", newScore1);
      console.log("New score for player2: ", newScore2);

      await updateUser(
        parseInt(p1),
        newScore1,
        match.players[p1].matches_played + 1,
        match.players[p1].wins
      );
      await updateUser(
        parseInt(p2),
        newScore2,
        match.players[p2].matches_played + 1,
        match.players[p2].wins
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

      // await axios.put(
      //   `${BACKEND}/user/update-score`,
      //   {
      //     user_id: parseInt(winner),
      //     new_score: Math.floor(finalScore(winRating, loseRating, 1)),
      //   },
      //   { headers: { "x-internal-secret": SECRET } }
      // );

      // await axios.put(
      //   `${BACKEND}/user/update-score`,
      //   {
      //     user_id: parseInt(loser),
      //     new_score: Math.floor(finalScore(loseRating, winRating, 0)),
      //   },
      //   { headers: { "x-internal-secret": SECRET } }
      // );

      const newWinnerScore = Math.floor(finalScore(winRating, loseRating, 1));
      const newLoserScore = Math.floor(finalScore(loseRating, winRating, 0));
      await updateUser(
        parseInt(winner),
        newWinnerScore,
        match.players[winner].matches_played + 1,
        match.players[winner].wins + 1
      );
      await updateUser(
        parseInt(loser),
        newLoserScore,
        match.players[loser].matches_played + 1,
        match.players[loser].wins
      );
    }
    activeMatches.delete(roomId);
  } catch (err) {
    console.error("Error storing match result:", err.message);
  }
};

/**
 * @description Generates or fetches a problem based on difficulty
 * @param {string} difficulty
 */
const generateProblemForDifficulty = async (difficulty) => {
  try {
    const problemRes = await axios.get(
      `http://localhost:5000/api/problem/generate?difficulty=${difficulty}`
    );
    const problem = problemRes.data;
    if (!problem) {
      console.error("No problem received from problem generator");
      return null;
    }
    return problem;
  } catch (err) {
    console.error("Error generating problem: ", err.message);
    return null;
  }
};

/**
 * @description Transmits remaining match time to players
 * @param {object} io
 * @param {string} roomId
 */

const transmitTime = (io, roomId) => {
  let duration = activeMatches.get(roomId).duration;
  console.log("Starting time transmission for room:", roomId);
  setInterval(() => {
    if (duration > 0) {
      io.to(roomId).emit("match-time", { duration });
      duration--;
    } else {
      io.to(roomId).emit("time-up", {});
      clearInterval();
    }
  }, 1000);
};

/**
 * @description Creates a match entry in the system
 * @param {string} roomId
 * @param {integer} player1_id
 * @param {integer} player2_id
 * @param {object} problem
 * @param {object} io
 */
const createMatch = async (roomId, player1, player2, difficulty, io) => {
  const problem = await generateProblemForDifficulty(difficulty);
  if (problem === null) {
    return { error: "Failed to generate problem for match", success: false };
  }
  try {
    const roomDetails = {
      roomId,
      players: [player1.id, player2.id],
      problem,
    };

    console.log("Creating match with details:", roomDetails);

    await axios.post(
      "http://localhost:5000/api/match/create-match",
      roomDetails
    );

    activeMatches.set(roomId, {
      // players, ratings, problemId, winner, submitted, isAutoSubmit, approved
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
      duration: 15 * 60, // 15 minutes in seconds
    });

    [player1, player2].forEach(({ socketId }) => {
      const playerSocket = io.sockets.sockets.get(socketId);
      playerSocket?.join(roomId); // acknowledge method is not working always, so using the socket technique
    });

    io.to(roomId).emit("match-started", { roomId });
    return { success: true };
  } catch (error) {
    console.error("Error creating match:", error.message);
    return { error: "Failed to create match", success: false };
  }
};

/**
 * @description Initializes socket.io server and handles events
 * @param {object} io
 */

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`${socket.id} connected`);

    socket.on("online", async (user) => {
      console.log("User online:", user);
      activeUsers.set(user.id, { ...user, socket_id: socket.id }); // added the person to friends list
    }); // for friends implementation

    /**
     * Matchmaking Logic
     */
    socket.on("join-matchmaking", async (user) => {
      console.log("Joining matchmaking:", user);
      bucketQueue.enqueue(user.rating, user.id, socket.id);
      console.log("Bucket Queue Size:", bucketQueue.size());

      if (bucketQueue.hasAtleastTwoPlayers()) {
        console.log("Attempting to find match...");
        const player1 = bucketQueue.dequeueNextPlayer();
        const player2 =
          player1 !== null
            ? bucketQueue.findOpponentNode(player1.rating) // finding opponent for player 1
            : null;
        if (player1 !== null && player2 !== null) {
          console.log("Found two players:", player1, player2);
          const userId = user.id;
          const userResponse = await axios.get(`${BACKEND}/user/${userId}`, {
            headers: {
              "x-internal-secret": SECRET,
            },
          });

          const fetchedUser = userResponse.data;

          console.log(activeMatches[user.id]);
          const roomId = crypto.randomUUID();

          const matchResult = await createMatch(
            roomId,
            player1,
            player2,
            "Easy",
            io
          );
          if (!matchResult.success) {
            console.error("Match creation failed:", matchResult.error);
          } else {
            console.log("Match created with Room ID:", roomId);
            transmitTime(io, roomId);
          }
        }
      }
    });

    socket.on("leave-matchmaking", (payload, callback) => {
      console.log("Leaving matchmaking:", payload.id);
      const res = bucketQueue.remove(payload.id);
      console.log("Bucket Queue Size:", bucketQueue.size());
      callback({
        status: res == true ? "ok" : "error",
        message: res == true ? "Left matchmaking successfully" : "Error leaving matchmaking",
      })
    })

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
      // add a grace period of 10s before removing the data, make the time static, and let the users connect back to the match gracefully
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

export default initializeSocket;
