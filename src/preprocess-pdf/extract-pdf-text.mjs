import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import path from 'path';

// Function to extract text from a PDF and save it as a JSON file with sentence IDs
const extractTextFromPDF = async (pdfPath) => {
  try {
    console.log('Extracting text from PDF:', pdfPath);

    // Verify the full path and check if the file exists
    const absolutePath = path.resolve(pdfPath);
    console.log('Resolved PDF path:', absolutePath);

    // Attempt to read the file
    const data = await fs.readFile(absolutePath);

    // Parse the PDF to extract text
    const pdfData = await pdfParse(data);
    let extractedText = pdfData.text;

    // Remove all newline characters
    extractedText = extractedText.replace(/\n/g, ' ');

    // Separate the text into sentences using a simple regex pattern
    const sentences = extractedText.split(/(?<=\.|\?|\!)(?=\s)/);

    // Filter out sentences that are empty or contain only numbers, dots, and spaces
    const filteredSentences = sentences.filter(sentence =>
      sentence.trim() && !/^[\d.\s]+$/.test(sentence.trim())
    );

    // Create an array of sentences with unique sentence IDs
    const sentencesWithID = filteredSentences.map((sentence, index) => ({
      sentenceID: index + 1,  // Sentence IDs start from 1
      sentence: sentence.trim()
    }));

    // Define the path to save the JSON file in the 'uploads/courses_split' directory
    const fileName = path.basename(pdfPath, '.pdf');
    const jsonFilePath = path.join('uploads', 'courses_split', `${fileName}_split.json`);

    // Ensure the directory exists
    await fs.mkdir(path.dirname(jsonFilePath), { recursive: true });

    // Write the sentences with IDs to the JSON file
    await fs.writeFile(jsonFilePath, JSON.stringify(sentencesWithID, null, 2));
    console.log(`Sentences saved to: ${jsonFilePath}`);

    // Return the path of the saved JSON file
    return jsonFilePath;

  } catch (err) {
    console.error('Error processing PDF:', err);
    throw new Error('Error processing PDF: ' + err.message);
  }
};

export { extractTextFromPDF };
