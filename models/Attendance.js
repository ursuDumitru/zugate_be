// models/Attendance.js
import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  attended: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

const Attendance = mongoose.model('Attendance', AttendanceSchema);
export default Attendance;