// controllers/studentController.js
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import Quiz from '../models/Quiz.js';
import StudentQuizResult from '../models/StudentQuizResult.js';
import Feedback from '../models/Feedback.js';
import Attendance from '../models/Attendance.js';

export const getSchedule = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate('class');
    if (!student) {
      return res.status(404).json({ message: 'Elevul nu a fost găsit' });
    }

    const lessons = await Lesson.find({ class: student.class._id })
      .populate('teacher', 'name')
      .sort({ date: 1, time: 1 });

    res.json({ schedule: lessons });
  } catch (error) {
    console.error('Eroare la obținerea orarului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('teacher', 'name')
      .populate({
        path: 'quiz',
        populate: {
          path: 'questions',
        },
      });

    if (!lesson) {
      return res.status(404).json({ message: 'Lecția nu a fost găsită' });
    }

    const student = await User.findById(req.user.id).populate('class');
    if (!student || lesson.class.toString() !== student.class._id.toString()) {
      return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
    }

    res.json({ lesson });
  } catch (error) {
    console.error('Eroare la obținerea lecției:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const submitQuiz = async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
      }
  
      const { answers } = req.body;
  
      let score = 0;
      const processedAnswers = [];
  
      for (const answer of answers) {
        const question = quiz.questions.id(answer.questionId);
        if (question) {
          const isCorrect = answer.selectedOption === question.correctAnswer;
          if (isCorrect) {
            score += 1;
          }
          processedAnswers.push({
            questionId: question._id,
            selectedOption: answer.selectedOption,
            isCorrect,
          });
        }
      }
  
      const studentQuizResult = new StudentQuizResult({
        student: req.user.id,
        quiz: quiz._id,
        answers: processedAnswers,
        score,
      });
  
      await studentQuizResult.save();
  
      res.json({ message: 'Quiz trimis' });
    } catch (error) {
      console.error('Eroare la trimiterea quiz-ului:', error);
      res.status(500).json({ message: 'Eroare de server' });
    }
  };

export const submitFeedback = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lecția nu a fost găsită' });
    }

    const student = await User.findById(req.user.id).populate('class');
    if (!student || lesson.class.toString() !== student.class._id.toString()) {
      return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
    }

    const { feedbackText } = req.body;

    const feedback = new Feedback({
      student: req.user.id,
      lesson: lesson._id,
      feedbackText,
    });

    await feedback.save();

    res.json({ message: 'Feedback trimis' });
  } catch (error) {
    console.error('Eroare la trimiterea feedback-ului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lecția nu a fost găsită' });
    }

    const student = await User.findById(req.user.id).populate('class');
    if (!student || lesson.class.toString() !== student.class._id.toString()) {
      return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
    }

    const existingAttendance = await Attendance.findOne({
      student: req.user.id,
      lesson: lesson._id,
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Prezența a fost deja marcată' });
    }

    const attendance = new Attendance({
      student: req.user.id,
      lesson: lesson._id,
      attended: true,
    });

    await attendance.save();

    res.json({ message: 'Prezență marcată' });
  } catch (error) {
    console.error('Eroare la marcarea prezenței:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

