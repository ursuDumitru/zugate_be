import Quiz from '../../../models/Quiz.js';


const getQuiz = async (req, res) => {
    console.log("Quiz ID:", req.params.id); // Log pentru verificare
    try {
        // Obține quiz-ul
        const quiz = await Quiz.findOne({ _id: req.params.id, approved: true });

        // Verifică dacă quiz-ul există
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz-ul nu a fost găsit' });
        }

        // Returnează quiz-ul
        res.json({ quiz });
    } catch (error) {
        console.error('Eroare la obținerea quiz-ului:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default getQuiz;