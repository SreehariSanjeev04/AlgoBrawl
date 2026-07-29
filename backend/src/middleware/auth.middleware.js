import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ error: "No access token" });
    }
    const accessToken = authHeader.split(" ")[1];
    jwt.verify(accessToken, env.jwtSecret, (err, user) => {
      if (err) {
        return res.status(401).json({ error: "Invalid token" });
      }
      req.user = user;
      next();
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export default auth;
