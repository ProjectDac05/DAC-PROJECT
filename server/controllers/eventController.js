const db = require("../config/db");

exports.getAllEvents = async (req, res, next) => {
  try {
    const [events] = await db.query("SELECT * FROM events");
    res.json(events);
  } catch (err) {
    next(err);
  }
};
