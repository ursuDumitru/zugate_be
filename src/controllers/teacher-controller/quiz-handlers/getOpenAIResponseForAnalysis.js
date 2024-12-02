import { config } from 'dotenv';
import e from 'express';


config();

const getOpenAIResponseForAnalysis = async (analysisData) => {
    try {
        // Prompt-ul pentru a genera analiza
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

        // Obținem completarea de la OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 1500
        });

        const content = response.choices[0].message.content;
        const parsedResponse = JSON.parse(content);

        return parsedResponse;
    } catch (error) {
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

export default getOpenAIResponseForAnalysis;
