import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

export const getMistralFeedback = async (quizTitle, statistics, originalText) => {
  try {
    const prompt = `Ești un profesor expert în analiza rezultatelor și îmbunătățirea procesului de învățare.
    
Ai în față următoarele informații:

1. Textul original din care a fost generat quiz-ul:
"${originalText}"

2. Rezultatele quiz-ului "${quizTitle}":
${statistics.map((q, index) => {
  return `Întrebarea ${index + 1}: "${q.questionText}"
  - Răspunsuri corecte: ${q.correct}
  - Răspunsuri incorecte: ${q.incorrect}
  - Cele mai frecvente răspunsuri greșite: ${q.commonWrongAnswers?.join(', ') || 'N/A'}`;
}).join('\n\n')}

Te rog să analizezi aceste informații și să oferi:

1. O analiză detaliată a conceptelor care par să fie mai puțin înțelese, bazată pe corelația dintre textul original și răspunsurile incorecte
2. Sugestii specifice pentru aprofundarea acestor concepte, cu exemple concrete din text
3. Metode alternative de predare sau explicare a acestor concepte
4. Resurse sau activități suplimentare recomandate

Răspunsul tău ar trebui să fie specific și practic, concentrându-te pe cum poate profesorul să îmbunătățească înțelegerea elevilor.`;

    const result = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{
        content: prompt,
        role: "user",
      }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return result.choices[0].message.content.trim();
  } catch (error) {
    console.error('Eroare la comunicarea cu Mistral AI:', error);
    throw error;
  }
};