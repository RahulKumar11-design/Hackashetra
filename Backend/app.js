// app.js
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const {isAuthenticated} = require('./middleware');
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const User = require("./models/User.js");
const LabTest = require('./models/LabTest');
const fs = require('fs').promises;

// Initialize app
const app = express();

// Create uploads directory if it doesn't exist
(async () => {
    try {
        await fs.mkdir('uploads', { recursive: true });
        console.log('Uploads directory ready');
    } catch (error) {
        console.error('Error creating uploads directory:', error);
    }
})();

// Connect to MongoDB with proper error handling
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/healthcare', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Exit process with failure
    process.exit(1);
  }
};

connectDB();

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB connection closure:', err);
    process.exit(1);
  }
});

// Body parser with error handling
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }
  next();
});

app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({extended: true, limit: '10kb'}));
app.use(methodOverride("_method"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded files with error handling
app.use('/uploads', (req, res, next) => {
  express.static(path.join(__dirname, 'uploads'))(req, res, err => {
    if (err) {
      res.status(404).json({ message: 'File not found' });
    } else {
      next();
    }
  });
});

// Session config
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: { 
    expires: Date.now() + 3*24*60*60*1000,
    maxAge: 3*24*60*60*1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  },
  rolling: true
}));

// Passport config
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// View engine setup
app.set("view engine","ejs");
app.engine("ejs",ejsMate);
app.set("views",path.join(__dirname,"views"));

// Global error handler for view rendering
app.use((err, req, res, next) => {
  if (err.name === 'TemplateError') {
    return res.status(500).json({ message: 'Template rendering error' });
  }
  next(err);
});

// Routes with error handling
app.get("/home", (req, res, next) => {
  try {
    res.render("home.ejs", { user: req.user });
  } catch (err) {
    next(err);
  }
});

app.get("/profile", async (req, res, next) => {
  try {
    res.render("profile.ejs", { user: req.user });
  } catch (err) {
    next(err);
  }
});

app.get("/login", (req, res, next) => {
  try {
    res.render("login.ejs");
  } catch (err) {
    next(err);
  }
});

app.get("/register", (req, res, next) => {
  try {
    res.render("register.ejs");
  } catch (err) {
    next(err);
  }
});

app.get("/medicinefinder", (req, res, next) => {
  try {
    res.render("medicinefinder.ejs");
  } catch (err) {
    next(err);
  }
});

app.get('/medicinetracker', isAuthenticated, async (req, res, next) => {
  try {
    const labTests = await LabTest.find({ user: req.user._id }).sort({ testDate: -1 });
    res.render('medicinetracker', { user: req.user, labTests });
  } catch (err) {
    next(err);
  }
});

app.get("/support", (req, res, next) => {
  try {
    res.render("support.ejs");
  } catch (err) {
    next(err);
  }
});

// Add logout route
app.get("/logout", (req, res, next) => {
  try {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.session.destroy((err) => {
        if (err) {
          return next(err);
        }
        res.clearCookie('sessionId');
        res.redirect('/home');
      });
    });
  } catch (err) {
    next(err);
  }
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lab-tests', require('./routes/labTests'));
app.use('/api/wellbeing', require('./routes/wellbeing'));

// Authentication error handler
app.use((err, req, res, next) => {
  if (err.name === 'AuthenticationError') {
    return res.status(401).json({ message: 'Authentication failed' });
  }
  next(err);
});

// Session management
app.use((req, res, next) => {
  // Regenerate session when signing in to prevent session fixation
  if (req.method === 'POST' && req.path === '/api/auth/login') {
    req.session.regenerate((err) => {
      if (err) next(err);
      next();
    });
    return;
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle specific types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error', 
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  if (err.name === 'MongoError' && err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate key error' });
  }

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  
  // Default error response
  res.status(err.status || 500).json({ 
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message || 'Something went wrong!'
  });
});

// Start server with error handling
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});