// controllers/teacherController.js
import Lesson from '../models/Lesson.js';
import Class from '../models/Class.js';
import { extractTextFromPDF } from '../src/preprocess-pdf/extract-pdf-text.mjs';
import { getMistralResponse } from '../src/api/mistral-client.mjs';
import Quiz from '../models/Quiz.js';
import Grade from '../models/Grade.js';
import path from 'path';
import StudentQuizResult from '../models/StudentQuizResult.js';

import { getMistralFeedback } from '../src/api/mistral-feedback.js';



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

// controllers/teacherController.js

// ... alte importuri și coduri existente

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
      approved: false, // Inițial, quiz-ul nu este aprobat
    });

    await quiz.save();

    // Adăugăm quiz-ul în array-ul quizzes al lecției
    lesson.pdfPath = pdfPath;
    lesson.quizzes.push(quiz._id);
    await lesson.save();

    res.json({ message: 'PDF încărcat și quiz generat', quizId: quiz._id });
  } catch (error) {
    console.error('Eroare la încărcarea PDF-ului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

// controllers/teacherController.js

// ... alte funcții existente

// Obține toate quiz-urile unei lecții
export const getQuizzes = async (req, res) => {
  try {
    const lessonId = req.params.lessonId;
    const teacherId = req.user.id;

    const lesson = await Lesson.findById(lessonId).populate('quizzes');
    if (!lesson) {
      return res.status(404).json({ message: 'Lecția nu a fost găsită' });
    }

    if (lesson.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a accesa această lecție' });
    }

    const quizzes = await Quiz.find({ lesson: lessonId });

    res.json({ quizzes });
  } catch (error) {
    console.error('Eroare la obținerea quiz-urilor:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

// Actualizează un quiz
export const updateQuiz = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const teacherId = req.user.id;
    const { questions } = req.body;

    const quiz = await Quiz.findById(quizId).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }

    if (quiz.lesson.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica acest quiz' });
    }

    // Actualizăm întrebările
    quiz.questions = questions.map(q => ({
      questionText: q.questionText,
      options: q.options.map(opt => ({ text: opt })),
      correctAnswer: q.correctAnswer,
    }));

    // Resetăm starea de aprobare dacă întrebările sunt modificate
    quiz.approved = false;

    await quiz.save();

    res.json({ message: 'Quiz-ul a fost actualizat', quiz });
  } catch (error) {
    console.error('Eroare la actualizarea quiz-ului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

// Aprobă un quiz
export const approveQuiz = async (req, res) => {
  try {
    const quizId = req.params.quizId;
    const teacherId = req.user.id;

    const quiz = await Quiz.findById(quizId).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }

    if (quiz.lesson.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a aproba acest quiz' });
    }

    quiz.approved = true;
    await quiz.save();

    res.json({ message: 'Quiz-ul a fost aprobat', quiz });
  } catch (error) {
    console.error('Eroare la aprobarea quiz-ului:', error);
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

export const getLessons = async (req, res) => {
  try {
    const { date } = req.query;
    const teacherId = req.user.id;

    if (!date) {
      return res.status(400).json({ message: 'Data este necesară' });
    }

    const formattedDate = new Date(date);
    if (isNaN(formattedDate)) {
      return res.status(400).json({ message: 'Data este invalidă' });
    }

    // Găsim lecțiile pentru profesorul curent și data specificată
    const lessons = await Lesson.find({
      teacher: teacherId,
      date: {
        $gte: new Date(formattedDate.setHours(0, 0, 0, 0)),
        $lte: new Date(formattedDate.setHours(23, 59, 59, 999)),
      },
    }).populate('class');

    res.json(lessons);
  } catch (error) {
    console.error('Eroare la obținerea lecțiilor:', error);
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