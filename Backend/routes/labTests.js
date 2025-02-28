// routes/labTests.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { isAuthenticated } = require('../middleware');
const LabTest = require('../models/LabTest');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Create new lab test record
router.post('/', isAuthenticated, upload.single('testFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { testName, labName, testDate } = req.body;

        // Validate input
        if (!testName || !labName || !testDate) {
            await fs.unlink(req.file.path); // Delete uploaded file
            return res.status(400).json({ message: 'All fields are required' });
        }

        const labTest = new LabTest({
            user: req.user._id,
            testName,
            labName,
            testDate,
            fileUrl: `/uploads/${req.file.filename}`
        });

        await labTest.save();
        res.status(201).json(labTest);
    } catch (error) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        console.error('Error creating lab test:', error);
        res.status(500).json({ message: 'Error creating lab test record' });
    }
});

// Get all lab tests for user
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const labTests = await LabTest.find({ user: req.user._id })
            .sort({ testDate: -1 });
        res.json(labTests);
    } catch (error) {
        console.error('Error fetching lab tests:', error);
        res.status(500).json({ message: 'Error fetching lab tests' });
    }
});

// Delete lab test
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const labTest = await LabTest.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!labTest) {
            return res.status(404).json({ message: 'Lab test not found' });
        }

        // Delete file from uploads
        if (labTest.fileUrl) {
            const filePath = path.join(__dirname, '..', labTest.fileUrl);
            await fs.unlink(filePath).catch(console.error);
        }

        await labTest.remove();
        res.json({ message: 'Lab test deleted successfully' });
    } catch (error) {
        console.error('Error deleting lab test:', error);
        res.status(500).json({ message: 'Error deleting lab test' });
    }
});

// Error handling middleware
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ message: error.message });
    }
    next(error);
});

module.exports = router;