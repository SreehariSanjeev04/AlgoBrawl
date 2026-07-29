import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Match = sequelize.define("Match", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  room_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  problem_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  player1_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    index: true,
  },
  player2_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    index: true,
  },
  winner: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

export default Match;
