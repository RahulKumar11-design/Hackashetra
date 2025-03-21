require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const {isAuthenticated,check,aftercheck} = require('./middleware');
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const User = require("./models/User.js");
const path = require("path");
const {storage} = require("./cloudConfig.js");
const multer = require("multer");
const upload = multer({storage});

const storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload2 = multer({ storage: storage2 });
const LabTest = require("./models/LabTest.js");
const { spawn } = require('child_process');
// Initialize app
const app = express();

// Connect to MongoDB with proper error handling
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/healthcare');
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
  }
};

connectDB();

app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

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
    const labTests = await LabTest.find({ owner: req.user._id });
    console.log(labTests);
    res.render('tracker.ejs', { user: req.user, labTests });
  } catch (err) {
    next(err);
  }
});
app.post('/medicinetracker/lab-tests',check,upload2.single("testfile"),aftercheck,async (req,res)=>{//
  console.log(req.body,req.file.path);
  const {testName,labName,testDate} = req.body;
  const labtest = new LabTest({testName,labName,testDate});
  labtest.fileUrl = req.file.path;
  labtest.owner = req.user._id;
  if(labtest){
      await labtest.save().catch((err)=>console.log(err));
  }
  res.redirect("/medicinetracker");
});

app.post('/predict', upload2.single('image-input'),async (req, res) => {
  const imagePath = req.file.path;
  const pythonFilePath = path.join(__dirname, 'ml_model/model.py');

  const python = spawn('python', [pythonFilePath, imagePath]);
  let prediction = '';

  // Listen for data from the Python process
  python.stdout.on('data', (data) => {
    prediction += data.toString();
  });
  let user1 = await User.findById(req.user._id);
  // Handle the close event (when the Python process finishes)
  python.on('close', (code) => {
    // Assign the prediction to the user
    user1.xray = prediction;

    // Save the updated user in the database (optional but recommended)
    user1.save()
      .then(() => {
        res.redirect("/profile");
      })
      .catch((err) => {
        console.error("Error saving user:", err);
        res.status(500).send("Internal Server Error");
      });
  });

  // Handle Python errors
  python.stderr.on('data', (data) => {
    console.error(`Python stderr: ${data}`);
  });

  // Handle spawn errors
  python.on('error', (err) => {
    console.error("Failed to start subprocess:", err);
    res.status(500).send("Internal Server Error");
  });
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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});