import { DataTypes } from "sequelize";
import sequelize from "../database/db.js";

const User = sequelize.define("User", {
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8, 100],
        },
    },
    rating: {
        type: DataTypes.INTEGER,
        defaultValue: 800,
    },
    matches_played: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }

});

export default User;