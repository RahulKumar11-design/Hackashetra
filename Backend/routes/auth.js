// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User.js');

// Register route
router.post('/register', async (req, res,next) => {
  try {
    const {
      email,
      password,
      name,
      dateOfBirth,
      gender,
      phoneNumber,
      bloodGroup,
      allergies,
      chronicConditions,
      address
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const newUser = new User({
      email,
      password,
      name,
      dateOfBirth,
      gender,
      phoneNumber,
      bloodGroup,
      allergies,
      chronicConditions,
      address
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    // Save user to DB
    await newUser.save();
    
    //login
    req.logIn(newUser, (err) => {
      if (err) return next(err);
        return res.redirect("/home");
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(400).json({ message: info.message });
    
    req.logIn(user, (err) => {
      if (err) return next(err);

      return res.redirect("/home");
    });
  })(req, res, next);
});

// Logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect("/home");
});

module.exports = router;
