import Lesson from '../models/Lesson.js';
import Class from '../models/Class.js';
import { extractTextFromPDF } from '../src/preprocess-pdf/extract-pdf-text.mjs';
import { getOpenAIResponse } from '../src/api/openai-client.mjs';
import Quiz from '../models/Quiz.js';
import Grade from '../models/Grade.js';
import path from 'path';
import fs from 'fs/promises';
import AIAnalysisReport from '../models/AIAnalysisReport.js';
import StudentQuizResult from '../models/StudentQuizResult.js';
import { OpenAI } from 'openai';
import Attendance from '../models/Attendance.js';
import dotenv, { config } from 'dotenv';
import User from '../models/User.js';
config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
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

    const { quizQuestions, responsesPerQuestion } = req.body;
    const pdfPath = `./uploads/courses_full/${req.file.filename}`;
    const splitJsonPath = await extractTextFromPDF(pdfPath);

    const baseFileName = path.basename(splitJsonPath, '_split.json');
    const jsonData = JSON.parse(await fs.readFile(splitJsonPath, 'utf8'));
    const quizFilePath = await getOpenAIResponse(jsonData, quizQuestions, responsesPerQuestion, baseFileName);
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

    const gradePromises = grades.map(async ({ studentId, grade, note }) => {
      const gradeRecord = new Grade({
        student: studentId,
        lesson: lesson._id,
        grade,
        note // adăugat câmpul note
      });
      return gradeRecord.save();
    });

    await Promise.all(gradePromises);
    res.json({ message: 'Calificative și notițe adăugate cu succes' });
  } catch (error) {
    console.error('Eroare la adăugarea calificativelor:', error);
    res.status(500).json({ message: 'Eroare de server' });
  }
};


export const generateQuizAnalysis = async (req, res) => {
  console.log('=================== START generateQuizAnalysis ===================');
  console.log('Request params:', req.params);
  console.log('Teacher ID:', req.user?.id);
  
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;
    
    console.log(`[1] Searching for quiz with ID: ${quizId}`);
    // Găsim quiz-ul și verificăm permisiunile
    const quiz = await Quiz.findById(quizId).populate('lesson');
    console.log('[2] Quiz found:', {
      quizExists: !!quiz,
      lessonId: quiz?.lesson?._id,
      teacherId: quiz?.lesson?.teacher?.toString()
    });

    if (!quiz) {
      console.log('[ERROR] Quiz not found');
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }

    if (quiz.lesson.teacher.toString() !== teacherId) {
      console.log('[ERROR] Permission denied', {
        quizTeacherId: quiz.lesson.teacher.toString(),
        requestTeacherId: teacherId
      });
      return res.status(403).json({ message: 'Nu aveți permisiunea de a analiza acest quiz' });
    }

    // Verificăm raport existent
    console.log('[3] Checking for existing report');
    const existingReport = await AIAnalysisReport.findOne({ quiz: quizId });
    console.log('[4] Existing report check result:', {
      exists: !!existingReport,
      reportId: existingReport?._id
    });

    if (existingReport) {
      return res.json({ message: 'Raport existent găsit', report: existingReport });
    }

    // Obținem rezultatele
    console.log('[5] Fetching student results');
    const results = await StudentQuizResult.find({ quiz: quizId });
    console.log('[6] Results found:', {
      count: results.length,
      sampleResult: results[0] ? {
        studentId: results[0].student,
        score: results[0].score
      } : null
    });
    
    if (results.length === 0) {
      console.log('[ERROR] No results found for quiz');
      return res.status(400).json({ message: 'Nu există rezultate pentru acest quiz' });
    }

    // Calculăm statistici
    console.log('[7] Calculating statistics');
    const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = (totalScore / results.length).toFixed(2);
    console.log('[8] Statistics calculated:', {
      totalScore,
      averageScore,
      numberOfResults: results.length
    });

    // Analizăm întrebările
    console.log('[9] Starting question analysis');
    const questionAnalysis = quiz.questions.map((question, qIndex) => {
      try {
        console.log(`[9.${qIndex}] Analyzing question:`, {
          questionId: question._id,
          questionNumber: qIndex + 1
        });

        const questionResults = results.map(r => r.answers[qIndex]);
        const correctAnswers = questionResults.filter(a => a.isCorrect).length;
        const incorrectAnswers = questionResults.length - correctAnswers;

        // Analiză răspunsuri greșite
        const wrongAnswers = questionResults
          .filter(a => !a.isCorrect)
          .reduce((acc, curr) => {
            acc[curr.selectedAnswer] = (acc[curr.selectedAnswer] || 0) + 1;
            return acc;
          }, {});

        const commonWrongAnswers = Object.entries(wrongAnswers)
          .map(([answer, count]) => ({ answer, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        console.log(`[9.${qIndex}] Question analysis results:`, {
          correctAnswers,
          incorrectAnswers,
          commonWrongAnswersCount: commonWrongAnswers.length
        });

        return {
          questionId: question._id,
          questionText: question.questionText,
          correctAnswers,
          incorrectAnswers,
          commonWrongAnswers
        };
      } catch (error) {
        console.error(`[ERROR] Failed to analyze question ${qIndex}:`, error);
        throw error;
      }
    });

    // Pregătim date pentru OpenAI
    console.log('[10] Preparing OpenAI analysis data');
    const analysisData = {
      totalStudents: results.length,
      averageScore: parseFloat(averageScore),
      questionAnalysis,
      correctAnswerRate: questionAnalysis.map(q => 
        (q.correctAnswers / (q.correctAnswers + q.incorrectAnswers)) * 100
      ),
      originalText: quiz.originalText // Adăugăm materialul original
    };

    console.log('[11] Analysis data prepared:', {
      totalStudents: analysisData.totalStudents,
      averageScore: analysisData.averageScore,
      questionCount: analysisData.questionAnalysis.length,
      hasOriginalText: !!analysisData.originalText
    });

    // Generăm analiza OpenAI
    console.log('[12] Requesting OpenAI analysis');
    const openAIResponse = await getOpenAIResponseForAnalysis(analysisData);
    
    // Actualizăm schema AIAnalysisReport pentru a include noua analiză a conceptelor
   
    const aiReport = new AIAnalysisReport({
      quiz: quizId,
      lesson: quiz.lesson._id,
      totalStudents: results.length,
      averageScore: parseFloat(averageScore),
      analysisPoints: openAIResponse.analysisPoints,
      recommendedFocus: openAIResponse.recommendedFocus,
      conceptAnalysis: openAIResponse.conceptAnalysis, // Adăugăm analiza conceptelor
      generatedAt: new Date()
    });


    // Salvăm raportul
    console.log('[14] Creating AI report');
   

    console.log('[15] Saving AI report');
    await aiReport.save();
    console.log('[16] AI report saved successfully:', {
      reportId: aiReport._id
    });

    res.json({ message: 'Analiză generată cu succes', report: aiReport });
    console.log('=================== END generateQuizAnalysis ===================');
  } catch (error) {
    console.error('=================== ERROR in generateQuizAnalysis ===================');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Eroare de server' });
  }
};

const getOpenAIResponseForAnalysis = async (analysisData) => {
  console.log('=================== START getOpenAIResponseForAnalysis ===================');
  console.log('Analysis data received:', {
    totalStudents: analysisData.totalStudents,
    averageScore: analysisData.averageScore,
    questionCount: analysisData.questionAnalysis?.length,
    hasOriginalText: !!analysisData.originalText
  });

  try {
    console.log('[1] Initializing OpenAI');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('[2] OpenAI initialized successfully');

    const prompt = `
      Analizează următoarele date despre un quiz și materialul de curs asociat:
      
      MATERIAL DE CURS:
      ${analysisData.originalText}
      
      STATISTICI QUIZ:
      Număr total de studenți: ${analysisData.totalStudents}
      Scor mediu: ${analysisData.averageScore}%
      
      ANALIZA PE ÎNTREBĂRI:
      ${JSON.stringify(analysisData.questionAnalysis, null, 2)}
      
      RATA DE RĂSPUNSURI CORECTE:
      ${analysisData.correctAnswerRate.map((rate, idx) => 
        `Întrebarea ${idx + 1}: ${rate.toFixed(1)}%`
      ).join('\n')}

      Pe baza materialului de curs și a performanței studenților, te rog să generezi:
      1. 3-5 puncte de analiză relevante despre performanța la quiz și înțelegerea materialului
      2. 2-3 recomandări specifice pentru îmbunătățirea învățării, făcând referire la conceptele din material care necesită aprofundare
      3. Identifică conceptele din material care au fost bine înțelese și cele care necesită clarificări suplimentare

      Răspunde în următorul format JSON:
      {
        "analysisPoints": [
          { "point": "Titlu scurt", "description": "Descriere detaliată" }
        ],
        "recommendedFocus": ["Recomandare specifică 1", "Recomandare specifică 2"],
        "conceptAnalysis": {
          "wellUnderstood": ["Concept 1", "Concept 2"],
          "needsImprovement": ["Concept 3", "Concept 4"]
        }
      }
    `;

    console.log('[3] Sending request to OpenAI');
    console.log('Prompt length:', prompt.length);

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: 0.7,
      max_tokens: 1500
    });

    console.log('[4] OpenAI response received');
    const content = response.choices[0].message.content;
    console.log('[5] Parsing JSON response');
    const parsedResponse = JSON.parse(content);
    
    console.log('[6] Response parsed successfully:', {
      hasAnalysisPoints: !!parsedResponse.analysisPoints,
      hasRecommendedFocus: !!parsedResponse.recommendedFocus,
      hasConceptAnalysis: !!parsedResponse.conceptAnalysis
    });

    return parsedResponse;

  } catch (error) {
    console.error('=================== ERROR in getOpenAIResponseForAnalysis ===================');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      apiKeyExists: !!process.env.OPENAI_API_KEY
    });

    return {
      analysisPoints: [{
        point: "Eroare la generarea analizei",
        description: "Nu s-a putut genera o analiză detaliată din cauza unei erori tehnice."
      }],
      recommendedFocus: ["Verificați conexiunea la serviciul de analiză"],
      conceptAnalysis: {
        wellUnderstood: [],
        needsImprovement: []
      }
    };
  }
};

export const getQuizAnalysisReport = async (req, res) => {
  console.log('=================== START getQuizAnalysisReport ===================');
  console.log('Request params:', req.params);
  console.log('Teacher ID:', req.user?.id);

  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;

    console.log('[1] Searching for quiz:', { quizId });
    const quiz = await Quiz.findById(quizId).populate('lesson');
    console.log('[2] Quiz search result:', {
      found: !!quiz,
      lessonId: quiz?.lesson?._id,
      teacherId: quiz?.lesson?.teacher?.toString()
    });

    if (!quiz) {
      console.log('[ERROR] Quiz not found');
      return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
    }

    if (quiz.lesson.teacher.toString() !== teacherId) {
      console.log('[ERROR] Permission denied', {
        quizTeacherId: quiz.lesson.teacher.toString(),
        requestTeacherId: teacherId
      });
      return res.status(403).json({ message: 'Nu aveți permisiunea de a accesa această analiză' });
    }

    console.log('[3] Searching for analysis report');
    const report = await AIAnalysisReport.findOne({ quiz: quizId });
    console.log('[4] Report search result:', {
      found: !!report,
      reportId: report?._id,
      generatedAt: report?.generatedAt
    });

    if (!report) {
      console.log('[ERROR] Report not found');
      return res.status(404).json({ message: 'Raportul de analiză nu a fost găsit' });
    }
  
    res.json({ report });
    console.log('=================== END getQuizAnalysisReport ===================');
  } catch (error) {
    console.error('=================== ERROR in getQuizAnalysisReport ===================');
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Eroare de server' });
  }
};

export const getPresentStudents = async (req, res) => {
  try {
    const { lessonId } = req.params;

    // Găsim toate înregistrările de prezență pentru lecția dată unde attended este true
    const attendanceRecords = await Attendance.find({ lesson: lessonId, attended: true }).populate('student', 'name');

    // Extragem doar informațiile despre student
    const presentStudents = attendanceRecords.map(record => ({
      id: record.student._id,
      name: record.student.name,
    }));

    res.json(presentStudents);
  } catch (error) {
    console.error('Eroare la obținerea studenților prezenți:', error);
    res.status(500).json({ message: 'Eroare de server la obținerea studenților prezenți' });
  }
};