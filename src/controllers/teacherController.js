// controllers/teacherController.js
import path from 'path';
import Lesson from '../models/Lesson.js';
import Class from '../models/Class.js';
import Quiz from '../models/Quiz.js';
import Grade from '../models/Grade.js';
import StudentQuizResult from '../models/StudentQuizResult.js';

import { extractTextFromPDF } from '../pdf-handler/extract-text.mjs';
import { getMistralResponse } from '../api/openai-client.mjs';
import { getMistralFeedback } from '../api/mistral-feedback.js';



export const createLesson = async (req, res) => {
  try {
    const { title, description, date, time, className } = req.body;
    const teacherId = req.user.id;

    // Găsim clasa
    const lessonClass = await Class.findOne({ name: className });
    if (!lessonClass) {
      return res.status(404).json({ message: 'Clasa nu a fost găsită' });
    }

    const lesson = new Lesson({
      title,
      description,
      date,
      time,
      teacher: teacherId,
      class: lessonClass._id,
    });

    await lesson.save();

    res.status(201).json({ message: 'Lecție creată', lessonId: lesson._id });
  } catch (error) {
    console.error('Eroare la crearea lecției:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const uploadPDF = async (req, res) => {
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

    const pdfPath = path.join(process.cwd(), 'uploads', req.file.filename);
    const extractedText = await extractTextFromPDF(pdfPath);

    const numQuestions = req.body.numQuestions || 5;
    const numAnswers = req.body.numAnswers || 4;

    const mistralResponse = await getMistralResponse(extractedText, numQuestions, numAnswers);

    const quiz = new Quiz({
      lesson: lesson._id,
      questions: mistralResponse.questions.map(q => ({
        questionText: q.question,
        options: q.options.map(opt => ({ text: opt })),
        correctAnswer: q.correctAnswer,
      })),
    });

    await quiz.save();

    lesson.pdfPath = pdfPath;
    lesson.quiz = quiz._id;
    await lesson.save();

    res.json({ message: 'PDF încărcat și quiz generat', quizId: quiz._id });
  } catch (error) {
    console.error('Eroare la încărcarea PDF-ului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const addGrades = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { grades } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lecția nu a fost găsită' });
    }

    if (lesson.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica această lecție' });
    }

    for (const gradeEntry of grades) {
      const { studentId, grade } = gradeEntry;

      const gradeRecord = new Grade({
        student: studentId,
        lesson: lesson._id,
        grade,
      });

      await gradeRecord.save();
    }

    res.json({ message: 'Calificative adăugate' });
  } catch (error) {
    console.error('Eroare la adăugarea calificativelor:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};



// Funcție internă pentru a obține statisticile fără a trimite răspuns HTTP
const getQuizStatisticsInternal = async (quizId, teacherId) => {
  try {
    // Verificăm dacă quiz-ul există și aparține profesorului curent
    const quiz = await Quiz.findById(quizId).populate('lesson');
    if (!quiz) {
      return { error: true, status: 404, message: 'Quiz-ul nu a fost găsit' };
    }

    if (quiz.lesson.teacher.toString() !== teacherId) {
      return { error: true, status: 403, message: 'Nu aveți permisiunea de a accesa acest quiz' };
    }

    // Obținem toate rezultatele elevilor pentru acest quiz
    const results = await StudentQuizResult.find({ quiz: quizId });

    // Inițializăm un obiect pentru a stoca statisticile
    const questionStats = {};

    // Parcurgem toate rezultatele
    for (const result of results) {
      for (const answer of result.answers) {
        const questionId = answer.questionId.toString();

        if (!questionStats[questionId]) {
          questionStats[questionId] = { correct: 0, incorrect: 0 };
        }

        if (answer.isCorrect) {
          questionStats[questionId].correct += 1;
        } else {
          questionStats[questionId].incorrect += 1;
        }
      }
    }

    // Obținem textul întrebărilor pentru a le include în statistici
    const quizData = await Quiz.findById(quizId);
    const questionsWithStats = quizData.questions.map((question) => {
      const stats = questionStats[question._id.toString()] || { correct: 0, incorrect: 0 };
      return {
        questionId: question._id,
        questionText: question.questionText,
        correct: stats.correct,
        incorrect: stats.incorrect,
      };
    });

    return { quizTitle: quizData.lesson.title, questions: questionsWithStats };
  } catch (error) {
    console.error('Eroare la obținerea statisticilor quiz-ului:', error);
    return { error: true, status: 500, message: 'Eroare de server' };
  }
};
export const getQuizStatistics = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Verificăm dacă quiz-ul există și aparține profesorului curent
    const quiz = await Quiz.findById(quizId).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }

    if (quiz.lesson.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a accesa acest quiz' });
    }

    // Obținem toate rezultatele elevilor pentru acest quiz
    const results = await StudentQuizResult.find({ quiz: quizId });

    // Inițializăm un obiect pentru a stoca statisticile
    const questionStats = {};

    // Parcurgem toate rezultatele
    for (const result of results) {
      for (const answer of result.answers) {
        const questionId = answer.questionId.toString();

        if (!questionStats[questionId]) {
          questionStats[questionId] = { correct: 0, incorrect: 0 };
        }

        if (answer.isCorrect) {
          questionStats[questionId].correct += 1;
        } else {
          questionStats[questionId].incorrect += 1;
        }
      }
    }

    // Obținem textul întrebărilor pentru a le include în statistici
    const quizData = await Quiz.findById(quizId);
    const questionsWithStats = quizData.questions.map((question) => {
      const stats = questionStats[question._id.toString()] || { correct: 0, incorrect: 0 };
      return {
        questionId: question._id,
        questionText: question.questionText,
        correct: stats.correct,
        incorrect: stats.incorrect,
      };
    });

    res.json({ quizId, questions: questionsWithStats });
  } catch (error) {
    console.error('Eroare la obținerea statisticilor quiz-ului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const getQuizFeedback = async (req, res) => {
  try {
    const { quizId } = req.params;

    // Obținem statisticile quiz-ului folosind funcția creată anterior
    const statisticsResponse = await getQuizStatisticsInternal(quizId, req.user.id);
    if (statisticsResponse.error) {
      return res.status(statisticsResponse.status).json({ message: statisticsResponse.message });
    }

    const { quizTitle, questions } = statisticsResponse;

    // Trimitem datele către Mistral AI
    const feedback = await getMistralFeedback(quizTitle, questions);

    res.json({ feedback });
  } catch (error) {
    console.error('Eroare la obținerea feedback-ului de la Mistral AI:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};