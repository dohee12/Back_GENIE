const Sequelize = require("sequelize");
const sequelize = require("../config/Database");

const users = require("../models/Users");

const db = {};

db.sequelize = Sequelize;
db.sequelize = sequelize;

db.users = users;

module.exports = db; // es5 문법 export default와 같은 것