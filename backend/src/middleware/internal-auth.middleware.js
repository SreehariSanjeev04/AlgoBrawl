import { env } from "../config/env.js";

const internalAuth = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];
  if (!secret || secret !== env.internalSecret) {
    return res.status(401).json({ error: "Invalid secret" });
  }
  next();
};

export default internalAuth;
