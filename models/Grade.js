// models/Grade.js
import mongoose from 'mongoose';

const GradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  grade: { type: Number, required: true }, // note: schimbat la integer
  note: { type: String } // câmpul suplimentar pentru notiță
});

const Grade = mongoose.model('Grade', GradeSchema);
export default Grade;