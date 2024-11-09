import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { extractTextFromPDF } from './src/preprocess-pdf/extract-pdf-text.mjs';  // Updated to import using ES module syntax
import upload from './src/preprocess-pdf/upload-pdf.mjs';  // Updated to import using ES module syntax
import { getMistralResponse } from './src/api/mistral-client.mjs';  // Import the Mistral function
import connectDB from './db.js';
const app = express();
const port = 5001;

import authRoutes from './routes/authRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

// Variable to store extracted text from the PDF
let extractedText = '';

// Middleware to enable CORS
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
connectDB();
// Route to handle PDF file upload and extract text from it
app.post('/upload', upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const pdfPath = path.join(process.cwd(), 'uploads', req.file.filename);  // Changed to process.cwd() for cross-platform compatibility

    extractTextFromPDF(pdfPath)
        .then(async (text) => {
            extractedText = text;
            console.log('Extracted Text:', extractedText);

            // Send the extracted text to Mistral API
            try {
                const mistralResponse = await getMistralResponse(extractedText);
                console.log('Response from Mistral:', mistralResponse);

                res.json({
                    message: 'File uploaded and text processed by Mistral API!',
                    mistralResponse,
                });
            } catch (error) {
                console.error('Error with Mistral API:', error);
                res.status(500).json({ message: 'Error processing with Mistral API', error });
            }
        })
        .catch((error) => {
            console.error('Error extracting text from PDF:', error);
            res.status(500).json({ message: 'Error processing PDF', error });
        });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
