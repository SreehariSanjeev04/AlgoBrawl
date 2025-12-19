import { User, Match } from "../database/associations.js";
import express from "express";
const router = express.Router();
import { genSalt, hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
const { sign, verify } = jwt;
import auth from "../middleware/auth.js";
import { Op } from "sequelize";

const COOKIE_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    const newUser = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: "User created", user: newUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/update", async (req, res) => {
  const { id, rating, matches_played, wins } = req.body;
  if (!id || !rating || !matches_played || !wins) {
    return res.status(400).json({ error: "Incomplete details to update user" });
  }

  if (
    typeof id !== "number" ||
    typeof rating !== "number" ||
    typeof matches_played !== "number" ||
    typeof wins !== "number" ||
    !Number.isInteger(id)
  ) {
    return res.status(400).json({ error: "Invalid user details" });
  }
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.rating = rating;
    user.matches_played = matches_played;
    user.wins = wins;

    await user.save();
    res.status(200).json({ message: "User updated successfully", user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({
        error: "Please fill all the details",
      });
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ error: "User does not exist" });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = sign(
      { username, id: user.id, rating: user.rating },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m", // 15 minutes
      }
    );

    const refreshToken = sign(
      { username, id: user.id, rating: user.rating },
      process.env.REFRESH_TOKEN,
      {
        expiresIn: "30d",
      }
    );

    res.cookie("refresh_token", refreshToken, COOKIE_OPTIONS);
    return res.status(200).json({ user, accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(id);
  try {
    const user = await User.findByPk(Number(id), {
      attributes: {
        exclude: ["password"],
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      order: [["rating", "DESC"]],
    });
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/validate", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const access_token = authHeader.split(" ")[1];
    if (!access_token) {
      res.status(401).json({ error: "No access token" });
    }
    verify(access_token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(401).json({ error: "Unauthorized Access" });
      res.status(200).json(user);
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/refresh-token", async (req, res) => {
  try {
    const refresh_token = req.cookies.refresh_token;
    console.log("Refresh token:", refresh_token);
    if (!refresh_token) {
      return res.status(401).json({ error: "Kindly login again" });
    }

    verify(refresh_token, process.env.REFRESH_TOKEN, (err, payload) => {
      if (err) {
        return res.status(401).json({ error: "Kindly login again" });
      }

      const newAccessToken = sign(
        { id: payload.id, username: payload.username, rating: payload.rating },
        process.env.JWT_SECRET,
        {
          expiresIn: "15m",
        }
      );

      res.status(200).json({
        accessToken: newAccessToken,
        user: {
          username: payload.username,
        },
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get matches of a user
 */

router.post("/get-matches", async (req, res) => {
  const { user_id } = req.body;
  try {
    // Joining Match and User tables to get opponent details
    const matches = await Match.findAll({
      include: [
        {
          model: User,
          as: "Player1",
          attributes: ["id", "username", "rating"],
        },
        {
          model: User,
          as: "Player2",
          attributes: ["id", "username", "rating"],
        },
      ],
      where: {
        [Op.or]: [{ player1_id: user_id }, { player2_id: user_id }],
      },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({ matches });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

router.put("/update-score", async (req, res) => {
  const secret = req.headers["x-internal-secret"];
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: "Invalid Secret" });
  }

  const { user_id, new_score } = req.body;
  console.log(req.body);
  if (
    typeof user_id !== "number" ||
    typeof new_score !== "number" ||
    !Number.isInteger(user_id)
  ) {
    return res.status(400).json({ error: "Invalid user_id or score" });
  }

  try {
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.rating = new_score;
    await user.save();

    return res.json({ message: "User score updated successfully", user });
  } catch (err) {
    console.error("Error updating user score:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
