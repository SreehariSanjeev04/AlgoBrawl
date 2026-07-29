import { Sequelize } from "sequelize";
import { env } from "./env.js";

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
  host: env.db.host,
  dialect: "postgres",
  port: env.db.port,
  logging: env.nodeEnv === "development" ? false : false,
});

export default sequelize;
