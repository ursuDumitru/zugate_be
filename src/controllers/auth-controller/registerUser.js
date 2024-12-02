import User from '../../models/User.js';
import Class from '../../models/Class.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';


const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, className, subject } = req.body;

        // Verificăm dacă utilizatorul există deja
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Email deja folosit' });
        }

        // Criptarea parolei si crearea utilizatorului
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        user = new User({
            name,
            email,
            passwordHash,
            role,
        });

        if (role === 'student') {
            // Găsim sau creăm clasa
            let studentClass = await Class.findOne({ name: className });
            if (!studentClass) {
                studentClass = new Class({ name: className });
                await studentClass.save();
            }

            // Adăugăm utilizatorul la clasa respectivă
            user.class = studentClass._id;
            studentClass.students.push(user._id);
            await studentClass.save();
        } else if (role === 'teacher') {
            user.subject = subject;
        }

        await user.save();

        // Crearea payload-ului pentru token
        const payload = {
            user: {
                id: user._id,
                role: user.role,
            },
        };

        // Generarea token-ului JWT
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token });
    } catch (error) {
        console.error('Eroare la înregistrare:', error);
        res.status(500).json({ message: 'Eroare de server' });
    }
};

export default registerUser;