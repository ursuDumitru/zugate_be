import Lesson from '../../../models/Lesson.js';
import Feedback from '../../../models/Feedback.js';
import { getOpenAIFeedbackSummarize } from './getOpenAIFeedbackSummarize.mjs';

import { config } from 'dotenv';


config();

const getFeedback = async (req, res) => {
    const { lessonId } = req.query;

    try {
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        const feedbacks = await Feedback.find({ lesson: lessonId }).populate('student');

        if (feedbacks.length === 0) {
            return res.status(404).json({ message: 'No feedback available for this lesson' });
        }

        const concatenatedFeedback = feedbacks.map(feedback => feedback.feedbackText).join(' ');

        try {
            const summaryResponse = await getOpenAIFeedbackSummarize(concatenatedFeedback);
            const summary = summaryResponse.choices[0].message.content.trim();

            res.status(200).json({
                lesson: lessonId,
                summary: summary  // Sending just the summary text
            });
        } catch (openAIError) {
            console.error('OpenAI Error:', openAIError);
            res.status(500).json({ message: 'Error generating feedback summary' });
        }
    } catch (error) {
        console.error('Error retrieving feedback:', error);
        res.status(500).json({ message: 'An error occurred while retrieving feedback' });
    }
};

export default getFeedback;