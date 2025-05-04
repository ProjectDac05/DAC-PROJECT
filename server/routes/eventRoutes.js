<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const { getAllEvents } = require('../controllers/eventController');

router.get('/', getAllEvents);
=======
const express = require("express");
const router = express.Router();
const { getAllEvents } = require("../controllers/eventController");

router.get("/", getAllEvents);
>>>>>>> upstream/Dev

module.exports = router;
