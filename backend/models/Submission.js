import { DataTypes } from "sequelize";
import sequelize from '../database/db.js';

const Submission = sequelize.define("Submission", {
    id: {
        type: DataTypes.INTEGER,
        unique: true, 
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    match_id: {
        type: DataTypes.STRING,   
    },
    code: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    language: {
        type: DataTypes.STRING,
        allowNull: false
    },
    result: {
        type: DataTypes.TEXT,
        allowNull: false
    }
})

export default Submission