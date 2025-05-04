module.exports = (err, req, res, next) => {
  console.error(err.stack);
<<<<<<< HEAD
  res.status(500).json({ error: 'Something went wrong!' });
=======
  res.status(500).json({ error: "Something went wrong!" });
>>>>>>> upstream/Dev
};
