import fs from 'fs/promises';
import path from 'path';


// Function to save quiz data as JSON
const saveQuizJson = async (quizData, baseFileName) => {
    try {
        // Define the path to save the quiz JSON in `uploads/coursesQuiz`
        const quizFilePath = path.join('uploads', 'coursesQuiz', `${baseFileName}_quiz.json`);

        // Ensure the directory exists
        await fs.mkdir(path.dirname(quizFilePath), { recursive: true });

        // Write the quiz data to the file
        await fs.writeFile(quizFilePath, JSON.stringify(quizData, null, 2));

        console.log(`Quiz saved to: ${quizFilePath}`);
        return quizFilePath;
    } catch (error) {
        console.error('Error saving quiz JSON:', error);
        throw new Error('Could not save quiz JSON: ' + error.message);
    }
};

export { saveQuizJson };
