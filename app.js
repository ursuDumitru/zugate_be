import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { extractTextFromPDF } from './src/preprocess-pdf/extract-pdf-text.mjs';  // Updated to import using ES module syntax
import upload from './src/preprocess-pdf/upload-pdf.mjs';  // Updated to import using ES module syntax
import { getMistralResponse } from './src/api/mistral-client.mjs';  // Import the Mistral function

const app = express();
const port = 5001;

// Variable to store extracted text from the PDF
let extractedText = '';

// Middleware to enable CORS
app.use(cors());

// Route to handle PDF file upload and extract text from it
app.post('/upload', upload.single('pdf'), (req, res) => {
    const { numQuestions, numAnswers } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const pdfPath = path.join(process.cwd(), 'uploads', req.file.filename);

    extractTextFromPDF(pdfPath)
        .then(async (text) => {
            extractedText = text;

            try {
                const quiz = await getMistralResponse(extractedText, numQuestions, numAnswers);
                res.json({
                    message: 'Quiz generated successfully!',
                    quiz,
                });
            } catch (error) {
                res.status(500).json({ message: 'Error processing with Mistral API', error });
            }
        })
        .catch((error) => {
            res.status(500).json({ message: 'Error processing PDF', error });
        });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
