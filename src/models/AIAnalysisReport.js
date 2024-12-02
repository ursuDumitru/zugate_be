import mongoose from 'mongoose';


const AIAnalysisReportSchema = new mongoose.Schema({
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    totalStudents: { type: Number, required: true },
    averageScore: { type: Number, required: true },
    analysisPoints: [{
        point: { type: String, required: true },
        description: { type: String, required: true }
    }],
    recommendedFocus: [{ type: String }],
    generatedAt: { type: Date, default: Date.now }
});

const AIAnalysisReport = mongoose.model('AIAnalysisReport', AIAnalysisReportSchema);
export default AIAnalysisReport;