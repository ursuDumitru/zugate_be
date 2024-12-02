import mongoose from 'mongoose';


const LessonSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    pdfPath: { type: String },
    quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }], // Modificat aici
});

const Lesson = mongoose.model('Lesson', LessonSchema);
export default Lesson;