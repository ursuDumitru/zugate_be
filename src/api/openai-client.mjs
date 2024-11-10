import { OpenAI } from 'openai';  // Import OpenAI SDK
import dotenv, { config } from 'dotenv';
import { saveQuizJson } from './save-quiz.js';

config(); // Load environment variables

// Initialize the OpenAI client with the API key
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,  // Make sure the OPENAI_API_KEY is set in your .env file
});

const MAX_RETRIES = 5; // Max number of retries
const RETRY_DELAY = 2000; // Delay in milliseconds between retries

// Function to interact with the OpenAI API and generate a quiz
const getOpenAIResponse = async (jsonData, numQuestions, numAnswers, baseFileName) => {
    let attempt = 0;
    let validResponse = false;
    let result = null;

    while (attempt < MAX_RETRIES && !validResponse) {
        try {
            attempt++;

            // const randomSentences = getRandomSentences(jsonData, X);
            const sentences = JSON.stringify(jsonData);

            console.log('DIMA : ', numQuestions)

            result = await openai.chat.completions.create({
                model: "gpt-4o-mini",  // GPT-4 model
                messages: [{
                    role: "user",  // Ensure that role is explicitly set to "user"
                    content: `Eu sunt un profesor, acesta este un text dintr-un curs de al meu despre care vreau să fac un quiz : \n\n${sentences}\n\n
            Quiz-ul dat va avea ${numQuestions} intrebari, fiecare cu cate ${numAnswers} variante de raspuns.
            Quizul va avea forma JSON, astfel:
            {
                "questions": [
                    {
                        "question": "Textul întrebării",
                        "sentenceIDs": ["ID-urile propozițiilor asociate cu întrebarea"],
                        "options": [
                            "Răspuns corect",
                            "Răspuns incorect 1",
                            "Răspuns incorect 2",
                            "Răspuns incorect 3"
                        ]
                    },
                    ...
                ]
            }
            Raspunsul va contine doar datele despre quiz in format JSON fara text suplimenar.`,
                }],
            });

            // Clean up the response content
            const cleanedContent = result.choices[0].message.content.replace(/```json|```/g, '').trim();
            try {
                const response = JSON.parse(cleanedContent);

                // Validate the response structure
                if (!response.questions) {
                    throw new Error('Răspunsul JSON nu conține proprietatea "questions". Verifică structura răspunsului.');
                }

                // Save the quiz to a JSON file
                const quizFilePath = await saveQuizJson(response, baseFileName);
                validResponse = true; // Valid response received, exit loop

                // Return the file path where the quiz was saved
                return quizFilePath;

            } catch (parseError) {
                console.error(`Attempt ${attempt}: Error parsing OpenAI response:`, parseError);
                if (attempt >= MAX_RETRIES) {
                    throw new Error('Exceeded maximum retries. Unable to parse valid JSON response.');
                }
            }

        } catch (error) {
            console.error(`Attempt ${attempt}: Error with OpenAI API:`, error);
            if (attempt < MAX_RETRIES) {
                console.log(`Retrying... (${attempt + 1}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY)); // Wait before retrying
            } else {
                throw new Error('Exceeded maximum retries. Unable to get valid response from OpenAI API.');
            }
        }
    }
};

export { getOpenAIResponse };
