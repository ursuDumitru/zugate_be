import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

// Function to extract text from a PDF and save it as a JSON file with sentence IDs
const extractTextFromPDF = async (pdfPath) => {
  try {
    console.log('Extracting text from PDF:', pdfPath);
    // Read the PDF file asynchronously
    const data = await fs.readFile(pdfPath);

    // Parse the PDF to extract text
    const pdfData = await pdfParse(data);

    const extractedText = pdfData.text;

    // Separate the text into sentences using a simple regex pattern
    const sentences = extractedText.split(/(?<=\.|\?|\!)(?=\s)/);

    // Create an array of sentences with unique sentence IDs
    const sentencesWithID = sentences.map((sentence, index) => ({
      sentenceID: index + 1,  // Sentence IDs start from 1
      sentence: sentence.trim()
    }));

    // Define the path to save the JSON file
    const jsonFilePath = pdfPath.replace('.pdf', '_sentences.json');

    // Write the sentences with IDs to a JSON file
    await fs.writeFile(jsonFilePath, JSON.stringify(sentencesWithID, null, 2));

    console.log(`Sentences saved to: ${jsonFilePath}`);

    // Return the path of the saved JSON file
    return jsonFilePath;

  } catch (err) {
    throw new Error('Error processing PDF: ' + err);
  }
};

export { extractTextFromPDF };
