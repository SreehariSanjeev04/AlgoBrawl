import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(json());
app.use(cookieParser());
app.use(
  cors({
    origin: env.cors.origin,
    credentials: true,
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", environment: env.nodeEnv });
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
