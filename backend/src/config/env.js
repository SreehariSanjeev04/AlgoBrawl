import dotenv from "dotenv";
dotenv.config();

const required = ["JWT_SECRET", "REFRESH_TOKEN", "INTERNAL_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  backendUri: process.env.BACKEND_URI || "http://localhost:5000/api",
  jwtSecret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN,
  internalSecret: process.env.INTERNAL_SECRET,
  maxContainers: Number(process.env.MAX_CONTAINERS) || 5,
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    name: process.env.DB_NAME || "Algobrawl",
    user: process.env.DB_USER || "algobrawl",
    password: process.env.DB_PASSWORD || "algobrawl",
    port: 5432,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
};
