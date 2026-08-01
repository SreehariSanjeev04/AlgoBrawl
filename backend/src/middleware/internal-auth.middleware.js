import crypto from "crypto";
import { env } from "../config/env.js";

const internalAuth = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];
  const valid =
    typeof secret === "string" &&
    typeof env.internalSecret === "string" &&
    secret.length === env.internalSecret.length &&
    crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(env.internalSecret));
  if (!valid) {
    return res.status(401).json({ error: "Invalid secret" });
  }
  next();
};

export default internalAuth;
