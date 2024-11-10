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

export const getQuiz = async (req, res) => {
  console.log("Quiz ID:", req.params.id); // Log pentru verificare
  try {
    const quiz = await Quiz.findOne({ _id: req.params.id, approved: true });
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }
    res.json({ quiz });
  } catch (error) {
    console.error('Eroare la obținerea quiz-ului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('teacher', 'name')
      .populate({
        path: 'quizzes',
        match: { approved: true },
      });

    if (!lesson) {
      return res.status(404).json({ message: 'Lecția nu a fost găsită' });
    }

    const student = await User.findById(req.user.id).populate('class');
    if (!student || lesson.class.toString() !== student.class._id.toString()) {
      return res.status(403).json({ message: 'Nu aveți acces la această lecție' });
    }

    // Verifică dacă studentul a completat quiz-ul
    const completedQuiz = await StudentQuizResult.findOne({
      student: req.user.id,
      quiz: lesson.quizzes[0]?._id,
    });

    // Dacă quiz-ul a fost completat, elimină-l din răspuns
    if (completedQuiz) {
      lesson.quizzes = [];
    }

    res.json({ lesson });
  } catch (error) {
    console.error('Eroare la obținerea lecției:', error);
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

// În studentController.js



export const submitQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('lesson');
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }

    const { answers } = req.body;
    let score = 0;
    const processedAnswers = [];
    let correctAnswers = 0;

    for (const answer of answers) {
      const question = quiz.questions.id(answer.questionId);
      if (question) {
        const correctOption = question.options.find(opt => opt.isCorrect);
        const isCorrect = answer.selectedOption === correctOption.text;
        if (isCorrect) {
          score += 1;
          correctAnswers += 1;
        }
        processedAnswers.push({
          questionId: question._id,
          questionText: question.questionText,
          selectedAnswer: answer.selectedOption,
          correctAnswer: correctOption.text,
          isCorrect,
          sentenceIDs: question.sentenceIDs
        });
      }
    }

    // Calculează scorul procentual
    const totalQuestions = quiz.questions.length;
    const percentageScore = (score / totalQuestions) * 100;

    // Salvează rezultatul în StudentQuizResult
    const studentQuizResult = new StudentQuizResult({
      student: req.user.id,
      quiz: quiz._id,
      lesson: quiz.lesson._id,
      answers: processedAnswers,
      score: percentageScore,
    });

    await studentQuizResult.save();

    res.json({ 
      message: 'Quiz trimis', 
      score: percentageScore,
      correctAnswers,
      totalQuestions
    });
  } catch (error) {
    console.error('Eroare la trimiterea quiz-ului:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};
export const getAttendanceStatus = async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      student: req.user.id,
      lesson: req.params.id
    });

    res.json({ attended: attendance ? attendance.attended : false });
  } catch (error) {
    console.error('Eroare la verificarea prezenței:', error);
    res.status(500).json({ message: 'Eroare la verificarea prezenței' });
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

    let attendance = await Attendance.findOne({
      student: req.user.id,
      lesson: lesson._id
    });

    if (attendance) {
      // Dacă există deja o prezență, o actualizăm (toggle)
      attendance.attended = !attendance.attended;
      await attendance.save();
      return res.json({ 
        message: attendance.attended ? 'Prezență marcată cu succes' : 'Prezență retrasă cu succes',
        attended: attendance.attended 
      });
    }

    // Dacă nu există, cream o nouă prezență
    attendance = new Attendance({
      student: req.user.id,
      lesson: lesson._id,
      attended: true
    });

    await attendance.save();
    res.json({ message: 'Prezență marcată cu succes', attended: true });
  } catch (error) {
    console.error('Eroare la marcarea prezenței:', error);
    res.status(500).json({ message: 'Eroare la marcarea prezenței' });
  }
};
