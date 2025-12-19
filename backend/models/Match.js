import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Match = sequelize.define("Match", {
    id: {
        type: DataTypes.INTEGER, 
        autoIncrement: true,
        primaryKey: true
    },
    room_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    problem_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    player1_id: {
        type: DataTypes.INTEGER, 
        allowNull: false
    },
    player2_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    winner: {
        type: DataTypes.INTEGER,
        allowNull: true // winner must be null initially
    }
})



export default Match