const {DataTypes} = require('sequelize');
const sequelize = require("../database/db");

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER, 
        primaryKey: true,
        autoIncrement: true,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            min: 8, 
            max: 20,
        }
    },
    rating: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
module.exports = User;