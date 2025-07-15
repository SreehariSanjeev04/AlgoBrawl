const {DataTypes} = require('sequelize');
const sequelize = require('../database/db');

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
        allowNull: false
    }
})

module.exports = Match