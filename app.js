import express from 'express';
import cors from 'cors';
import connectDB from './db.js';

import authRoutes from './src/routes/authRoutes.js';
import teacherRoutes from './src/routes/teacherRoutes.js';
import studentRoutes from './src/routes/studentRoutes.js';


const app = express();
const port = 5001;

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
