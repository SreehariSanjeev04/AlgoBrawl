import { genSalt, hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { env } from "../config/env.js";
import { User, Match } from "../database/associations.js";
import { AppError } from "../middleware/error.middleware.js";

const COOKIE_OPTIONS = {
  maxAge: 30 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "strict",
  secure: env.nodeEnv === "production",
};

export const userService = {
  async register(username, password) {
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      throw new AppError("User already exists", 400);
    }
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);
    return User.create({ username, password: hashedPassword });
  },

  async login(username, password) {
    if (!username || !password) {
      throw new AppError("Please fill all the details", 400);
    }
    const user = await User.findOne({ where: { username } });
    if (!user) {
      throw new AppError("User does not exist", 400);
    }
    const isValid = await compare(password, user.password);
    if (!isValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const payload = { username, id: user.id, rating: user.rating };
    const accessToken = jwt.sign(payload, env.jwtSecret, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, env.refreshTokenSecret, { expiresIn: "30d" });

    return { user, accessToken, refreshToken, cookieOptions: COOKIE_OPTIONS };
  },

  async findById(id) {
    return User.findByPk(Number(id), {
      attributes: { exclude: ["password"] },
    });
  },

  async findAllByRating() {
    return User.findAll({
      attributes: { exclude: ["password"] },
      order: [["rating", "DESC"]],
    });
  },

  async updateStats(id, rating, matchesPlayed, wins) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    user.rating = rating;
    user.matches_played = matchesPlayed;
    user.wins = wins;
    return user.save();
  },

  async updateScore(userId, newScore) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    user.rating = newScore;
    return user.save();
  },

  async getMatches(userId) {
    return Match.findAll({
      include: [
        { model: User, as: "Player1", attributes: ["id", "username", "rating"] },
        { model: User, as: "Player2", attributes: ["id", "username", "rating"] },
      ],
      where: {
        [Op.or]: [{ player1_id: userId }, { player2_id: userId }],
      },
      order: [["createdAt", "DESC"]],
    });
  },

  validateToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, env.jwtSecret, (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });
  },

  refreshAccessToken(refreshToken) {
    return new Promise((resolve, reject) => {
      jwt.verify(refreshToken, env.refreshTokenSecret, (err, payload) => {
        if (err) {
          return reject(new AppError("Kindly login again", 401));
        }
        const newAccessToken = jwt.sign(
          { id: payload.id, username: payload.username, rating: payload.rating },
          env.jwtSecret,
          { expiresIn: "15m" }
        );
        resolve({ accessToken: newAccessToken, user: { username: payload.username } });
      });
    });
  },
};
