<<<<<<< HEAD
const db = require('../config/db');

exports.getAllEvents = async (req, res, next) => {
  try {
    const [events] = await db.query('SELECT * FROM events');
=======
const db = require("../config/db");

exports.getAllEvents = async (req, res, next) => {
  try {
    const [events] = await db.query("SELECT * FROM events");
>>>>>>> upstream/Dev
    res.json(events);
  } catch (err) {
    next(err);
  }
};
