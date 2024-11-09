// const express = require('express');
// const upload = require('../preprocess-pdf/upload-pdf.mjs'); // Import multer config
// const uploadController = require('../controllers/upload-controller.mjs'); // Import controller
import express from 'express';
import upload from '../preprocess-pdf/upload-pdf.mjs'; // Import multer config
import uploadController from '../controllers/upload-controller.mjs'; // Import controller


const router = express.Router();

// POST route for uploading a file
router.post('/', upload.single('pdf'), uploadController);

module.exports = router;
