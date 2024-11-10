import Lesson from '../models/Lesson.js';
import Class from '../models/Class.js';
import { extractTextFromPDF } from '../src/preprocess-pdf/extract-pdf-text.mjs';
import { getMistralResponse } from '../src/api/mistral-client.mjs';
import { getMistralFeedback } from '../src/api/mistral-feedback.js';
import Quiz from '../models/Quiz.js';
import Grade from '../models/Grade.js';
import StudentQuizResult from '../models/StudentQuizResult.js';
import path from 'path';

export const createLesson = async (req, res) => {
  try {
    const { title, description, date, time, className } = req.body;
    const teacherId = req.user.id;

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
      quizzes: [] // Inițializăm cu un array gol
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

    const numQuestions = parseInt(req.body.numQuestions) || 5;
    const numAnswers = parseInt(req.body.numAnswers) || 4;

    const mistralResponse = await getMistralResponse(extractedText, numQuestions, numAnswers);

    const quiz = new Quiz({
      lesson: lesson._id,
      questions: mistralResponse.questions.map(q => ({
        questionText: q.question,
        options: q.options.map(opt => ({ text: opt })),
        correctAnswer: q.correctAnswer,
      })),
      approved: false,
      originalText: extractedText // Salvăm textul original
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

export const getQuizzes = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const teacherId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
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

export const updateQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;
    const { questions } = req.body;

    const quiz = await Quiz.findById(quizId).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }

    if (quiz.lesson.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica acest quiz' });
    }

    quiz.questions = questions.map(q => ({
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));
    quiz.approved = false;

    await quiz.save();
    res.json({ message: 'Quiz-ul a fost actualizat', quiz });
  } catch (error) {
    console.error('Eroare la actualizarea quiz-ului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const approveQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
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

export const getQuizStatistics = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;

    const quiz = await Quiz.findById(quizId).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }

    if (quiz.lesson.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a accesa acest quiz' });
    }

    const results = await StudentQuizResult.find({ quiz: quizId });
    const questionStats = {};

    // Procesăm rezultatele pentru fiecare întrebare
    for (const result of results) {
      for (const answer of result.answers) {
        const questionId = answer.questionId.toString();
        
        if (!questionStats[questionId]) {
          questionStats[questionId] = {
            correct: 0,
            incorrect: 0,
            wrongAnswers: {}
          };
        }

        if (answer.isCorrect) {
          questionStats[questionId].correct += 1;
        } else {
          questionStats[questionId].incorrect += 1;
          // Urmărim răspunsurile greșite specifice
          if (!questionStats[questionId].wrongAnswers[answer.selectedAnswer]) {
            questionStats[questionId].wrongAnswers[answer.selectedAnswer] = 0;
          }
          questionStats[questionId].wrongAnswers[answer.selectedAnswer] += 1;
        }
      }
    }

    // Formatăm statisticile pentru răspuns
    const questionsWithStats = quiz.questions.map((question) => {
      const stats = questionStats[question._id.toString()] || {
        correct: 0,
        incorrect: 0,
        wrongAnswers: {}
      };

      // Găsim cele mai frecvente răspunsuri greșite
      const commonWrongAnswers = Object.entries(stats.wrongAnswers)
        .sort(([, a], [, b]) => b - a)
        .map(([answer, count]) => ({
          answer,
          count
        }));

      return {
        questionId: question._id,
        questionText: question.questionText,
        correct: stats.correct,
        incorrect: stats.incorrect,
        commonWrongAnswers
      };
    });

    res.json({
      quizId,
      questions: questionsWithStats,
    });
  } catch (error) {
    console.error('Eroare la obținerea statisticilor quiz-ului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const getQuizFeedback = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;

    // Găsim quiz-ul și verificăm permisiunile
    const quiz = await Quiz.findById(quizId).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }

    if (quiz.lesson.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a accesa acest quiz' });
    }

    // Obținem textul original și rezultatele
    const lesson = await Lesson.findById(quiz.lesson._id);
    const results = await StudentQuizResult.find({ quiz: quizId });
    
    // Procesăm statisticile
    const questionStats = {};
    for (const result of results) {
      for (const answer of result.answers) {
        const questionId = answer.questionId.toString();
        if (!questionStats[questionId]) {
          questionStats[questionId] = {
            correct: 0,
            incorrect: 0,
            wrongAnswers: {}
          };
        }

        if (answer.isCorrect) {
          questionStats[questionId].correct += 1;
        } else {
          questionStats[questionId].incorrect += 1;
          if (!questionStats[questionId].wrongAnswers[answer.selectedAnswer]) {
            questionStats[questionId].wrongAnswers[answer.selectedAnswer] = 0;
          }
          questionStats[questionId].wrongAnswers[answer.selectedAnswer] += 1;
        }
      }
    }

    // Formatăm datele pentru Mistral
    const questionsWithStats = quiz.questions.map((question) => {
      const stats = questionStats[question._id.toString()] || {
        correct: 0,
        incorrect: 0,
        wrongAnswers: {}
      };

      const commonWrongAnswers = Object.entries(stats.wrongAnswers)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([answer]) => answer);

      return {
        questionId: question._id,
        questionText: question.questionText,
        correct: stats.correct,
        incorrect: stats.incorrect,
        commonWrongAnswers
      };
    });

    // Obținem feedback-ul de la Mistral
    const feedback = await getMistralFeedback(
      lesson.title,
      questionsWithStats,
      quiz.originalText // Folosim textul original salvat în quiz
    );

    res.json({ feedback });
  } catch (error) {
    console.error('Eroare la obținerea feedback-ului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const addGrades = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { grades } = req.body;
    const teacherId = req.user.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lecția nu a fost găsită' });
    }

    if (lesson.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: 'Nu aveți permisiunea de a modifica această lecție' });
    }

    const gradePromises = grades.map(async ({ studentId, grade }) => {
      const gradeRecord = new Grade({
        student: studentId,
        lesson: lesson._id,
        grade
      });
      return gradeRecord.save();
    });

    await Promise.all(gradePromises);
    res.json({ message: 'Calificative adăugate cu succes' });
  } catch (error) {
    console.error('Eroare la adăugarea calificativelor:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};