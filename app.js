import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import connectDB from './db.js';
const app = express();
const port = 5001;

import authRoutes from './routes/authRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

// Variable to store extracted text from the PDF
let extractedText = '';

// Middleware to enable CORS
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
connectDB();


// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
