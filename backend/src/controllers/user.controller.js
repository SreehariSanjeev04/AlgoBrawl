import { userService } from "../services/user.service.js";
import { AppError } from "../middleware/error.middleware.js";

export const userController = {
  async register(req, res, next) {
    try {
      const { username, password } = req.body;
      const user = await userService.register(username, password);
      res.status(201).json({ message: "User created", user });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await userService.login(username, password);
      res.cookie("refresh_token", result.refreshToken, result.cookieOptions);
      res.status(200).json({ user: result.user, accessToken: result.accessToken });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.status(200).json({ user });
    } catch (err) {
      next(err);
    }
  },

  async getAll(req, res, next) {
    try {
      const users = await userService.findAllByRating();
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  },

  async validate(req, res, next) {
    try {
      const authHeader = req.headers["authorization"];
      if (!authHeader) throw new AppError("No access token", 401);
      const token = authHeader.split(" ")[1];
      const user = await userService.validateToken(token);
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof AppError) return next(err);
      res.status(401).json({ error: "Unauthorized Access" });
    }
  },

  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refresh_token;
      if (!refreshToken) throw new AppError("Kindly login again", 401);
      const result = await userService.refreshAccessToken(refreshToken);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getMatches(req, res, next) {
    try {
      const userId = Number(req.user?.id);
      if (!Number.isInteger(userId)) throw new AppError("Unauthorized", 401);
      const matches = await userService.getMatches(userId);
      res.status(200).json({ matches });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id, rating, matches_played, wins } = req.body;
      if (!id || rating === undefined || matches_played === undefined || wins === undefined) {
        throw new AppError("Incomplete details to update user", 400);
      }
      if (typeof id !== "number" || typeof rating !== "number" || typeof matches_played !== "number" || typeof wins !== "number") {
        throw new AppError("Invalid user details", 400);
      }
      if (Number(req.user?.id) !== id) {
        throw new AppError("You can only update your own profile", 403);
      }
      const user = await userService.updateStats(id, rating, matches_played, wins);
      res.status(200).json({ message: "User updated successfully", user });
    } catch (err) {
      next(err);
    }
  },

  async updateScore(req, res, next) {
    try {
      const { user_id, new_score } = req.body;
      if (typeof user_id !== "number" || typeof new_score !== "number") {
        throw new AppError("Invalid user_id or score", 400);
      }
      const user = await userService.updateScore(user_id, new_score);
      res.json({ message: "User score updated successfully", user });
    } catch (err) {
      next(err);
    }
  },
};
