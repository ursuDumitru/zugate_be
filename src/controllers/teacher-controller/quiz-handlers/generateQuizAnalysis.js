import Quiz from '../../../models/Quiz.js';
import AIAnalysisReport from '../../../models/AIAnalysisReport.js';
import StudentQuizResult from '../../../models/StudentQuizResult.js';

import { config } from 'dotenv';


config();

const generateQuizAnalysis = async (req, res) => {
    console.log('=================== START generateQuizAnalysis ===================');
    try {
        const { quizId } = req.params;
        const teacherId = req.user.id;

        // Verificăm quiz-ul și permisiunile
        const quiz = await Quiz.findById(quizId).populate('lesson');
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
        }

        if (quiz.lesson.teacher.toString() !== teacherId) {
            return res.status(403).json({ message: 'Nu aveți permisiunea de a analiza acest quiz' });
        }

        // Ștergem raportul existent
        await AIAnalysisReport.deleteOne({ quiz: quizId });

        // Obținem rezultatele
        const results = await StudentQuizResult.find({ quiz: quizId });
        if (results.length === 0) {
            return res.status(400).json({ message: 'Nu există rezultate pentru acest quiz' });
        }

        console.log('Results found:', results.length);
        console.log('Sample result:', JSON.stringify(results[0], null, 2));

        // Calculăm statistici
        const totalScore = results.reduce((acc, curr) => acc + (curr.score || 0), 0);
        const averageScore = (totalScore / results.length).toFixed(2);

        // Analizăm întrebările
        const questionAnalysis = quiz.questions.map((question, qIndex) => {
            // Verificăm că avem răspunsuri pentru această întrebare
            const questionResults = results.map(r => {
                const answer = r.answers && r.answers[qIndex];
                if (!answer) {
                    console.log(`No answer found for question ${qIndex} in result:`, r);
                    return { isCorrect: false, selectedAnswer: null };
                }
                return answer;
            });

            const correctAnswers = questionResults.filter(a => a?.isCorrect).length;
            const incorrectAnswers = questionResults.length - correctAnswers;

            // Analiză răspunsuri greșite
            const wrongAnswers = questionResults
                .filter(a => !a?.isCorrect && a?.selectedAnswer)
                .reduce((acc, curr) => {
                    if (curr.selectedAnswer) {
                        acc[curr.selectedAnswer] = (acc[curr.selectedAnswer] || 0) + 1;
                    }
                    return acc;
                }, {});

            const commonWrongAnswers = Object.entries(wrongAnswers)
                .map(([answer, count]) => ({ answer, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);

            return {
                questionId: question._id,
                questionText: question.questionText,
                correctAnswers,
                incorrectAnswers,
                commonWrongAnswers,
                totalAnswers: questionResults.length
            };
        });

        console.log('Question analysis completed:', JSON.stringify(questionAnalysis, null, 2));

        // Pregătim date pentru OpenAI
        const analysisData = {
            totalStudents: results.length,
            averageScore: parseFloat(averageScore),
            questionAnalysis,
            correctAnswerRate: questionAnalysis.map(q =>
                ((q.correctAnswers / (q.correctAnswers + q.incorrectAnswers)) * 100) || 0
            ),
            originalText: quiz.originalText || ''
        };

        // Generăm analiza OpenAI
        const openAIResponse = await getOpenAIResponseForAnalysis(analysisData);

        // Creăm și salvăm noul raport
        const aiReport = new AIAnalysisReport({
            quiz: quizId,
            lesson: quiz.lesson._id,
            totalStudents: results.length,
            averageScore: parseFloat(averageScore),
            analysisPoints: openAIResponse.analysisPoints || [{
                point: "Analiză de bază",
                description: "O analiză detaliată nu a putut fi generată"
            }],
            recommendedFocus: openAIResponse.recommendedFocus || ["Revizuiți materialul de bază"],
            generatedAt: new Date()
        });

        await aiReport.save();

        res.json({
            message: 'Analiză generată cu succes',
            report: aiReport
        });

    } catch (error) {
        console.error('Error in generateQuizAnalysis:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Eroare de server',
            error: error.message
        });
    }
};

export default generateQuizAnalysis;