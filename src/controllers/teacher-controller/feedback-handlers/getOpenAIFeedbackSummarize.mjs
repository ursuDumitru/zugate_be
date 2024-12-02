import { config } from 'dotenv';


config();

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

const getOpenAIFeedbackSummarize = async (feedbackText) => {
    let attempt = 0;
    let result = null;

    while (attempt < MAX_RETRIES) {
        try {
            result = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: `Eu sunt un profesor, acesta este un feedback pe care l-am primit de la un student si vreau sa il rezum pentru a-l intelege mai bine: \n\n${feedbackText}\n\nRezuma in 5 propozitii scurte feedback-ul dat de studenti.`,
                    }
                ],
            });
            return result; // Return result if successful
        } catch (error) {
            console.error(`Attempt ${attempt + 1}: Error with OpenAI API:`, error);
            attempt += 1;
            if (attempt < MAX_RETRIES) {
                console.log(`Retrying... (${attempt}/${MAX_RETRIES})`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            } else {
                throw new Error('Exceeded maximum retries. Unable to get valid response from OpenAI API.');
            }
        }
    }
};

export { getOpenAIFeedbackSummarize };
