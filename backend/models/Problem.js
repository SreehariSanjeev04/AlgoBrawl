import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const Problem = sequelize.define("Problem", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    testcases: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
    },
    difficulty: {
        type: DataTypes.ENUM("Easy", "Medium", "Hard"),
        defaultValue: "Easy",
        allowNull: false
    }
})

export default Problem