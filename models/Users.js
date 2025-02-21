const {DataTypes} = require ("sequelize");
const sequelize = require("../config/Database");                                            

const users = sequelize.define("users", {
    userId: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,  

    },
    loginId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    pwd: {
        type: DataTypes.STRING,
        allowNull: false,
    }, 
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    birth: {
        type: DataTypes.STRING,                                                                                                                                                                                                                                                                                      
        allowNull: true
    },
    }, {tableName: "users"}
);

module.exports = users;