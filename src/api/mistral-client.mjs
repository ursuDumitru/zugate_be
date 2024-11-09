// const MistralClient = require('@mistralai/mistralai');
import { Mistral } from '@mistralai/mistralai';
// require('dotenv').config();
import dotenv, { config } from 'dotenv';

config();

// Initialize the Mistral client with the API key from the environment
const mistral = new Mistral({
    apiKey: process.env.MISTRAL_API_KEY,
});

// Function to send extracted text to the Mistral API
const getMistralResponse = async (text, numQuestions, numAnswers) => {
    try {
        const result = await mistral.chat.complete({
            model: "mistral-small-latest",
            messages: [{
                content: `Generează un quiz structurat în format JSON din următorul text:\n\n"${text}"\n\nCreează ${numQuestions} întrebări, fiecare cu ${numAnswers} răspunsuri posibile, în format JSON astfel:
                {
                    "questions": [
                        {
                            "question": "Textul întrebării",
                            "options": [
                                "Răspuns corect",
                                "Răspuns incorect 1",
                                "Răspuns incorect 2",
                                "Răspuns incorect 3"
                            ]
                        },
                        ...
                    ]
                }`,
                role: "user",
            }],
        });

        // Loghează răspunsul brut pentru a vedea ce primești de la Mistral
        console.log("Răspuns brut de la Mistral:", result.choices[0].message.content);

        // Curăță delimitatoarele de cod (dacă există) înainte de parsare
        const cleanedContent = result.choices[0].message.content.replace(/```json|```/g, '').trim();
        console.log("Conținut curățat:", cleanedContent);

        // Parsează conținutul curățat
        const response = JSON.parse(cleanedContent);

        // Verifică dacă `questions` există în răspuns
        if (!response.questions) {
            throw new Error('Răspunsul JSON nu conține proprietatea "questions". Verifică structura răspunsului.');
        }

        // Amestecă opțiunile pentru fiecare întrebare și păstrează răspunsul corect
        response.questions.forEach((question) => {
            const correctAnswer = question.options[0];
            question.options = question.options.sort(() => Math.random() - 0.5);
            question.correctAnswer = correctAnswer;
        });

        console.log("Quiz structurat:", response);
        return response;
    } catch (error) {
        console.error('Error with Mistral API:', error);
        throw error;
    }
};

export { getMistralResponse };
