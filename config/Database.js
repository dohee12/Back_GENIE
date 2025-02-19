const { Sequelize } = require("sequelize");

const sequelize = new Sequelize({
  dialect: "mysql",
  host: "127.0.0.1",
  port: 3306,
  username: "root",
  password: "winter12",
  database: "genie",
});

module.exports = sequelize;