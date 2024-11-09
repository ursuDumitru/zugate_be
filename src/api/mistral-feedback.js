// src/api/mistral-feedback.js

import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

export const getMistralFeedback = async (quizTitle, statistics) => {
  try {
    // Construim un prompt pentru Mistral AI
    const prompt = `Am administrat un quiz intitulat "${quizTitle}". Rezultatele sunt următoarele:
${statistics.map((q, index) => {
  return `Întrebarea ${index + 1}: "${q.questionText}"
  - Răspunsuri corecte: ${q.correct}
  - Răspunsuri incorecte: ${q.incorrect}`;
}).join('\n\n')}
Analizează aceste rezultate și oferă-mi sugestii despre subiectele la care ar trebui să pun mai mult accent în lecțiile viitoare. `;

    const result = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{
        content: prompt,
        role: "user",
      }],
    });

    const feedback = result.choices[0].message.content.trim();

    return feedback;
  } catch (error) {
    console.error('Eroare la comunicarea cu Mistral AI:', error);
    throw error;
  }
};