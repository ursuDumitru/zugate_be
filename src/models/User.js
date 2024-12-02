import mongoose from 'mongoose';


const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], required: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }, // Doar pentru elevi
    subject: { type: String }, // Doar pentru profesori
});

const User = mongoose.model('User', UserSchema);
export default User;