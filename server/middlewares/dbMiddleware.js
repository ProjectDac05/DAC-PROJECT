const db = require("../config/db");

module.exports = (req, res, next) => {
  req.db = db;
  next();
};
