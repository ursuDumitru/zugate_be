import { OpenAI } from 'openai';
import dotenv, { config } from 'dotenv';
import { saveQuizJson } from './save-quiz.js';

config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

const getOpenAIResponse = async (jsonData, numQuestions, numAnswers, baseFileName) => {
    let attempt = 0;
    let validResponse = false;
    let result = null;

    while (attempt < MAX_RETRIES && !validResponse) {
        try {
            attempt++;
            const sentences = JSON.stringify(jsonData);

            result = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                    role: "user",
                    content: `Eu sunt un profesor, acesta este un text dintr-un curs de al meu despre care vreau să fac un quiz : \n\n${sentences}\n\n
            Quiz-ul dat va avea ${numQuestions} intrebari, fiecare intrebare va avea ${numAnswers} variante de raspuns, 1 adevarata si restul false.
            Quizul va avea forma JSON, astfel:
            {
                "questions": [
                    {
                        "question": "Textul întrebării",
                        "sentenceIDs": ["ID-urile propozițiilor asociate cu întrebarea"],
                        "options": [
                            "Opțiunea 1",
                            "Opțiunea 2",
                            "..."
                        ],
                        "correctAnswerIndex": 0 // Indexul răspunsului corect (0-${numAnswers-1})
                    }
                ]
            }
            Răspunsul corect trebuie să fie plasat aleatoriu între opțiuni (nu mereu primul), iar indexul său să fie specificat în correctAnswerIndex.
            Răspunsul va conține doar datele despre quiz în format JSON fără text suplimentar.`,
                }],
            });

            const cleanedContent = result.choices[0].message.content.replace(/```json|```/g, '').trim();
            try {
                const response = JSON.parse(cleanedContent);

                if (!response.questions) {
                    throw new Error('Răspunsul JSON nu conține proprietatea "questions".');
                }

                // Verificăm că fiecare întrebare are un index corect și opțiuni valide
                response.questions.forEach(q => {
                    if (!q.hasOwnProperty('correctAnswerIndex') || 
                        q.correctAnswerIndex < 0 || 
                        q.correctAnswerIndex >= q.options.length) {
                        throw new Error('Index invalid pentru răspunsul corect.');
                    }
                });

                const quizFilePath = await saveQuizJson(response, baseFileName);
                validResponse = true;
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
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                throw new Error('Exceeded maximum retries. Unable to get valid response from OpenAI API.');
            }
        }
    }
};

export { getOpenAIResponse };