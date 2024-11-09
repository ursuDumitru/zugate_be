import fs from 'fs/promises'; // Use fs.promises for easier async handling
import pdfParse from 'pdf-parse';

// Function to extract text from a PDF
const extractTextFromPDF = async (pdfPath) => {
  try {
    console.log('Extracting text from PDF:', pdfPath);
    // Read the PDF file asynchronously using fs.promises
    const data = await fs.readFile(pdfPath);

    // Parse the PDF
    const pdfData = await pdfParse(data);

    const extractedText = pdfData.text;

    // Return the extracted text
    return extractedText; // You can also log it here if needed: console.log(extractedText);
  } catch (err) {
    throw new Error('Error processing PDF: ' + err);
  }
};

export { extractTextFromPDF };
