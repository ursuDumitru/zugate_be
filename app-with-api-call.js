import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import upload from './src/preprocess-pdf/upload-pdf.mjs';
import { extractTextFromPDF } from './src/preprocess-pdf/extract-pdf-text.mjs';
import { getOpenAIResponse } from './src/api/openai-client.mjs';

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

app.post('/uploads', upload.single('pdf'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
        const { quizQuestions, responsesPerQuestion, studentsPresent } = req.body;

        const pdfPath = `uploads/courses_full/${req.file.filename}`;
        const splitJsonPath = await extractTextFromPDF(pdfPath);

        const baseFileName = path.basename(splitJsonPath, '_split.json');
        const jsonData = JSON.parse(await fs.readFile(splitJsonPath, 'utf8'));
        const quizFilePath = await getOpenAIResponse(jsonData, quizQuestions, responsesPerQuestion, baseFileName);

        res.json({ message: 'Quiz generated and saved successfully!', quizFilePath });
    } catch (error) {
        res.status(500).json({ message: 'Error generating quiz', error });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
