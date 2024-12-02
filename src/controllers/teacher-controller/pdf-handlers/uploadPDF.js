import Lesson from '../../../models/Lesson.js';
import Quiz from '../../../models/Quiz.js';
import { extractTextFromPDF } from './extractTextFromPDF.mjs';
import { getJsonQuizFromOpenAI } from '../quiz-handlers/getJsonQuizFromOpenAI.mjs';

import path from 'path';
import fs from 'fs/promises';
import { config } from 'dotenv';


config();

const uploadPDF = async (req, res) => {
    try {
        const lessonId = req.params.id;
        const lesson = await Lesson.findById(lessonId);

        if (!lesson) {
            return res.status(404).json({ message: 'Lecția nu a fost găsită' });
        }

        if (lesson.teacher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica această lecție' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Nu a fost încărcat niciun fișier' });
        }

        const { quizQuestions, responsesPerQuestion } = req.body;
        const pdfPath = `./uploads/coursesFull/${req.file.filename}`;
        const splitJsonPath = await extractTextFromPDF(pdfPath);

        const baseFileName = path.basename(splitJsonPath, '_split.json');
        const jsonData = JSON.parse(await fs.readFile(splitJsonPath, 'utf8'));
        const quizFilePath = await getJsonQuizFromOpenAI(jsonData, quizQuestions, responsesPerQuestion, baseFileName);
        const jsonData1 = JSON.parse(await fs.readFile(quizFilePath, 'utf8'));

        // Transformăm datele pentru noul model
        const quiz = new Quiz({
            lesson: lesson._id,
            questions: jsonData1.questions.map(q => ({
                questionText: q.question,
                sentenceIDs: q.sentenceIDs,
                options: q.options.map((opt, index) => ({
                    text: opt,
                    isCorrect: index === q.correctAnswerIndex // folosim indexul răspunsului corect
                })),
            })),
            approved: false
        });

        await quiz.save();

        lesson.pdfPath = pdfPath;
        lesson.quizzes.push(quiz._id);
        await lesson.save();

        res.json({ message: 'PDF încărcat și quiz generat', quizId: quiz._id });
    } catch (error) {
        console.error('Eroare la încărcarea PDF-ului:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default uploadPDF;
