// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in the "uploads" directory
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = path.basename(file.originalname, ext);
    let fileNameToSave = fileName + '_received' + ext;

    // Check if a file with the same name already exists
    let counter = 1;
    while (fs.existsSync(path.join('uploads', fileNameToSave))) {
      fileNameToSave = fileName + '_received_' + counter + ext; // Append number to filename
      counter++;
    }

    cb(null, fileNameToSave); // Save the file with the unique name
  },
});

const upload = multer({ storage: storage });

export default upload;
