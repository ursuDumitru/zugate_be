// const MistralClient = require('@mistralai/mistralai');
import { Mistral } from '@mistralai/mistralai';
// require('dotenv').config();
import dotenv, { config } from 'dotenv';

config();

// Initialize the Mistral client with the API key from the environment
const mistral = new Mistral({
    apiKey: process.env["MISTRAL_API_KEY"] ?? "",
});

// Function to send extracted text to the Mistral API
const getMistralResponse = async (text) => {
    try {
        const result = await mistral.chat.complete({
            model: "mistral-small-latest",
            messages: [{
                content: text,
                role: "user",
            },],});

        // Extract and return the response from Mistral API
        console.log(result);
        return result.choices[0].message.content;
    } catch (error) {
        console.error('Error with Mistral API:', error);
        throw error;
    }
};

export { getMistralResponse };
