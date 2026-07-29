import { userService } from "../services/user.service.js";

export const userController = {
  async register(req, res, next) {
    try {
      const { username, password } = req.body;
      const user = await userService.register(username, password);
      res.status(201).json({ message: "User created", user });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
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
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
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
      if (!authHeader) return res.status(401).json({ error: "No access token" });
      const token = authHeader.split(" ")[1];
      const user = await userService.validateToken(token);
      res.status(200).json(user);
    } catch (err) {
      res.status(401).json({ error: "Unauthorized Access" });
    }
  },

  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refresh_token;
      if (!refreshToken) return res.status(401).json({ error: "Kindly login again" });
      const result = await userService.refreshAccessToken(refreshToken);
      res.status(200).json(result);
    } catch (err) {
      if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
      next(err);
    }
  },

  async getMatches(req, res, next) {
    try {
      const { user_id } = req.body;
      const matches = await userService.getMatches(user_id);
      res.status(200).json({ matches });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id, rating, matches_played, wins } = req.body;
      if (!id || rating === undefined || matches_played === undefined || wins === undefined) {
        return res.status(400).json({ error: "Incomplete details to update user" });
      }
      if (typeof id !== "number" || typeof rating !== "number" || typeof matches_played !== "number" || typeof wins !== "number") {
        return res.status(400).json({ error: "Invalid user details" });
      }
      const user = await userService.updateStats(id, rating, matches_played, wins);
      res.status(200).json({ message: "User updated successfully", user });
    } catch (err) {
      if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
      next(err);
    }
  },

  async updateScore(req, res, next) {
    try {
      const { user_id, new_score } = req.body;
      if (typeof user_id !== "number" || typeof new_score !== "number") {
        return res.status(400).json({ error: "Invalid user_id or score" });
      }
      const user = await userService.updateScore(user_id, new_score);
      res.json({ message: "User score updated successfully", user });
    } catch (err) {
      if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
      next(err);
    }
  },
};
