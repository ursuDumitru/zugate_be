// utils/openai.js

import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const getOpenAIFeedbackSummarize = async (feedbackText) => {
  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: "Esti un asistent bun" },
      { role: "user", content: `Sumarizeaza urmatorul feedback ${feedbackText}` },
    ],
  });

  return response.data;
};